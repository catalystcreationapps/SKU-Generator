import axios from "axios";
import shopify from "../shopify.js";
import { LATEST_API_VERSION } from "@shopify/shopify-api";

const ONE_TIME_PURCHASES_QUERY = `
  query appPurchases($endCursor: String) {
    currentAppInstallation {
      oneTimePurchases(first: 250, sortKey: CREATED_AT, after: $endCursor) {
        edges {
          node {
           id, name, test, status, createdAt,
           price {
            amount
            currencyCode
            }
          }
        }
        pageInfo {
          hasNextPage, endCursor
        }
      }
    }
  }
`;

const ONETIME_PURCHASE_MUTATION = `mutation AppPurchaseOneTimeCreate($name: String!, $price: MoneyInput!, $returnUrl: URL!, $test: Boolean) {
  appPurchaseOneTimeCreate(name: $name, returnUrl: $returnUrl, price: $price, test: $test) {
    userErrors {
      field
      message
    }
    appPurchaseOneTime {
      createdAt
      id
    }
    confirmationUrl
  }
}`;

const RECURRING_PURCHASES_QUERY = `
  query appSubscription {
    currentAppInstallation {
      activeSubscriptions {
        id, name, status, createdAt, currentPeriodEnd
      }
    }
  }
`;

const RECURRING_PURCHASE_MUTATION = `
  mutation test(
    $name: String!
    $lineItems: [AppSubscriptionLineItemInput!]!
    $returnUrl: URL!
    $trialDays: Int
    $test: Boolean
  ) {
    appSubscriptionCreate(
      name: $name
      lineItems: $lineItems
      returnUrl: $returnUrl
      trialDays: $trialDays
      test: $test
    ) {
      confirmationUrl
      userErrors {
        field
        message
      }
    }
  }
`;

let isProd;

export function ShopifyBillingError(message, errorData) {
  this.name = "ShopifyBillingError";
  this.stack = new Error().stack;

  this.message = message;
  this.errorData = errorData;
}
ShopifyBillingError.prototype = new Error();

export async function requestOnlyPayment(
  session,
  { chargeName, amount, currencyCode, interval, trialDays, blackFridayOffer }
) {
  try {
    if (
      session.shop == "boring-drops.myshopify.com" ||
      session.shop == "boring-snow.myshopify.com"
    ) {
      isProd = false;
    } else {
      isProd = true;
    }
    const client = new shopify.api.clients.Graphql({ session });
    const returnUrl = `${process.env.HOST}?shop=${
      session.shop
    }&host=${Buffer.from(`${session.shop}/admin`).toString("base64")}`;

    let data;
    let mutationResponse;

    if (interval) {
      mutationResponse = await requestRecurringPayment(client, returnUrl, {
        chargeName,
        amount,
        currencyCode,
        interval,
        trialDays,
        blackFridayOffer,
      });
      data = mutationResponse.body.data.appSubscriptionCreate;
    } else {
      mutationResponse = await requestOnetimePayment(client, returnUrl, {
        chargeName,
        amount,
        currencyCode,
      });
      data = mutationResponse.body.data.appPurchaseOneTimeCreate;
    }

    if (data.userErrors.length) {
      throw new ShopifyBillingError(
        "Error while billing the store",
        data.userErrors
      );
    }

    return data.confirmationUrl;
  } catch (error) {
    console.log(error);
  }
}

async function requestRecurringPayment(
  client,
  returnUrl,
  { chargeName, amount, currencyCode, interval, trialDays, blackFridayOffer }
) {
  try {
    const lineItems = [
      {
        plan: {
          appRecurringPricingDetails: {
            interval,
            price: { amount, currencyCode },
            ...(blackFridayOffer && {
              discount: {
                value: {
                  amount: 38.0,
                },
                durationLimitInIntervals: 1,
              },
            }),
          },
        },
      },
    ];

    const mutationResponse = await client.query({
      data: {
        query: RECURRING_PURCHASE_MUTATION,
        variables: {
          name: chargeName,
          lineItems,
          returnUrl,
          trialDays,
          test: !isProd,
        },
      },
    });

    if (mutationResponse.body.errors && mutationResponse.body.errors.length) {
      throw new ShopifyBillingError(
        "Error while billing the store",
        mutationResponse.body.errors
      );
    }

    return mutationResponse;
  } catch (error) {
    console.log(error);
  }
}

async function requestOnetimePayment(
  client,
  returnUrl,
  { chargeName, amount, currencyCode }
) {
  try {
    const mutationResponse = await client.query({
      data: {
        query: ONETIME_PURCHASE_MUTATION,
        variables: {
          name: chargeName,
          returnUrl,
          price: {
            amount,
            currencyCode,
          },
          test: !isProd,
        },
      },
    });

    if (mutationResponse.body.errors && mutationResponse.body.errors.length) {
      throw new ShopifyBillingError(
        "Error while billing the store",
        mutationResponse.body.errors
      );
    }

    return mutationResponse;
  } catch (error) {
    console.log(error);
  }
}

export async function checkForActiveChargesGraphql(session) {
  const client = new shopify.api.clients.Graphql({ session });

  const currentInstallations = await client.query({
    data: ONE_TIME_PURCHASES_QUERY,
  });

  const subscriptions =
    currentInstallations.body.data.currentAppInstallation.oneTimePurchases
      .edges;

  const latestExpiredPurchase = subscriptions.filter(
    (purchase) => purchase.node.status === "ACTIVE"
  );

  return latestExpiredPurchase[latestExpiredPurchase.length - 1];
}

export async function checkForActiveChargesGraphqlForName(session) {
  try {
    const client = new shopify.api.clients.Graphql({ session });

    const currentInstallations = await client.query({
      data: RECURRING_PURCHASES_QUERY,
    });
    const subscriptions =
      currentInstallations.body.data.currentAppInstallation.activeSubscriptions;
    return subscriptions[subscriptions.length - 1];
  } catch (error) {
    console.log(error);
  }
}

export async function deleteActiveCharge(session) {
  try {
    // Get all recurring charges
    const response = await axios({
      url: `https://${session.shop}/admin/api/${LATEST_API_VERSION}/recurring_application_charges.json`,
      headers: {
        "X-Shopify-Access-Token": session.accessToken,
      },
      method: "GET",
    });

    // Find the active recurring charge
    const activeCharge = response.data.recurring_application_charges.find(
      (charge) => charge.status === "active"
    );

    if (!activeCharge) {
      console.log("No active recurring charge found.");
      return;
    }

    // Delete the active recurring charge
    await axios({
      url: `https://${session.shop}/admin/api/${LATEST_API_VERSION}/recurring_application_charges/${activeCharge.id}.json`,
      headers: {
        "X-Shopify-Access-Token": session.accessToken,
      },
      method: "DELETE",
    });

    console.log(`Recurring charge ${activeCharge.id} has been cancelled.`);
    const id = activeCharge.id;
    return id;
  } catch (error) {
    console.error(error);
  }
}
