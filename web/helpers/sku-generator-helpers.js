import shopify from "../shopify.js";
import BillingDetailsModel from "../models/BillingDetailsModel.js";
import shopifyErrorHandler from "./error-handler.js";

async function getShopEmail(session) {
  const client = new shopify.api.clients.Rest({ session });
  const response = await client.get({ path: "shop" });
  return response.body.shop.email;
}

async function getProducts(req, session, planModel, limit) {
  let products = [];
  const client = new shopify.api.clients.Graphql({ session });
  const remainingQuota = planModel ? limit - planModel.productCount : undefined;

  if (req.body.productOption === "all" || req.body.productOption === "tag") {
    const productSet = new Set(); // To ensure unique product IDs

    let hasNextPage = true;
    let endCursor = null;

    const query = `
        query ($first: Int, $after: String) {
          products(first: $first, after: $after) {
          edges {
            node {
              id
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
      const response = await client.query({
        data: {
          query: query,
          variables: {
            first: 250,
            after: endCursor,
          },
        },
      });

      const fetchedProducts = response.body.data.products.edges.map(
        (edge) => edge.node.id.match(/\d+/)[0]
      );

      // Add to the Set for unique products
      fetchedProducts.forEach((productId) => productSet.add(productId));

      // Update pagination variables
      hasNextPage = response.body.data.products.pageInfo.hasNextPage;
      endCursor = response.body.data.products.pageInfo.endCursor;
    }

    products = Array.from(productSet);
  } else if (req.body.productOption === "collection") {
    const productSet = new Set(); // To ensure unique product IDs

    await Promise.all(
      req.body.collections.map(async (collection) => {
        let hasNextPage = true;
        let endCursor = null;

        while (hasNextPage) {
          const query = `
            query ($handle: String!, $first: Int, $after: String) {
              collectionByHandle(handle: $handle) {
                products(first: $first, after: $after) {
                  edges {
                    node {
                      id
                    }
                    cursor
                  }
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                }
              }
            }`;

          const response = await client.query({
            data: {
              query: query,
              variables: {
                handle: collection.handle,
                first: 250,
                after: endCursor,
              },
            },
          });

          const fetchedProducts =
            response.body.data.collectionByHandle.products.edges.map(
              (edge) => edge.node.id.match(/\d+/)[0]
            );

          // Add to the Set for unique products
          fetchedProducts.forEach((productId) => productSet.add(productId));

          // Update pagination variables
          hasNextPage =
            response.body.data.collectionByHandle.products.pageInfo.hasNextPage;
          endCursor =
            response.body.data.collectionByHandle.products.pageInfo.endCursor;
        }
      })
    );

    // Convert Set back to array to return unique product IDs
    products = Array.from(productSet);
  } else {
    products = req.body.products.slice(0, remainingQuota);
  }

  if (planModel) {
    planModel.productCount += products.length;
    await planModel.save();
  }

  return products;
}

async function getProductsWithMetafields(session, productId) {
  const client = new shopify.api.clients.Graphql({ session });
  const query = `query ($productId: ID!, $after: String) {
    product(id: $productId) {
      id
      title
      featuredImage {
        id
        url
      }
      variants(first: 100, after: $after) {
        edges {
          node {
            id
            sku
            title
            metafield(namespace: "custom", key: "old_sku") {
              value
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
        }
      }
    }
  }`;

  let variants = [];
  let hasNextPage = true;
  let after = null;
  let productData = null;

  while (hasNextPage) {
    const response = await shopifyErrorHandler(() =>
      client.query({
        data: {
          query,
          variables: {
            productId: `gid://shopify/Product/${productId}`,
            after,
          },
        },
      })
    );

    const { product } = response.body.data;
    if (!productData) {
      productData = { ...product, variants: [] };
    }
    variants = variants.concat(product.variants.edges.map((edge) => edge.node));
    hasNextPage = product.variants.pageInfo.hasNextPage;
    after = hasNextPage
      ? product.variants.edges[product.variants.edges.length - 1].cursor
      : null;
  }

  variants = variants.map((variant) => {
    const oldSku = variant.metafield?.value || "";
    const { metafield, ...rest } = variant;
    return { ...rest, oldSku };
  });

  return {
    ...productData,
    variants,
  };
}

async function savePreference(req, currentPlan) {
  if (currentPlan !== "Free Plan" || currentPlan !== "Free") {
    const preferenceData = { ...req.body };
    delete preferenceData.products;
    return await BillingDetailsModel.findOneAndUpdate(
      { shopId: req.params.shopId },
      { $push: { skuPreference: preferenceData } },
      { new: true, upsert: true }
    );
  }
}

function chunkArray(array, chunkSize) {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

export {
  getShopEmail,
  getProducts,
  savePreference,
  chunkArray,
  getProductsWithMetafields,
};
