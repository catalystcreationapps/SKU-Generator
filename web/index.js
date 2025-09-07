// @ts-nocheck
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import mongoose from "mongoose";
import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import GDPRWebhookHandlers from "./gdpr.js";
import onetimeSetup from "./helpers/onetime-setup.js";
import {
  requestOnlyPayment,
  deleteActiveCharge,
  checkForActiveChargesGraphql,
  checkForActiveChargesGraphqlForName,
} from "./helpers/billing-helpers.js";
import {
  createNewWebhook,
  createWebhookOnetimePurchase,
} from "./helpers/webhook-handler.js";
import nodemailer from "nodemailer";
import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter.js";
import { ExpressAdapter } from "@bull-board/express";
import cron from "node-cron";
import BillingDetailsModel from "./models/BillingDetailsModel.js";
import FreePlanStoreModel from "./models/FreePlanStoreModel.js";
import Queue from "bull";
import {
  fetchProductData,
  skuGenerator,
  skuGeneratorForWebhook,
} from "./sku-generator.js";
import { verifyWebhook } from "./helpers/webhook-handler.js";
import {
  incrementProductAddedInThisMonth,
  updateBodyNumber,
  processProductCreation,
  incrementSkuCreatedInThisMonth,
  decrementRemainingCredits,
} from "./helpers/handleWebhook.js";
import {
  chunkArray,
  getProducts,
  getProductsWithMetafields,
  getShopEmail,
  savePreference,
} from "./helpers/sku-generator-helpers.js";
import shopifyErrorHandler from "./helpers/error-handler.js";

mongoose.connect(process.env.DATABASE_URL);
mongoose.connection.on("connected", () => {
  console.log("connected to database");
});
mongoose.connection.on("error", (error) => {
  console.log("error occured on connecting", error);
});

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT, 10);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

const skuQueue = new Queue("skuQueue", "redis://red-ch6a45jhp8u9bo1kutlg:6379");
const queueForWebhook = new Queue(
  "queueForWebhook",
  "redis://red-ch6a45jhp8u9bo1kutlg:6379"
);
// const skuQueue = new Queue("skuQueue");
// const queueForWebhook = new Queue("queueForWebhook");

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [new BullAdapter(skuQueue), new BullAdapter(queueForWebhook)],
  serverAdapter: serverAdapter,
});

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  async (_req, res, next) => {
    try {
      const session = res.locals.shopify.session;
      await onetimeSetup(session);
      const appUrl = shopify.api.auth.buildEmbeddedAppUrl(
        Buffer.from(
          `admin.shopify.com/store/${session.shop.replace(
            ".myshopify.com",
            ""
          )}`
        ).toString("base64")
      );
      return res.redirect(`${appUrl}/onboarding`);
      next();
    } catch (error) {
      console.log(error);
    }
  },
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers })
);

app.post(
  "/api/webhook/handle",
  express.raw({ type: "application/json", limit: "50mb" }),
  async (req, res) => {
    console.log("Webhook heard!");

    // Verify webhook
    const hmac = req.header("X-Shopify-Hmac-Sha256");
    const topic = req.header("X-Shopify-Topic");
    const shop = req.header("X-Shopify-Shop-Domain");
    const isVerified = verifyWebhook(req.body, hmac);

    if (!isVerified) {
      console.log("Failed to verify the incoming request.");
      res.status(401).send("Could not verify request.");
      return;
    }

    const payload = JSON.parse(req.body.toString());

    console.log("payload", payload);

    if (topic === "products/create") {
      console.log("Here")
      try {
        const sessionId = shopify.api.session.getOfflineId(shop || "");
        const session = await shopify.config.sessionStorage.loadSession(
          sessionId
        );
        const client = new shopify.api.clients.Rest({ session });
        const shopDetails = await client.get({ path: "shop" });
        await incrementProductAddedInThisMonth(shopDetails.body.shop.id);
        const jobData = await processProductCreation(
          shopDetails,
          payload,
          session
        );
        
        try {
          const job = await queueForWebhook.add(jobData);
          res.status(200).send("OK");
        } catch (jobError) {
          console.error("Error adding job:", jobError);
          throw jobError;
        }
      } catch (err) {
        console.error("SKU creation failed", err);
        res.status(500).send("Internal Server Error");
      }
    } else if (topic === "app_subscriptions/update") {
      console.log("Webhook for app subscription update heard!");
      console.log("Payload:", payload);
    } else {
      res.status(200).send("OK");
    }
  }
);

// All endpoints after this point will require an active session
app.use("/api/*", shopify.validateAuthenticatedSession());
app.use("/admin/queues", serverAdapter.getRouter());

// app.use(express.json({ limit: "50mb" }));
app.use(express.json({ limit: "50mb", extended: true }));
app.use(
  express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 })
);

app.get("/api/shop", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const shop = (
      await shopify.api.rest.Shop.all({
        session,
      })
    ).data[0];
    res.json(shop);
  } catch (error) {
    console.log(error);
  }
});

app.get("/api/credits-data/:shopId", async (req, res) => {
  try {
    const shopId = req.params.shopId;
    let creditsData = null;
    const session = res.locals.shopify.session;
    const resp = await BillingDetailsModel.findOne({ shopId });

    if (resp) {
      creditsData = resp
        ? {
          createdInThisMonth: resp.createdInThisMonth || 0,
          addedInThisMonth: resp.addedInThisMonth || 0,
          creditsRemaining: resp.creditsRemaining || 0,
        }
        : {
          createdInThisMonth: 0,
          addedInThisMonth: 0,
          creditsRemaining: 0,
        };
    } else {
      const response = await FreePlanStoreModel.findOne({
        shopName: session.shop,
      });
      creditsData = response
        ? {
          createdInThisMonth: response.productCount || 0,
          addedInThisMonth: 0,
          creditsRemaining: 20 - response.productCount || 0,
        }
        : {
          createdInThisMonth: 0,
          addedInThisMonth: 0,
          creditsRemaining: 0,
        };
    }

    res.status(200).json(creditsData);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/shop", async (req, res) => {
  try {
    const session = res.locals.shopify.session;

    const shop = await FreePlanStoreModel.updateOne(
      { shopName: session.shop },
      { $set: { ...req.body } },
      { upsert: true }
    );

    res.json({ shop });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/api/products/count", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const client = new shopify.api.clients.Graphql({ session });

    const query = `query {
      productsCount {
        count
      }
    }`;

    const response = await client.query({
      data: {
        query,
      },
    });

    res.status(200).send({ count: response.body.data.productsCount.count });
  } catch (error) {
    console.error("Error fetching product count:", error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching product count" });
  }
});

app.get("/api/products-by-tags/count", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const client = new shopify.api.clients.Graphql({ session });

    const query = `query {
      productsCount {
        count
      }
    }`;

    const response = await client.query({
      data: {
        query,
      },
    });

    res.status(200).send({ count: response.body.data.productsCount.count });
  } catch (error) {
    console.error("Error fetching product count:", error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching product count" });
  }
});

app.get("/api/products-by-collections/count", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const client = new shopify.api.clients.Graphql({ session });

    const query = `query {
      productsCount {
        count
      }
    }`;

    const response = await client.query({
      data: {
        query,
      },
    });

    res.status(200).send({ count: response.body.data.productsCount.count });
  } catch (error) {
    console.error("Error fetching product count:", error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching product count" });
  }
});

app.get("/api/products/create", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

app.post("/api/collections/list/next", async (_req, res) => {
  const session = res.locals.shopify.session;
  const client = new shopify.api.clients.Graphql({ session });

  let first = 1; // Number of products to fetch per request
  let after = _req.body.params?.after || null;
  let currentHandleIndex = _req.body.currentHandle || 1;
  let currentHandle = _req.body.handles[currentHandleIndex - 1];

  const query = `
  query ($handle: String!, $first: Int, $last: Int, $after: String, $before: String) {
    collectionByHandle(handle: $handle) {
      id
      title
      products(first: $first, last: $last, after: $after, before: $before) {
        edges {
          node {
            id
            title
            vendor
            productType
            tags
            featuredImage {
              id
              url
            }
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  price
                  sku
                  selectedOptions {
                    optionValue {
                      name
                    }
                  }
                }
                cursor
              }
              pageInfo {
                hasNextPage
              }
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          endCursor
          startCursor
        }
      }
    }
  }`;

  try {
    let response;

    const fetchProducts = async ({ handle, first, last, after, before }) => {
      return await client.query({
        data: {
          query: query,
          variables: {
            handle: handle,
            first: first || undefined,
            last: last || undefined,
            after: after || undefined,
            before: before || undefined,
          },
        },
      });
    };

    if (after) {
      // Forward pagination (Next)
      response = await fetchProducts({ handle: currentHandle, first, after });
    } else {
      // Initial or refresh fetch
      response = await fetchProducts({ handle: currentHandle, first });
    }

    let products = response.body.data.collectionByHandle.products.edges.map(
      (product) => {
        const variants = product.node.variants.edges.map((variantEdge) => {
          const variant = variantEdge.node;
          const options = variant.selectedOptions.reduce(
            (acc, optionValue, index) => {
              acc[`option${index + 1}`] = optionValue.optionValue.name;
              return acc;
            },
            {}
          );
          return {
            ...variant,
            ...options,
          };
        });
        return {
          ...product.node,
          variants: variants,
        };
      }
    );

    const pageInfo = response.body.data.collectionByHandle.products.pageInfo;

    if (pageInfo.hasNextPage) {
      // There are more products in the current collection
      res.status(200).json({
        products: products,
        nextPageParameters: { after: pageInfo.endCursor, first: first },
        previousPageParameters: pageInfo.hasPreviousPage
          ? { before: pageInfo.startCursor, last: first }
          : null,
        currentHandle: _req.body.currentHandle, // Stay on the current collection
      });
    } else {
      // No more products in any collection
      // _req.body.currentHandle++;
      res.status(200).json({
        products: products,
        nextPageParameters: null, // No more products
        previousPageParameters: pageInfo.hasPreviousPage
          ? { before: pageInfo.startCursor, last: first }
          : null,
        currentHandle: _req.body.currentHandle,
      });
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching products" });
  }
});

app.post("/api/collections/list/previous", async (_req, res) => {
  const session = res.locals.shopify.session;
  const client = new shopify.api.clients.Graphql({ session });

  let last = 1; // Number of products to fetch per request
  let before = _req.body.params?.before || null;
  let currentHandleIndex = _req.body.currentHandle || 1;
  let currentHandle = _req.body.handles[currentHandleIndex - 1];

  const query = `
  query ($handle: String!, $first: Int, $last: Int, $after: String, $before: String, $reverse: Boolean) {
    collectionByHandle(handle: $handle) {
      id
      title
      products(first: $first, last: $last, after: $after, before: $before, reverse: $reverse) {
        edges {
          node {
            id
            title
            vendor
            productType
            tags
            featuredImage {
              id
              url
            }
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  price
                  sku
                  selectedOptions {
                    optionValue {
                      name
                    }
                  }
                }
                cursor
              }
              pageInfo {
                hasNextPage
              }
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          endCursor
          startCursor
        }
      }
    }
  }`;

  try {
    let response;

    const fetchProducts = async ({
      handle,
      first,
      last,
      after,
      before,
      reverse,
    }) => {
      return await client.query({
        data: {
          query: query,
          variables: {
            handle: handle,
            first: first || undefined,
            last: last || undefined,
            after: after || undefined,
            before: before || undefined,
            reverse: reverse,
          },
        },
      });
    };

    if (before) {
      // Backward pagination (Previous)
      response = await fetchProducts({
        handle: currentHandle,
        last,
        before,
        reverse: false,
      });
    } else {
      // Initial or refresh fetch
      response = await fetchProducts({
        handle: currentHandle,
        first: last,
        reverse: true,
      });
    }

    let products = response.body.data.collectionByHandle.products.edges.map(
      (product) => {
        const variants = product.node.variants.edges.map((variantEdge) => {
          const variant = variantEdge.node;
          const options = variant.selectedOptions.reduce(
            (acc, optionValue, index) => {
              acc[`option${index + 1}`] = optionValue.optionValue.name;
              return acc;
            },
            {}
          );
          return {
            ...variant,
            ...options,
          };
        });
        return {
          ...product.node,
          variants: variants,
        };
      }
    );

    const pageInfo = response.body.data.collectionByHandle.products.pageInfo;

    pageInfo.hasNextPage = !before ? false : pageInfo.hasNextPage;
    pageInfo.hasPreviousPage = !before ? true : pageInfo.hasPreviousPage;

    if (pageInfo.hasPreviousPage) {
      // There are more products in the current collection
      res.status(200).json({
        products: products,
        nextPageParameters: { after: pageInfo.endCursor, first: last },
        previousPageParameters: pageInfo.hasPreviousPage
          ? { before: pageInfo.startCursor, last: last }
          : null,
        currentHandle: _req.body.currentHandle, // Stay on the current collection
      });
    } else {
      // No more products in any collection
      res.status(200).json({
        products: products,
        nextPageParameters: pageInfo.hasNextPage
          ? { after: pageInfo.endCursor, first: last }
          : null, // No more products
        previousPageParameters: null,
        currentHandle: _req.body.currentHandle,
      });
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching products" });
  }
});

app.post("/api/tags/list/next", async (_req, res) => {
  const session = res.locals.shopify.session;
  const client = new shopify.api.clients.Graphql({ session });

  let first = 1; // Number of products to fetch per request
  let after = _req.body.params?.after || null;
  let currentTagIndex = _req.body.currentTag || 1;
  let currentTag = _req.body.tags[currentTagIndex - 1];

  const query = `
  query ($tag: String!, $first: Int, $last: Int, $after: String, $before: String) {
      products(first: $first, last: $last, after: $after, before: $before, query: $tag) {
        edges {
          node {
            id
            title
            vendor
            productType
            tags
            featuredImage {
              id
              url
            }
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  price
                  sku
                  selectedOptions {
                    optionValue {
                      name
                    }
                  }
                }
                cursor
              }
              pageInfo {
                hasNextPage
              }
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          endCursor
          startCursor
        }
      }
  }`;

  try {
    let response;

    const fetchProducts = async ({ tag, first, last, after, before }) => {
      return await client.query({
        data: {
          query: query,
          variables: {
            tag: tag,
            first: first || undefined,
            last: last || undefined,
            after: after || undefined,
            before: before || undefined,
          },
        },
      });
    };

    if (after) {
      // Forward pagination (Next)
      response = await fetchProducts({ tag: currentTag, first, after });
    } else {
      // Initial or refresh fetch
      response = await fetchProducts({ tag: currentTag, first });
    }

    let products = response.body.data.products.edges.map((product) => {
      const variants = product.node.variants.edges.map((variantEdge) => {
        const variant = variantEdge.node;
        const options = variant.selectedOptions.reduce(
          (acc, optionValue, index) => {
            acc[`option${index + 1}`] = optionValue.optionValue.name;
            return acc;
          },
          {}
        );
        return {
          ...variant,
          ...options,
        };
      });
      return {
        ...product.node,
        variants: variants,
      };
    });

    const pageInfo = response.body.data.products.pageInfo;

    if (pageInfo.hasNextPage) {
      // There are more products in the current collection
      res.status(200).json({
        products: products,
        nextPageParameters: { after: pageInfo.endCursor, first: first },
        previousPageParameters: pageInfo.hasPreviousPage
          ? { before: pageInfo.startCursor, last: first }
          : null,
        currentHandle: _req.body.currentTag, // Stay on the current collection
      });
    } else {
      // No more products in any collection
      // _req.body.currentHandle++;
      res.status(200).json({
        products: products,
        nextPageParameters: null, // No more products
        previousPageParameters: pageInfo.hasPreviousPage
          ? { before: pageInfo.startCursor, last: first }
          : null,
        currentHandle: _req.body.currentTag,
      });
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching products" });
  }
});

app.post("/api/tags/list/previous", async (_req, res) => {
  const session = res.locals.shopify.session;
  const client = new shopify.api.clients.Graphql({ session });

  let last = 1; // Number of products to fetch per request
  let before = _req.body.params?.before || null;
  let currentTagIndex = _req.body.currentTag || 1;
  let currentTag = _req.body.tags[currentTagIndex - 1];

  const query = `
  query ($tag: String!, $first: Int, $last: Int, $after: String, $before: String, $reverse: Boolean) {
      products(first: $first, last: $last, after: $after, before: $before, query: $tag, reverse: $reverse) {
        edges {
          node {
            id
            title
            vendor
            productType
            tags
            featuredImage {
              id
              url
            }
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  price
                  sku
                  selectedOptions {
                    optionValue {
                      name
                    }
                  }
                }
                cursor
              }
              pageInfo {
                hasNextPage
              }
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          endCursor
          startCursor
        }
      }
  }`;

  try {
    let response;

    const fetchProducts = async ({
      tag,
      first,
      last,
      after,
      before,
      reverse,
    }) => {
      return await client.query({
        data: {
          query: query,
          variables: {
            tag: tag,
            first: first || undefined,
            last: last || undefined,
            after: after || undefined,
            before: before || undefined,
            reverse: reverse,
          },
        },
      });
    };

    if (before) {
      // Backward pagination (Previous)
      response = await fetchProducts({
        tag: currentTag,
        last,
        before,
        reverse: false,
      });
    } else {
      // Initial or refresh fetch
      response = await fetchProducts({
        tag: currentTag,
        first: last,
        reverse: true,
      });
    }

    let products = response.body.data.products.edges.map((product) => {
      const variants = product.node.variants.edges.map((variantEdge) => {
        const variant = variantEdge.node;
        const options = variant.selectedOptions.reduce(
          (acc, optionValue, index) => {
            acc[`option${index + 1}`] = optionValue.optionValue.name;
            return acc;
          },
          {}
        );
        return {
          ...variant,
          ...options,
        };
      });
      return {
        ...product.node,
        variants: variants,
      };
    });

    const pageInfo = response.body.data.products.pageInfo;

    pageInfo.hasNextPage =
      !before && currentTagIndex === 1 ? true : pageInfo.hasNextPage;
    pageInfo.hasPreviousPage =
      !before && currentTagIndex === 1 ? false : pageInfo.hasPreviousPage;

    if (pageInfo.hasPreviousPage) {
      // There are more products in the current collection
      res.status(200).json({
        products: products,
        nextPageParameters: { after: pageInfo.endCursor, first: last },
        previousPageParameters: pageInfo.hasPreviousPage
          ? { before: pageInfo.startCursor, last: last }
          : null,
        currentHandle: _req.body.currentTag, // Stay on the current collection
      });
    } else {
      // No more products in any collection
      res.status(200).json({
        products: products,
        nextPageParameters: pageInfo.hasNextPage
          ? { after: pageInfo.endCursor, first: last }
          : null, // No more products
        previousPageParameters: null,
        currentHandle: _req.body.currentTag,
      });
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching products" });
  }
});

app.get("/api/products/list", async (_req, res) => {
  const session = res.locals.shopify.session;
  const client = new shopify.api.clients.Graphql({ session });

  let first = 2;
  let after = _req.query.after || null;
  let before = _req.query.before || null;
  let reverse = false;

  const query1 = `
    query ($first: Int, $last: Int, $after: String, $before: String, $reverse: Boolean) {
      products(first: $first, last: $last, after: $after, before: $before, reverse: $reverse, sortKey: TITLE) {
        edges {
          node {
            id
            title
            vendor
            productType
            tags
            featuredImage {
              id
              url
            }
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  price
                  sku
                  selectedOptions {
                    optionValue {
                      name
                    }
                  }
                }
                cursor
              }
              pageInfo {
                hasNextPage
              }
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          endCursor
          startCursor
        }
      }
    }
  `;

  try {
    let response;
    if (after) {
      response = await client.query({
        data: {
          query: query1,
          variables: {
            first: first,
            after: after,
            reverse: reverse,
          },
        },
      });
    } else if (before) {
      response = await client.query({
        data: {
          query: query1,
          variables: {
            last: first,
            before: before,
            reverse: reverse,
          },
        },
      });
    } else {
      response = await client.query({
        data: {
          query: query1,
          variables: {
            first: first,
            reverse: reverse,
          },
        },
      });
    }

    const products = response.body.data.products.edges.map((product) => {
      const variants = product.node.variants.edges.map((variantEdge) => {
        const variant = variantEdge.node;
        const options = variant.selectedOptions.reduce(
          (acc, optionValue, index) => {
            acc[`option${index + 1}`] = optionValue.optionValue.name;
            return acc;
          },
          {}
        );
        return {
          ...variant,
          ...options,
        };
      });
      return {
        ...product.node,
        variants: variants,
      };
    });

    const pageInfo = response.body.data.products.pageInfo;

    res.status(200).json({
      products: products,
      nextPageParameters: pageInfo.hasNextPage
        ? { after: pageInfo.endCursor, first: first }
        : null,
      previousPageParameters: pageInfo.hasPreviousPage
        ? { before: pageInfo.startCursor, last: first }
        : null,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching products" });
  }
});

app.get("/api/webhook/start/:shopId/:currentStatus", async (_req, res) => {
  try {
    const resp = await BillingDetailsModel.findOne({
      shopId: _req.params.shopId,
    });
    if (resp) {
      // Webhook created
      if (!resp.shopEmail) {
        const newSettings = await createNewWebhook(res.locals.shopify.session);
        const newPurchase = await createWebhookOnetimePurchase(
          res.locals.shopify.session
        );
        console.log("Webhook new created", newPurchase);
      }
      resp.smartSKU.autoSKU_on =
        _req.params.currentStatus === "false" ? true : false;
      await resp.save();
      res.status(200).json({ msg: "success" });
    } else {
      res.status(200).json({ msg: "failed" });
    }
  } catch (err) {
    console.log("Error:", err);
  }
});

app.get("/api/webhook/status/:shopId", async (_req, res) => {
  try {
    const resp = await BillingDetailsModel.findOne({
      shopId: _req.params.shopId,
    });
    if (resp) {
      if (resp.smartSKU.autoSKU_on === true) {
        res.status(200).json({ status: true });
      } else {
        res.status(404).json({ status: false });
      }
    } else {
      res.status(404).json({ status: false });
    }
  } catch (err) {
    console.log(err);
  }
});

let transporter = nodemailer.createTransport({
  port: 465,
  host: "email-smtp.us-east-2.amazonaws.com",
  secure: true,
  auth: {
    user: "AKIA42BQ4A757JBVDXEF",
    pass: "BP0PQqFHe+LodJEO/3F4X6sY355teYV8I7d98EfvpYQX",
  },
  debug: true,
});

app.post("/api/sku/:shopId", async (req, res) => {
  let status = 200;
  let error = null;
  let limit = 20;

  try {
    const session = res.locals.shopify.session;
    const shopEmail = await getShopEmail(session);

    let planModel;
    if (req.body.currentPlan === "Free Plan") {
      planModel = await FreePlanStoreModel.findOneAndUpdate(
        { shopName: session.shop },
        { $set: { shopEmail } },
        { upsert: true, new: true }
      );
      if (planModel.productCount >= limit) {
        res.json({
          consumed:
            "Already consumed free plan, Upgrade plan to enjoy unlimited services",
        });
        return;
      }
    }

    const products = await getProducts(req, session, planModel, limit);

    const preference = await savePreference(req, req.body.currentPlan);
    const preferenceId = preference?._id;

    const productChunks = chunkArray(products, 150);
    const jobIds = await Promise.all(
      productChunks.map(async (chunk, index) => {
        const jobData = {
          session,
          body: { ...req.body, products: chunk },
          shopId: req.params.shopId,
          batchNumber: index + 1,
          preferenceId,
          currentPlan: req.body.currentPlan,
        };

        try {
          const job = await skuQueue.add(jobData, {
            removeOnComplete: false, // Do not remove immediately
            removeOnFail: false, // Do not remove on failure
          });

          return job.id;
        } catch (jobError) {
          console.error("Error adding job:", jobError);
          throw jobError;
        }
      })
    );

    res.status(status).json({ jobIds, progress: 0 });
  } catch (e) {
    console.error(`Failed to generate sku: ${e.message}`);
    status = 500;
    error = e.message;
    res.status(status).json({ error });
  }
});

app.get("/api/sku/progress/:jobIds", async (req, res) => {
  try {
    const jobIds = req.params.jobIds.split(",");
    const jobs = await Promise.all(
      jobIds.map((jobId) => skuQueue.getJob(jobId))
    );

    if (jobs.some((job) => job === null)) {
      return res.status(404).json({ error: "One or more jobs not found" });
    }

    let totalProgress = 0;
    let totalProducts = 0;
    let failed = false;

    for (const job of jobs) {
      totalProgress += job.progress();
      totalProducts += job.data.body.products.length;
      if (await job.isFailed()) {
        failed = true;
      }
    }

    const averageProgress = totalProgress / jobs.length;

    res.status(200).json({
      progress: averageProgress,
      result: averageProgress >= 100 ? totalProducts : null,
      failed,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to retrieve progress" });
  }
});

app.get("/api/sku/jobs/:shopId", async (req, res) => {
  try {
    const shopId = req.params.shopId;
    const limit = parseInt(req.query.limit, 10) || 0;

    // Fetch all jobs in the queue
    const waitingJobs = await skuQueue.getWaiting();
    const activeJobs = await skuQueue.getActive();
    const completedJobs = await skuQueue.getCompleted();
    const failedJobs = await skuQueue.getFailed();
    const delayedJobs = await skuQueue.getDelayed();
    // const pausedJobs = await skuQueue. getPaused();

    // Combine all jobs into a single array
    const allJobs = [
      ...waitingJobs,
      ...activeJobs,
      ...completedJobs,
      ...failedJobs,
      ...delayedJobs,
      // ...pausedJobs,
    ];

    // Filter jobs by shopId
    const jobsToReturn = allJobs.filter((job) => job.data.shopId === shopId);

    // Sort jobs by timestamp (descending) to get the latest jobs first
    jobsToReturn.sort((a, b) => b.timestamp - a.timestamp);

    // Limit the jobs returned based on the 'limit' query parameter
    const shopJobs = limit > 0 ? jobsToReturn.slice(0, limit) : jobsToReturn;

    const formatDate = (timestamp) => {
      const date = new Date(timestamp);
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const month = months[date.getMonth()];
      const day = date.getDate();
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "pm" : "am";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      return `${month} ${day} at ${hours}:${minutes}${ampm}`;
    };

    // Total estimated duration for each job (in milliseconds)
    const estimatedDuration = 3600000; // 1 hour

    // Function to format remaining time as "1m" or "30s"
    const formatRemainingTime = (remainingTime) => {
      const minutes = Math.floor(remainingTime / 60000); // Convert to minutes
      const seconds = Math.floor((remainingTime % 60000) / 1000); // Convert remaining milliseconds to seconds

      let timeString = "";
      if (minutes > 0) {
        timeString += `${minutes}min`;
      }
      if (seconds > 0 || minutes === 0) {
        // Always show seconds if no minutes
        if (timeString) timeString += " ";
        timeString += `${seconds}sec`;
      }
      return timeString;
    };

    // Map job data to include only relevant information and wait for all promises to resolve
    const jobStatuses = await Promise.all(
      shopJobs.map(async (job) => {
        const progress = await job.progress();
        const formattedProgress = progress.toFixed(2);
        const remainingTime = estimatedDuration * (1 - progress / 100); // Calculate remaining time

        return {
          id: job.id,
          status: await job.getState(), // Get job status
          progress: formattedProgress,
          failed: await job.isFailed(),
          data: job.data.body.products.length,
          createdAt: formatDate(job.timestamp), // Get job creation date
          estimatedTime: formatRemainingTime(remainingTime), // Calculate and format remaining time
        };
      })
    );

    res.status(200).json({ jobs: jobStatuses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve jobs" });
  }
});

skuQueue.process(async (job) => {
  const {
    session,
    body,
    createdSku = 0,
    shopId,
    bodyToContinue = 0,
    batchNumber,
    preferenceId,
    currentPlan,
  } = job.data;

  const result = await skuGenerator(
    session,
    body,
    createdSku,
    shopId,
    bodyToContinue,
    batchNumber,
    preferenceId,
    currentPlan,
    (progress) => {
      job.progress(progress);
    }
  );
  job.progress(100);
  return result;
});

skuQueue.process("removeJob", async (job) => {
  const { jobId } = job.data;
  const jobToRemove = await skuQueue.getJob(jobId);
  if (jobToRemove) {
    await jobToRemove.remove();
    console.log(`Job ${jobId} has been removed after 5 days.`);
  }
});

const removeJobAfterDelay = async (job) => {
  await skuQueue.add(
    "removeJob",
    { jobId: job.id },
    { delay: 5 * 24 * 60 * 60 * 1000, removeOnComplete: true }
  );
};

skuQueue.on("completed", async (job, result) => {
  const { createdSku, count } = result;
  await incrementSkuCreatedInThisMonth(job.data.shopId, createdSku);
  await decrementRemainingCredits(job.data.shopId, createdSku);

  // Schedule job removal after 5 days
  await removeJobAfterDelay(job);
});

queueForWebhook.process(async (job) => {
  const { session, body, shopId, bodyToContinue } = job.data;

  const result = await skuGeneratorForWebhook(
    session,
    body,
    0,
    shopId,
    bodyToContinue,
    "Pro Monthly",
    (progress) => {
      job.progress(progress);
    }
  );
  job.progress(100);
  return result;
});

queueForWebhook.on("completed", async (job, result) => {
  const { createdSku, count } = result;

  await incrementSkuCreatedInThisMonth(job.data.shopId, createdSku);
  delete job.data.body.products;
  await updateBodyNumber(job.data.shopId, job.data.body, count);
});

skuQueue.on("failed", async (job, error) => {
  const mailOptions = {
    from: "support@appsfinal.com",
    to: "sahad@appsfinal.com",
    subject: "Error encountered in SKU",
    text: `An error occurred in the application: ${error}`,
  };
  await transporter.sendMail(mailOptions);

  // Schedule job removal after 5 days
  await removeJobAfterDelay(job);
});

async function sendMail({ to, subject, html }) {
  const mailOptions = {
    from: "support@appsfinal.com",
    to: to,
    subject: subject,
    html: html,
  };
  await transporter.sendMail(mailOptions);
}

app.post("/api/get-products/from-admin", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const productIdArray = req.body.ids;
    if (!Array.isArray(productIdArray) || productIdArray.length === 0) {
      return res.status(400).json({ error: "Invalid product IDs" });
    }

    const productDataPromises = productIdArray.map((productId) =>
      fetchProductData(productId, session)
    );

    const productData = await Promise.all(productDataPromises);

    const productsWithImage = productData.map((product) => ({
      ...product,
      images: [{ originalSrc: product.featuredImage.url }],
    }));
    res.status(200).json({ products: productsWithImage });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to retrieve data" });
  }
});

app.get("/api/getdetails", async (req, res) => {
  try {
    const client = new shopify.api.clients.Rest({
      session: res.locals.shopify.session,
    });
    const response = await client.get({ path: "shop" });
    res.json({ response });
  } catch (error) {
    console.log(error);
  }
});

app.get("/api/add-bonus/:shopId", async (req, res) => {
  try {
    // Try to find the existing store
    let storeData = await BillingDetailsModel.findOne({
      shopId: req.params.shopId,
    });

    // If store is found and hasReviewed is false, update creditsRemaining and hasReviewed
    if (storeData && !storeData.hasReviewed) {
      storeData = await BillingDetailsModel.findOneAndUpdate(
        { shopId: req.params.shopId },
        {
          $set: { hasReviewed: true, extraCreditRemainigs: 50 },
          $inc: { creditsRemaining: 50 },
        },
        { new: true }
      );
      res
        .status(200)
        .send({ message: "Bonus applied successfully", storeData });
    }
    // If store exists but hasReviewed is already true
    else if (storeData && storeData.hasReviewed) {
      res
        .status(200)
        .send({ message: "Bonus has already been applied", storeData });
    }
    // If no store is found, create a new one
    else {
      const billingData = new BillingDetailsModel({
        shopId: req.params.shopId,
        shopName: res.locals.shopify.session.shop,
        charge_id: "Free Plan",
        status: null,
        price: null,
        charge_name: null,
        createdAt: null,
        creditsRemaining: 50, // Initialize with 50 credits
        hasReviewed: true,
        extraCreditRemainigs: 50,
      });

      storeData = await billingData.save();

      res.status(200).send({
        message: "Store created and bonus applied successfully",
        storeData,
      });
    }
  } catch (error) {
    res.status(500).send({ message: "Server error", error });
  }
});

app.get("/api/upgradeplan/:shopId", async (req, res) => {
  let proPlan = false;
  let charge_id = null;
  let billingData = {};
  let createdSkus = 0,
    creditsRemaining = 0;
  let responsePayload = {};

  try {
    // Fetch active charges
    const oneTimeCharge = await checkForActiveChargesGraphql(
      res.locals.shopify.session
    );

    console.log("oneTimeCharge", oneTimeCharge);

    const monthlyCharge = await checkForActiveChargesGraphqlForName(
      res.locals.shopify.session
    );

    console.log("monthlyCharge", monthlyCharge);

    // Compare dates and determine the latest charge
    const oneTimeDate = oneTimeCharge?.node?.createdAt
      ? new Date(oneTimeCharge.node.createdAt)
      : new Date(0);
    const monthlyDate = monthlyCharge
      ? new Date(monthlyCharge.createdAt)
      : new Date(0);

    if (oneTimeCharge && oneTimeDate > monthlyDate) {
      charge_id = oneTimeCharge.node.id;
      if (oneTimeCharge.node.name === "Pay as You Go") {
        billingData = await BillingDetailsModel.findOne({
          shopId: req.params.shopId,
        });
        if (billingData) {
          if (billingData.charge_id !== oneTimeCharge.node.id) {
            billingData.charge_id = oneTimeCharge.node.id;
            billingData.status = oneTimeCharge.node.status;
            billingData.price = oneTimeCharge.node.price;
            billingData.charge_name = oneTimeCharge.node.name;
            billingData.createdAt = oneTimeCharge.node.createdAt;
            billingData.creditsRemaining = billingData.creditsRemaining + 100;
            await billingData.save();
          } else {
            if (billingData?.creditsRemaining <= 0) {
              responsePayload = {
                chargeName: "Free Plan",
                proPlan,
                charge_id,
                hasReviewed: billingData.hasReviewed,
              };
              return res.json(responsePayload);
            }
          }
        } else {
          billingData = new BillingDetailsModel({
            shopId: req.params.shopId,
            shopName: res.locals.shopify.session.shop,
            charge_id: oneTimeCharge.node.id,
            status: oneTimeCharge.node.status,
            price: oneTimeCharge.node.price,
            charge_name: oneTimeCharge.node.name,
            createdAt: oneTimeCharge.node.createdAt,
            creditsRemaining: 100,
          });
          await billingData.save();
        }

        // Calculate SKU Generations
        createdSkus = billingData.createdInThisMonth;
        creditsRemaining = billingData.creditsRemaining;

        // Create webhook if shopEmail is not set
        if (!billingData.shopEmail) {
          const newSettings = await createNewWebhook(
            res.locals.shopify.session
          );
          const newPurchase = await createWebhookOnetimePurchase(
            res.locals.shopify.session
          );
          console.log("Webhook new created", newPurchase);
        }

        responsePayload = {
          chargeName: billingData.charge_name,
          proPlan,
          charge_id,
          createdSkus,
          creditsRemaining,
          hasReviewed: billingData.hasReviewed,
        };
      }
    } else if (monthlyCharge && monthlyCharge.status === "ACTIVE") {
      charge_id = monthlyCharge.id;
      const isProPlan = monthlyCharge.name.startsWith("Pro");
      proPlan = isProPlan;

      const priceAmount = isProPlan
        ? monthlyCharge.price
        : monthlyCharge.name === "Basic Monthly"
          ? "19.00"
          : "149.00";

      billingData = await BillingDetailsModel.findOne({
        shopId: req.params.shopId,
      });
      if (billingData) {
        if (billingData.charge_id !== monthlyCharge.id) {
          billingData.charge_id = monthlyCharge.id;
          billingData.status = monthlyCharge.status;
          billingData.shopName = res.locals.shopify.session.shop;
          billingData.price = { amount: priceAmount, currencyCode: "USD" };
          billingData.charge_name = monthlyCharge.name;
          billingData.createdAt = monthlyCharge.createdAt;
          await billingData.save();
        }
      } else {
        billingData = new BillingDetailsModel({
          shopId: req.params.shopId,
          shopName: res.locals.shopify.session.shop,
          charge_id: monthlyCharge.id,
          status: monthlyCharge.status,
          price: { amount: priceAmount, currencyCode: "USD" },
          charge_name: monthlyCharge.name,
          createdAt: monthlyCharge.createdAt,
        });
        await billingData.save();
      }

      // Create webhook if shopEmail is not set
      if (!billingData.shopEmail) {
        const newSettings = await createNewWebhook(res.locals.shopify.session);
        const newPurchase = await createWebhookOnetimePurchase(
          res.locals.shopify.session
        );
        console.log("Webhook new created", newPurchase);
      }

      responsePayload = {
        chargeName: billingData.charge_name,
        proPlan,
        charge_id,
        hasReviewed: billingData.hasReviewed,
      };
    } else {
      responsePayload = {
        chargeName: "Free Plan",
        proPlan,
        charge_id,
        hasReviewed: billingData.hasReviewed,
      };
    }

    res.json(responsePayload); // Send response once at the end
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

async function getCurrentPlan(session, shopId) {
  try {
    // Fetch one-time and monthly charges concurrently
    const [oneTimeCharge, monthlyCharge] = await Promise.all([
      checkForActiveChargesGraphql(session),
      checkForActiveChargesGraphqlForName(session),
    ]);

    // Parse dates for comparison
    const oneTimeDate = new Date(oneTimeCharge?.node?.createdAt || 0);
    const monthlyDate = new Date(monthlyCharge?.createdAt || 0);

    // Determine latest active charge
    if (oneTimeCharge && oneTimeDate > monthlyDate) {
      const { name } = oneTimeCharge.node;

      if (name === "Pay as You Go") {
        const billingData = await BillingDetailsModel.findOne({ shopId });

        return {
          chargeName:
            billingData && billingData.creditsRemaining > 0
              ? "Pay as You Go"
              : "Free Plan",
          creditsRemaining: billingData?.creditsRemaining || 0,
        };
      }

      return { chargeName: name, creditsRemaining: 0 };
    }

    // Handle active monthly charge if it exists
    if (monthlyCharge?.status === "ACTIVE") {
      return {
        chargeName: monthlyCharge.name,
        creditsRemaining: null,
      };
    }

    // Default to Free Plan if no valid charges are found
    return { chargeName: "Free Plan", creditsRemaining: null };
  } catch (error) {
    console.error("Error fetching current plan:", error);
    throw new Error("Failed to retrieve plan information.");
  }
}

app.get("/api/handlelifetime/:shopId/", async (req, res) => {
  const session = res.locals.shopify.session;

  const LifetimePlan = {
    chargeName: "Lifetime Subscription",
    amount: 99.0,
    currencyCode: "USD",
  };

  requestOnlyPayment(session, LifetimePlan).then((resp) => {
    res.json({ confirmation_url: resp });
  });
});

app.get("/api/handlebasicmonthly", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const BasicMonthly = {
      chargeName: "Basic Monthly",
      amount: 19.0,
      currencyCode: "USD",
      interval: "EVERY_30_DAYS",
      trialDays: 0,
    };

    const resp = await requestOnlyPayment(session, BasicMonthly);
    res.json({ confirmation_url: resp });
  } catch (error) {
    console.log(error);
  }
});

app.get("/api/handlebasicyearly", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const BasicYearly = {
      chargeName: "Basic Yearly",
      amount: 149.0,
      currencyCode: "USD",
      interval: "ANNUAL",
      trialDays: 0,
    };

    const resp = await requestOnlyPayment(session, BasicYearly);
    res.json({ confirmation_url: resp });
  } catch (error) {
    console.log(error);
  }
});

app.get("/api/handlepromonthly", async (req, res) => {
  const session = res.locals.shopify.session;

  const ProMonthly = {
    chargeName: "Pro Monthly",
    amount: 39.0,
    currencyCode: "USD",
    interval: "EVERY_30_DAYS",
    trialDays: 3,
    blackFridayOffer: true,
  };

  requestOnlyPayment(session, ProMonthly).then((resp) => {
    res.json({ confirmation_url: resp });
  });
});

app.get("/api/handlepayasyougo", async (req, res) => {
  const session = res.locals.shopify.session;

  const ProMonthly = {
    chargeName: "Pay as You Go",
    amount: 5.0,
    currencyCode: "USD",
    trialDays: 0,
  };

  requestOnlyPayment(session, ProMonthly).then((resp) => {
    res.json({ confirmation_url: resp });
  });
});

app.get("/api/handlefree", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const response = await deleteActiveCharge(session);
    if (response) {
      res.json({ status: "success", planName: "Free" });
    }
  } catch (err) {
    console.log("Error:", err);
  }
});

app.get("/api/get-skupreference/:shopId", async (req, res) => {
  try {
    const preferenceData = await BillingDetailsModel.findOne({
      shopId: req.params.shopId,
    }).select("skuPreference appliedPreference");

    if (preferenceData === null) {
      res.status(404).json({ data: [], error: "Could not find data" });
    } else {
      res.status(200).json({
        data: preferenceData?.skuPreference,
        appliedPreference: preferenceData?.appliedPreference,
      });
    }
  } catch (err) {
    console.log("Error:", err);
  }
});

app.post("/api/create-skupreference/:shopId", async (req, res) => {
  try {
    const {
      basicRules,
      separator,
      productOption,
      applyToEmpty,
      delimeters,
      delimetersPosition,
      selected,
      selectedType,
      removeSpace,
      makeAllCapital,
      lastBodyNo,
      bodyNumberType,
      randomNumberLength,
      incaseOfDuplicate,
      layoutOrder,
      productVariant,
      conditions,
      productTitleInclude,
    } = req.body;

    const user = await BillingDetailsModel.findOne({
      shopId: req.params.shopId,
    });

    if (user) {
      const newPreference = {
        basicRules,
        separator,
        productOption,
        applyToEmpty,
        delimeters,
        delimetersPosition,
        selected,
        selectedType,
        removeSpace,
        makeAllCapital,
        bodyNumberType: {
          bodyNumberType: bodyNumberType,
          randomNumberLength: randomNumberLength,
        },
        incaseOfDuplicate,
        layoutOrder,
        productVariant,
        conditions,
        productTitleInclude,
      };

      // Update the document and retrieve the newly added preference
      await BillingDetailsModel.updateOne(
        { shopId: req.params.shopId },
        { $push: { skuPreference: newPreference } }
      );

      // Retrieve the updated user with the latest skuPreference array
      const updatedUser = await BillingDetailsModel.findOne({
        shopId: req.params.shopId,
      });

      // Find the last element in the skuPreference array (newly added preference)
      const createdPreference =
        updatedUser.skuPreference[updatedUser.skuPreference.length - 1];

      res.status(200).json({
        success: true,
        msg: "Added Successfully",
        newPreference: createdPreference,
      });
    } else {
      res.status(404).json({ success: false, msg: "User not found" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, msg: "An error occurred" });
  }
});

app.get("/api/remove-skupreference/:shopId/:selectedId", async (req, res) => {
  try {
    await BillingDetailsModel.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $pull: { skuPreference: { _id: req.params.selectedId } } }
    );
    res.status(200).json({ success: true, selectedId: req.params.selectedId });
  } catch (err) {
    console.log(err);
  }
});

app.post("/api/edit-skupreference/:shopId/:selectedId", async (req, res) => {
  try {
    const filter = {
      shopId: req.params.shopId,
      "skuPreference._id": req.params.selectedId,
    };

    const updatedPreference = {
      _id: req.params.selectedId,
      basicRules: req.body.basicRules,
      separator: req.body.separator,
      productOption: req.body.productOption,
      applyToEmpty: req.body.applyToEmpty,
      delimeters: req.body.delimeters,
      delimetersPosition: req.body.delimetersPosition,
      selected: req.body.selected,
      selectedType: req.body.selectedType,
      removeSpace: req.body.removeSpace,
      makeAllCapital: req.body.makeAllCapital,
      bodyNumberType: {
        bodyNumberType: req.body.bodyNumberType,
        randomNumberLength: req.body.randomNumberLength,
      },
      incaseOfDuplicate: req.body.incaseOfDuplicate,
      layoutOrder: req.body.layoutOrder,
      productVariant: req.body.productVariant,
      conditions: req.body.conditions,
      productTitleInclude: req.body.productTitleInclude,
    };

    const update = {
      $set: {
        "skuPreference.$": updatedPreference,
      },
    };

    const updatedOption = await BillingDetailsModel.findOneAndUpdate(
      filter,
      update
    );
    res.status(200).json({ data: "success" });
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/apply-skupreference/:shopId/:selectedId", async (req, res) => {
  try {
    await BillingDetailsModel.findOneAndUpdate(
      { shopId: req.params.shopId },
      { appliedPreference: req.params.selectedId },
      { new: true }
    );
    res.status(200).json({ success: true, selectedId: req.params.selectedId });
  } catch (err) {
    console.log("Error:", err);
  }
});

app.get("/api/load-conditions/:shopId", async (req, res) => {
  const preferenceData = await BillingDetailsModel.findOne({
    shopId: req.params.shopId,
  })
    .select("skuPreference")
    .then((shop) => {
      if (!shop) {
        console.log("Shop not found");
        return;
      }

      const lastSkuPreference =
        shop.skuPreference[shop.skuPreference.length - 1]; // Get the last item in skuPreference array
      const conditions = lastSkuPreference.conditions.map((condition) => ({
        selectedField: condition.selectedField,
        valueToAdd: condition.valueToAdd,
        valueToMatch: condition.valueToMatch,
      }));

      res.status(200).json({
        data: conditions,
      });
    })
    .catch((err) => {
      console.error(err);
    });
});

async function sendErrorEmail(error) {
  const mailOptions = {
    from: "support@appsfinal.com",
    to: "sahad@appsfinal.com",
    subject: "Major Error occurred in SKU app",
    text: `An error occurred in the application: ${error.InlineStack}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Error email sent successfully");
  } catch (err) {
    console.error("Failed to send error email:", err);
  }
}

app.get("/api/old-sku/present", async (req, res) => {
  // Send immediate response to acknowledge request received
  res.status(202).json({ message: "SKU update process started." });

  // Run SKU updates in the background
  setImmediate(async () => {
    try {
      req.body.productOption = "all";
      const session = res.locals.shopify.session;
      const client = new shopify.api.clients.Graphql({ session });

      const productIds = await getProducts(req, session, null, null);
      console.log("Total product IDs:", productIds.length);

      // Process in batches of 100 products
      const BATCH_SIZE = 100;
      let batchStart = 0;

      // Function to process products in batches
      const processBatch = async (batch) => {
        const productDataPromises = batch.map((productId) =>
          getProductsWithMetafields(session, productId)
        );
        const productsData = await Promise.all(productDataPromises);

        // Filter products to find those with variants that have SKUs starting with "MK"
        const productsWithOldSKU = productsData.filter(
          (product) =>
            product.variants &&
            product.variants.some(
              (variant) => variant.sku && variant.sku.startsWith("MK")
            )
        );

        console.log(
          "Filtered products with old SKUs:",
          productsWithOldSKU.length
        );

        // Update SKU to null (empty string) for variants with SKUs starting with "MK"
        for (const product of productsWithOldSKU) {
          for (const variant of product.variants) {
            if (variant.sku && variant.sku.startsWith("MK")) {
              const variantId = variant.id;
              const updateSkuMutation = `
                mutation {
                  productVariantUpdate(input: {
                    id: "${variantId}",
                    sku: ""
                  }) {
                    productVariant {
                      id
                      sku
                    }
                    userErrors {
                      field
                      message
                    }
                  }
                }`;

              try {
                await shopifyErrorHandler(() =>
                  client.query({
                    data: {
                      query: updateSkuMutation,
                    },
                  })
                );
                console.log(`Updated SKU for variant ${variantId} to null`);
              } catch (error) {
                console.error(
                  `Failed to update SKU for variant ${variantId}`,
                  error
                );
              }
            }
          }
        }
      };

      // Loop through productIds in batches of 100
      while (batchStart < productIds.length) {
        const batch = productIds.slice(batchStart, batchStart + BATCH_SIZE);
        console.log(
          `Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1}, items ${
            batchStart + 1
          } to ${batchStart + batch.length}...`
        );

        await processBatch(batch); // Process current batch
        batchStart += BATCH_SIZE; // Move to next batch
        console.log(`Batch ${Math.floor(batchStart / BATCH_SIZE)} processed.`);

        // Optional: add a small delay between batches to avoid hitting rate limits
        await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay between batches
      }

      console.log("All batches processed successfully.");
    } catch (err) {
      console.error("Error in SKU update background job:", err);
    }
  });
});

app.get("/api/sku/job/data/:jobId", async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const page = parseInt(req.query.page) || 1; // default to page 1
    const limit = 25; // Static limit of 15 items per page
    const job = await skuQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const productIds = job.data.body.products;

    // Calculate the start and end index for the current page
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Fetch only the products for the current page
    const paginatedProductIds = productIds.slice(startIndex, endIndex);

    // Fetch product data from Shopify for each product ID
    const productDataPromises = paginatedProductIds.map((productId) =>
      getProductsWithMetafields(res.locals.shopify.session, productId)
    );
    const productsData = await Promise.all(productDataPromises);

    res.json({
      jobId,
      productsData,
      currentPage: page,
      totalPages: Math.ceil(productIds.length / limit),
      totalItems: productIds.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve jobs" });
  }
});

app.delete("/api/sku/job/delete/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await skuQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    await job.remove(); // Removes the job from the queue
    res.json({ success: true, message: "Job deleted successfully", jobId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Failed to delete the job" });
  }
});

app.post("/api/sku/job/retry/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await skuQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    if (job.failedReason) {
      await job.retry(); // Retries the failed job
      res.json({ success: true, message: "Job retried successfully", jobId });
    } else {
      res.status(400).json({
        success: false,
        error: "Job has not failed or is already being processed",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Failed to retry the job" });
  }
});

app.get("/api/sku/revert/:jobId", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const jobId = req.params.jobId;
    const job = await skuQueue.getJob(jobId);
    const client = new shopify.api.clients.Graphql({ session });
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    const productIds = job.data.body.products;
    for (const productId of productIds) {
      const productWithMetafields = await getProductsWithMetafields(
        session,
        productId
      );
      for (const variant of productWithMetafields.variants) {
        const variantId = variant.id;
        const oldSku = variant.oldSku;
        const currentSku = variant.sku;

        if (oldSku) {
          const updateSkuMutation = `
            mutation {
              productVariantUpdate(input: {
                id: "${variantId}",
                sku: "${oldSku}"
              }) {
                productVariant {
                  id
                  sku
                }
                userErrors {
                  field
                  message
                }
              }
            }`;

          await shopifyErrorHandler(() =>
            client.query({
              data: {
                query: updateSkuMutation,
              },
            })
          );

          // Mutation to save the new current SKU into the metafield as old SKU
          const saveOldSkuMutation = `
            mutation {
              productVariantUpdate(input: {
                id: "${variantId}",
                metafields: [
                  {
                    namespace: "custom",
                    key: "old_sku",
                    value: "${currentSku}",
                    type: "single_line_text_field"
                  }
                ]
              }) {
                productVariant {
                  id
                  metafields(first: 1) {
                    edges {
                      node {
                        key
                        value
                      }
                    }
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }`;

          await shopifyErrorHandler(() =>
            client.query({
              data: {
                query: saveOldSkuMutation,
              },
            })
          );

          console.log(
            `Saved current SKU ${currentSku} as old SKU in metafield for variant ${variantId}`
          );
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "SKU updated and old SKU saved successfully",
    });
  } catch (error) {
    console.error("Error updating SKU:", error);
    res.status(500).json({ error: "Failed to update SKU" });
  }
});

app.get("/api/check-duplicate-sku", async (req, res) => {
  try {
    const skuMap = {}; // Map to track SKUs and corresponding variants
    let hasNextPage = true;
    let endCursor = null;
    const session = res.locals.shopify.session;
    const client = new shopify.api.clients.Graphql({ session });

    const query = `
      query ($first: Int, $after: String) {
        products(first: $first, after: $after) {
          edges {
            node {
              id
              title
              featuredImage {
                url
              }
              variants(first: 250) {
                edges {
                  node {
                    id
                    sku
                    title
                  }
                }
              }
            }
            cursor
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }`;

    while (hasNextPage) {
      const response = await shopifyErrorHandler(async () => {
        return await client.query({
          data: {
            query: query,
            variables: {
              first: 50,
              after: endCursor,
            },
          },
        });
      });

      const fetchedProducts = response.body.data.products.edges;

      // Process each product and its variants
      fetchedProducts.forEach(({ node: product }) => {
        product.variants.edges.forEach(({ node: variant }) => {
          const sku = variant.sku;

          // Track SKU occurrences
          if (sku) {
            if (skuMap[sku]) {
              skuMap[sku].push({
                productId: product.id,
                productTitle: product.title,
                variantId: variant.id,
                variantTitle: variant.title,
                currentSku: variant.sku,
                image: product?.featuredImage?.url
                  ? product.featuredImage.url
                  : "",
              });
            } else {
              skuMap[sku] = [
                {
                  productId: product.id,
                  productTitle: product.title,
                  variantId: variant.id,
                  variantTitle: variant.title,
                  currentSku: variant.sku,
                  image: product?.featuredImage?.url
                    ? product.featuredImage.url
                    : "",
                },
              ];
            }
          }
        });
      });

      // Update pagination variables
      hasNextPage = response.body.data.products.pageInfo.hasNextPage;
      endCursor = response.body.data.products.pageInfo.endCursor;
    }

    // Filter only SKUs with duplicates
    const duplicates = Object.values(skuMap).filter(
      (variants) => variants.length > 1
    );

    // Calculate total duplicates, products affected, and most duplicated SKU
    const totalDuplicates = duplicates.reduce(
      (sum, variantGroup) => sum + variantGroup.length,
      0
    );
    const productsAffected = new Set();
    let mostDuplicatedSKU = { sku: "-", count: 0 };

    duplicates.forEach((variantGroup) => {
      // Track affected products
      variantGroup.forEach((variant) => {
        productsAffected.add(variant.productId);
      });

      // Check for the most duplicated SKU
      if (variantGroup.length > mostDuplicatedSKU.count) {
        mostDuplicatedSKU = {
          sku: variantGroup[0].currentSku, // Assuming you want the title of the first variant as the most duplicated SKU
          count: variantGroup.length,
        };
      }
    });

    // Prepare the response
    res.json({
      totalDuplicates,
      productsAffected: productsAffected.size,
      mostDuplicatedSKU,
      duplicates,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve duplicate SKUs" });
  }
});

app.post("/api/save-edited-duplicate-sku/:shopId", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const client = new shopify.api.clients.Graphql({ session });

    const currentPlan = await getCurrentPlan(session, req.params.shopId);

    // Allow SKUs update for active monthly plans (e.g., "Basic Monthly", "Pro")
    if (
      currentPlan.chargeName !== "Free Plan" &&
      !(
        currentPlan.chargeName === "Pay as You Go" &&
        (currentPlan.creditsRemaining === null ||
          currentPlan.creditsRemaining <= 0)
      )
    ) {
      let creditsUsed = 0;
      const maxCredits = currentPlan.creditsRemaining || 0; // Dynamic credit limit for Pay as You Go plan

      for (const [variantId, newSku] of Object.entries(req.body.skus)) {
        if (
          currentPlan.chargeName === "Pay as You Go" &&
          creditsUsed >= maxCredits
        ) {
          break; // Stop if credit limit is reached
        }

        const updateSkuMutation = `
          mutation {
            productVariantUpdate(input: {
              id: "${variantId}",
              sku: "${newSku}"
            }) {
              productVariant {
                id
                sku
              }
              userErrors {
                field
                message
              }
            }
          }`;

        // Attempt SKU update
        const response = await shopifyErrorHandler(() =>
          client.query({
            data: {
              query: updateSkuMutation,
            },
          })
        );

        if (response.body.data.productVariantUpdate.userErrors.length === 0) {
          creditsUsed += 1; // Increment credits used only if update is successful

          // Decrement credits in the database if on "Pay as You Go" plan
          if (currentPlan.chargeName === "Pay as You Go") {
            await BillingDetailsModel.updateOne(
              { shopId: req.params.shopId },
              {
                $inc: {
                  creditsRemaining: -1,
                  createdInThisMonth: 1,
                },
              }
            );
          }
        } else {
          console.error(
            "SKU update error:",
            response.data.productVariantUpdate.userErrors
          );
        }
      }

      return res.json({
        status: "success",
        message: `Updated ${creditsUsed} SKUs successfully.`,
      });
    }

    res.status(403).json({
      status: "No credits",
      error: "Insufficient plan or credits to update SKUs",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "fail", error: "Failed to save SKUs" });
  }
});

// Schedule the function to run every Thursday at 10:00 AM
// cron.schedule("0 10 * * 4", () => {
//   sendWeekly();
//   console.log("Weekly reports updated to Mautic");
// });

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  sendErrorEmail(err); // Send email with error details
  res
    .status(500)
    .json({ error: "Something went wrong. Please try again later." });
});

app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});
console.log(PORT);
app.listen(PORT);

// handling some uncaught errors
process.on("uncaughtException", (err) => {
  console.log(err);
});
