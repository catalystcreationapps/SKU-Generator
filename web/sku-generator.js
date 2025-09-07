import { GraphqlQueryError } from "@shopify/shopify-api";
import shopify from "./shopify.js";
import shopifyErrorHandler from "./helpers/error-handler.js";
import BillingDetailsModel from "./models/BillingDetailsModel.js";

const GENERATE_SKU_MUTATION = `
  mutation updateProductVariantMetafields($input: ProductVariantInput!) {
    productVariantUpdate(input: $input) {
      productVariant {
        id
        sku,
        title,
      }
      userErrors {
        message
        field
      }
    }
  }
`;

async function fetchBodyToContinue(
  shopId,
  batchNumber,
  basicRules,
  bodyNumberType,
  randomNumberLength
) {
  // Fetch the billing details for the shop
  const result = await BillingDetailsModel.findOne({
    shopId: shopId,
  });
  let count = 0;
  if (bodyNumberType === "continue") {
    count = result?.lastBodyNo ? result.lastBodyNo : 0;
  } else if (bodyNumberType === "random") {
    count = generateRandomNumber(randomNumberLength);
  } else {
    if (batchNumber === 1) {
      count = basicRules.body;
    } else {
      count = result?.lastBodyNo ? result.lastBodyNo : 0;
    }
  }
  const creditsRemaining = result?.creditsRemaining
    ? result.creditsRemaining
    : 0;

  return {
    count,
    creditsRemaining,
  };
}

async function saveBodyToContinue(shopId, count, preferenceId) {
  await BillingDetailsModel.findOneAndUpdate(
    { shopId: shopId },
    {
      $set: {
        lastBodyNo: count,
        "skuPreference.$[elem].basicRules.body": count,
      },
    },
    {
      new: true,
      arrayFilters: [{ "elem._id": preferenceId }],
    }
  );
}

export async function skuGenerator(
  session,
  body,
  createdSku,
  shopId,
  bodyToContinue,
  batchNumber,
  preferenceId,
  currentPlan,
  progressCallback
) {
  const {
    products,
    basicRules,
    separator,
    applyToEmpty,
    delimeters,
    delimetersPosition,
    selected,
    selectedType,
    removeSpace,
    makeAllCapital,
    lastBodyNo,
    incaseOfDuplicate,
    layoutOrder,
    productVariant,
    conditions = [],
    productOption,
    tags = [],
    productTitleInclude,
    disableBodyNumber,
    countPerVariant,
    bodyNumberType,
    randomNumberLength,
  } = body;

  const client = new shopify.api.clients.Graphql({ session });

  let { count, creditsRemaining } = await fetchBodyToContinue(
    shopId,
    batchNumber,
    basicRules,
    bodyNumberType,
    randomNumberLength
  );
  let vendorAbbreviation,
    productTypeAbbreviation,
    conditionedResult = "",
    resultString = "";

  const totalVariants = products.length;

  try {
    for (const [index, productId] of products.entries()) {
      let product = await fetchProductData(productId, session);
      if (productOption == "tag") {
        if (product && product.tags) {
          const productTagsArray = product.tags.map((tag) =>
            tag.trim().toLowerCase()
          );
          const tagsArray = tags.map((tag) => tag.toLowerCase());
          const hasCommonTag = tagsArray.some((tag) =>
            productTagsArray.includes(tag)
          );
          if (!hasCommonTag) {
            continue;
          }
        } else {
          continue;
        }
      }

      if (product && product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {

          if (selected !== 0 && product.vendor) {
            vendorAbbreviation = product.vendor.substring(0, selected);
          }
          if (selectedType !== 0 && product.productType) {
            productTypeAbbreviation = product.productType.substring(
              0,
              selectedType
            );
          }
          if (conditions.length > 0) {
            conditions.forEach((condition) => {
              const { selectedField, valueToAdd, valueToMatch } = condition;

              if (selectedField === "product_title") {
                conditionedResult =
                  variant.title.toLowerCase() === valueToMatch.toLowerCase()
                    ? (resultString != "" ? separator : "") + valueToAdd
                    : "";
              } else if (selectedField === "product_type") {
                const productType = product.productType?.toLowerCase();
                conditionedResult =
                  productType === valueToMatch.toLowerCase()
                    ? (resultString != "" ? separator : "") + valueToAdd
                    : "";
              } else if (selectedField === "product_vendor") {
                conditionedResult =
                  product.vendor?.toLowerCase() === valueToMatch.toLowerCase()
                    ? (resultString != "" ? separator : "") + valueToAdd
                    : "";
              } else if (selectedField === "product_tag") {
                conditionedResult =
                  product.tags &&
                  product.tags.some((tag) =>
                    tag.toLowerCase().includes(valueToMatch.toLowerCase())
                  )
                    ? (resultString !== "" ? separator : "") + valueToAdd
                    : "";
              }
              resultString += conditionedResult;
            });
          }

          if (applyToEmpty && variant.sku) continue;
          if (
            currentPlan === "Pay as You Go" &&
            creditsRemaining <= createdSku
          ) {
            break;
          }
          await saveCurrentSkuToMetafield(
            client,
            product.id,
            variant.id,
            variant.sku
          );
          // return;
          let sku = generateSku(
            [variant.option1, variant.option2, variant.option3]
              .filter(Boolean)
              .join(separator),
            basicRules,
            separator,
            delimeters,
            delimetersPosition,
            vendorAbbreviation,
            productTypeAbbreviation,
            resultString,
            count,
            layoutOrder,
            productVariant,
            productTitleInclude,
            product.title,
            makeAllCapital,
            bodyNumberType,
            product.id,
            variant.id
          );
          resultString = "";
          let skuExists = true;
          while (skuExists) {
            const response = await shopifyErrorHandler(() =>
              client.query({
                data: `query {
                productVariants (first:10){
                  edges {
                    node {
                      id
                      sku,
                      title
                    }
                  }
                }
              }`,
              })
            );

            const existingSku = response.body.data.productVariants.edges.find(
              (edge) => {
                const skuValue = edge.node.sku
                  ? edge.node.sku.split(" ").join("")
                  : "";
                const searchValue = sku ? sku.split(" ").join("") : "";
                return skuValue === searchValue;
              }
            );
            if (
              existingSku &&
              bodyNumberType !== "productId" &&
              bodyNumberType !== "variantId" &&
              bodyNumberType !== "disable"
            ) {
              if (incaseOfDuplicate === "newSKU") {
                // count++;

                if (bodyNumberType === "random") {
                  count = generateRandomNumber(randomNumberLength);
                } else {
                  count++;
                }

                if (
                  currentPlan === "Pay as You Go" &&
                  creditsRemaining <= createdSku
                ) {
                  break;
                }
                sku = generateSku(
                  // variant.title,
                  [variant.option1, variant.option2, variant.option3]
                    .filter(Boolean)
                    .join(separator),
                  basicRules,
                  separator,
                  delimeters,
                  delimetersPosition,
                  vendorAbbreviation,
                  productTypeAbbreviation,
                  resultString,
                  count,
                  layoutOrder,
                  productVariant,
                  productTitleInclude,
                  product.title,
                  makeAllCapital,
                  bodyNumberType,
                  product.id,
                  variant.id
                );
                resultString = "";
              } else {
                skuExists = false;
              }
            } else {
              skuExists = false;
            }
          }

          const response = await shopifyErrorHandler(() =>
            client.query({
              data: {
                query: GENERATE_SKU_MUTATION,
                variables: {
                  input: {
                    id: Number.isInteger(variant.id)
                      ? // ? variant.admin_graphql_api_id
                        `gid://shopify/ProductVariant/${variant.id}`
                      : variant.id,
                    sku: removeSpace ? sku.split(" ").join("") : sku,
                  },
                },
              },
            })
          );

          if (countPerVariant) {
            // count++; // Increment count for each variant if countPerVariant is true
            if (bodyNumberType === "random") {
              count = generateRandomNumber(randomNumberLength);
            } else {
              count++; // Increment count for each variant if countPerVariant is true
            }
          }
          // count++;
          createdSku++;
          const progress = (index / totalVariants) * 100;
          progressCallback(progress);
        }
      } else {
        // Use the product directly when there are no variants
        if (selected !== 0 && product?.vendor) {
          vendorAbbreviation = product?.vendor?.substring(0, selected);
        }
        if (selectedType !== 0) {
          if (product?.productType) {
            productTypeAbbreviation = product.productType.substring(
              0,
              selectedType
            );
          }
        }

        if (conditions.length > 0) {
          conditions.forEach((condition) => {
            const { selectedField, valueToAdd, valueToMatch } = condition;

            if (selectedField === "product_title") {
              conditionedResult =
                variant.title.toLowerCase() === valueToMatch.toLowerCase()
                  ? (resultString != "" ? separator : "") + valueToAdd
                  : "";
            } else if (selectedField === "product_type") {
              const productType = product.productType?.toLowerCase();
              conditionedResult =
                productType === valueToMatch.toLowerCase()
                  ? (resultString != "" ? separator : "") + valueToAdd
                  : "";
            } else if (selectedField === "product_vendor") {
              conditionedResult =
                product.vendor?.toLowerCase() === valueToMatch.toLowerCase()
                  ? (resultString != "" ? separator : "") + valueToAdd
                  : "";
            } else if (selectedField === "product_tag") {
              conditionedResult =
                product.tags &&
                product.tags.some((tag) =>
                  tag.toLowerCase().includes(valueToMatch.toLowerCase())
                )
                  ? (resultString !== "" ? separator : "") + valueToAdd
                  : "";
            }
            resultString += conditionedResult;
          });
        }

        if (applyToEmpty && product?.sku) continue;
        if (currentPlan === "Pay as You Go" && creditsRemaining <= createdSku) {
          break;
        }
        let sku = generateSku(
          product?.title ? product.title : "",
          basicRules,
          separator,
          delimeters,
          delimetersPosition,
          vendorAbbreviation,
          productTypeAbbreviation,
          resultString,
          count,
          layoutOrder,
          productVariant,
          productTitleInclude,
          product?.title ? product.title : "",
          makeAllCapital,
          bodyNumberType,
          product.id,
          null
        );
        resultString = "";
        let skuExists = true;
        while (skuExists) {
          const response = await shopifyErrorHandler(() =>
            client.query({
              data: `query {
                productVariants (first:10){
                edges {
                  node {
                    id
                    sku,
                    title
                    }
                  }
                }
              }`,
            })
          );

          const existingSku = response.body.data.productVariants.edges.find(
            (edge) => {
              const skuValue = edge.node.sku
                ? edge.node.sku.split(" ").join("")
                : "";
              const searchValue = sku ? sku.split(" ").join("") : "";
              return skuValue === searchValue;
            }
          );

          if (
            existingSku &&
            bodyNumberType !== "productId" &&
            bodyNumberType !== "variantId" &&
            bodyNumberType !== "disable"
          ) {
            if (incaseOfDuplicate === "newSKU") {
              // count++;

              if (bodyNumberType === "random") {
                count = generateRandomNumber(randomNumberLength);
              } else {
                count++; // Increment count for each variant if countPerVariant is true
              }

              if (
                currentPlan === "Pay as You Go" &&
                creditsRemaining <= createdSku
              ) {
                break;
              }
              sku = generateSku(
                product.title,
                basicRules,
                separator,
                delimeters,
                delimetersPosition,
                vendorAbbreviation,
                productTypeAbbreviation,
                resultString,
                count,
                layoutOrder,
                productVariant,
                productTitleInclude,
                product.title,
                makeAllCapital,
                bodyNumberType,
                product.id
              );
              resultString = "";
            } else {
              skuExists = false;
            }
          } else {
            skuExists = false;
          }
        }

        const response = await shopifyErrorHandler(() =>
          client.query({
            data: {
              query: GENERATE_SKU_MUTATION,
              variables: {
                input: {
                  id: Number.isInteger(product?.id)
                    ? // ? product.admin_graphql_api_id
                      `gid://shopify/Product/${product.id}`
                    : product.id,
                  sku: removeSpace ? sku.split(" ").join("") : sku,
                },
              },
            },
          })
        );

        if (countPerVariant) {
          // count++; // Increment count for each variant if countPerVariant is true
          if (bodyNumberType === "random") {
            count = generateRandomNumber(randomNumberLength);
          } else {
            count++; // Increment count for each variant if countPerVariant is true
          }
        }

        // count++;
        createdSku++;
        const progress = (index / totalVariants) * 100;
        progressCallback(progress);
      }
      if (!countPerVariant) {
        // count++; // Increment count for each product if not counting per variant
        if (bodyNumberType === "random") {
          count = generateRandomNumber(randomNumberLength);
        } else {
          count++; // Increment count for each variant if countPerVariant is true
        }
      }
      // }
    }
  } catch (error) {
    console.log(error);
    if (error instanceof GraphqlQueryError) {
      console.log(
        "GraphQL query error details:",
        error.message,
        error.response
      );
      return {
        error: `${error.message}\n${JSON.stringify(error.response, null, 2)}`,
      };
    } else {
      throw error;
    }
  }
  // Save the updated bodyToContinue to the database
  await saveBodyToContinue(shopId, count, preferenceId);

  return { createdSku, count };
}


const extractId = (id) => {
  if (typeof id === "string" && id.includes("gid://")) {
    return id.match(/\d+$/)?.[0] || "";
  }
  return String(id);
};

const generateSku = (
  title,
  rules,
  separator,
  delimeters,
  delimetersPosition,
  vendorAbbreviation,
  productTypeAbbreviation,
  resultString,
  count,
  layoutOrder,
  productVariant,
  productTitleInclude,
  productTitle,
  makeAllCapital,
  bodyNumberType,
  productId,
  variantId = null
) => {
  let skuComponents = [];

  if (rules?.head) {
    skuComponents.push(rules.head);
  }

  if (delimetersPosition) {
    skuComponents.push(delimeters);
  }

  layoutOrder.forEach(({ id, name }, index) => {
    switch (name) {
      case "Title":
        if (productTitleInclude) {
          skuComponents.push(productTitle);
        }
        break;
      case "Variant":
        if (productVariant) {
          skuComponents.push(title);
        }
        break;
      case "Type":
        if (productTypeAbbreviation) {
          skuComponents.push(productTypeAbbreviation);
        }
        break;
      case "Vendor":
        if (vendorAbbreviation) {
          skuComponents.push(vendorAbbreviation);
        }
        break;
      case "If-Then":
        if (resultString) {
          skuComponents.push(resultString);
        }
        break;
      case "Body":
        if (bodyNumberType !== "disable") {
          if (bodyNumberType === "productId") {
            const productIdNumber = extractId(productId);
            skuComponents.push(productIdNumber);
          } else if (bodyNumberType === "variantId") {
            const variantIdNumber = extractId(variantId);
            skuComponents.push(variantIdNumber);
          } else {
            if (rules.body.length === 1) {
              skuComponents.push(String(count));
            } else {
              const paddedCount = String(count).padStart(
                rules.body.length,
                "0"
              );
              skuComponents.push(paddedCount);
            }
          }
        }
        break;
      default:
        throw new Error(`Invalid SKU component: ${name}`);
    }
  });

  if (rules?.tail) {
    skuComponents.push(rules.tail);
  }

  if (!delimetersPosition) {
    skuComponents.push(delimeters);
  }

  let sku = skuComponents
    .filter((component) => component !== "")
    .join(separator);

  if (makeAllCapital) {
    sku = sku.toUpperCase();
  }

  return sku;
};

// Function to save the current SKU to a metafield
async function saveCurrentSkuToMetafield(
  client,
  productId,
  variantId,
  currentSku
) {
  if (!currentSku) return;

  const mutation = `mutation {
    productVariantUpdate(input: {
      id: "${variantId}",
      metafields: [
        {
          namespace: "custom",
          key: "old_sku",
          value: "${currentSku}",
          type: "single_line_text_field" // Updated from valueType to type
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
    }
  }`;

  const mutation1 = `mutation {
  productVariantsBulkUpdate(productId: "${productId}", variants: [
    {
      id: "${variantId}",
      metafields: [
          {
            namespace: "custom",
            key: "old_sku",
            value: "${currentSku.replace(/"/g, '\\"')}",
            type: "single_line_text_field"
          }
        ]
      }
    ]) {
      productVariants {
        id
        metafields(first: 1) {
          edges {
            node {
              namespace
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

  try {
    await shopifyErrorHandler(() =>
      client.query({
        data: {
          query: mutation1,
        },
      })
    );
    console.log(`Successfully saved SKU ${currentSku} to metafield.`);
  } catch (error) {
    console.error(`Failed to save SKU ${currentSku} to metafield:`, error);
  }
}

export const fetchProductData = async (productId, session) => {
  const client = new shopify.api.clients.Graphql({ session });
  const query = `query ($productId: ID!, $after: String) {
    product(id: $productId) {
      id
      title
      vendor
      productType
      tags
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
    const options = variant.selectedOptions.reduce(
      (acc, optionValue, index) => {
        acc[`option${index + 1}`] = optionValue.optionValue.name;
        return acc;
      },
      {}
    );
    return { ...variant, ...options };
  });

  return {
    ...productData,
    variants,
  };
};

export async function skuGeneratorForWebhook(
  session,
  body,
  createdSku,
  shopId,
  bodyToContinue,
  currentPlan,
  progressCallback
) {
  const {
    products,
    basicRules,
    separator,
    applyToEmpty,
    delimeters,
    delimetersPosition,
    selected,
    selectedType,
    removeSpace,
    makeAllCapital,
    lastBodyNo,
    bodyNumberType,
    incaseOfDuplicate,
    layoutOrder,
    productVariant,
    conditions = [],
    productOption,
    tags = [],
    productTitleInclude,
    disableBodyNumber = false,
    countPerVariant = true,
  } = body;

  const client = new shopify.api.clients.Graphql({ session });

  // let count = Number(lastBodyNo ? bodyToContinue : basicRules.body);

  let { count, creditsRemaining } = await fetchBodyToContinue(
    shopId,
    1,
    basicRules,
    bodyNumberType.bodyNumberType,
    bodyNumberType.randomNumberLength
  );

  let vendorAbbreviation,
    productTypeAbbreviation,
    conditionedResult = "",
    resultString = "";

  const totalVariants = products.reduce(
    (count, product) =>
      count + (product?.variants ? product.variants.length : 0),
    0
  );

  try {
    for (const product of products) {
      if (productOption == "tag") {
        const productTagsArray = product.tags.map((tag) =>
          tag.trim().toLowerCase()
        );
        const tagsArray = tags.map((tag) => tag.toLowerCase());
        const hasCommonTag = tagsArray.some((tag) =>
          productTagsArray.includes(tag)
        );

        // If none of the tags match, skip the product
        if (!hasCommonTag) {
          continue;
        }
      }

      if (product && product.variants && product.variants.length > 0) {
        const VariantData = await shopify.api.rest.Product.find({
          session: session,
          id: product.id,
          fields: "variants",
        });

        for (const variant of VariantData.variants) {
          if (selected !== 0 && product.vendor) {
            vendorAbbreviation = product.vendor.substring(0, selected);
          }
          if (selectedType !== 0 && product.product_type) {
            productTypeAbbreviation = product.product_type.substring(
              0,
              selectedType
            );
          }
          if (conditions.length > 0) {
            conditions.forEach((condition) => {
              const { selectedField, valueToAdd, valueToMatch } = condition;

              if (selectedField === "product_title") {
                conditionedResult =
                  variant.title.toLowerCase() === valueToMatch.toLowerCase()
                    ? (resultString != "" ? separator : "") + valueToAdd
                    : "";
              } else if (selectedField === "product_type") {
                const productType =
                  product.productType?.toLowerCase() ||
                  product.product_type?.toLowerCase();
                conditionedResult =
                  productType === valueToMatch.toLowerCase()
                    ? (resultString != "" ? separator : "") + valueToAdd
                    : "";
              } else if (selectedField === "product_vendor") {
                conditionedResult =
                  product.vendor?.toLowerCase() === valueToMatch.toLowerCase()
                    ? (resultString != "" ? separator : "") + valueToAdd
                    : "";
              } else if (selectedField === "product_tag") {
                conditionedResult =
                  product.tags &&
                  product.tags
                    .split(",")
                    .some((tag) =>
                      tag
                        .trim()
                        .toLowerCase()
                        .includes(valueToMatch.toLowerCase())
                    )
                    ? (resultString !== "" ? separator : "") + valueToAdd
                    : "";
              }
              resultString += conditionedResult;
            });
          }

          if (applyToEmpty && variant.sku) continue;
          let sku = generateSku(
            // variant.title &&
            //   variant.title.split(" ").join("").toLowerCase() !== "defaulttitle"
            //   ? variant.title
            //   : product.title,
            [variant.option1, variant.option2, variant.option3]
              .filter(Boolean)
              .join(separator),
            basicRules,
            separator,
            delimeters,
            delimetersPosition,
            vendorAbbreviation,
            productTypeAbbreviation,
            resultString,
            count,
            layoutOrder,
            productVariant,
            productTitleInclude,
            product.title,
            makeAllCapital,
            bodyNumberType.bodyNumberType,
            product.id,
            variant.id
          );

          resultString = "";
          let skuExists = true;
          while (skuExists) {
            const response = await shopifyErrorHandler(() =>
              client.query({
                data: `query {
                  productVariants (first:10){
                    edges {
                      node {
                        id
                        sku,
                        title
                      }
                    }
                  }
                }`,
              })
            );

            const existingSku = response.body.data.productVariants.edges.find(
              (edge) => {
                const skuValue = edge.node.sku
                  ? edge.node.sku.split(" ").join("")
                  : "";
                const searchValue = sku ? sku.split(" ").join("") : "";
                return skuValue === searchValue;
              }
            );
            if (
              existingSku &&
              bodyNumberType.bodyNumberType !== "productId" &&
              bodyNumberType.bodyNumberType !== "variantId" &&
              bodyNumberType.bodyNumberType !== "disable"
            ) {
              if (incaseOfDuplicate === "newSKU") {
                if (bodyNumberType.bodyNumberType === "random") {
                  count = generateRandomNumber(
                    bodyNumberType.randomNumberLength
                  );
                } else {
                  count++;
                }
                sku = generateSku(
                  // variant.title,
                  [variant.option1, variant.option2, variant.option3]
                    .filter(Boolean)
                    .join(separator),
                  basicRules,
                  separator,
                  delimeters,
                  delimetersPosition,
                  vendorAbbreviation,
                  productTypeAbbreviation,
                  resultString,
                  count,
                  layoutOrder,
                  productVariant,
                  productTitleInclude,
                  product.title,
                  makeAllCapital,
                  bodyNumberType.bodyNumberType,
                  product.id,
                  variant.id
                );
                resultString = "";
              } else {
                skuExists = false;
              }
            } else {
              skuExists = false;
            }
          }

          const response = await shopifyErrorHandler(async () =>
            client.query({
              data: {
                query: GENERATE_SKU_MUTATION,
                variables: {
                  input: {
                    id: Number.isInteger(variant.id)
                      ? // ? variant.admin_graphql_api_id
                        `gid://shopify/ProductVariant/${variant.id}`
                      : variant.id,
                    sku: removeSpace ? sku.split(" ").join("") : sku,
                  },
                },
              },
            })
          );
          if (countPerVariant) {
            // count++; // Increment count for each variant if countPerVariant is true
            if (bodyNumberType.bodyNumberType === "random") {
              count = generateRandomNumber(bodyNumberType.randomNumberLength);
            } else {
              count++; // Increment count for each variant if countPerVariant is true
            }
            // count++; //
          }
          createdSku++;
          const progress = (createdSku / totalVariants) * 100;
          // progressCallback(progress);
        }
      } else {
        // Use the product directly when there are no variants
        if (selected !== 0 && product?.vendor) {
          vendorAbbreviation = product?.vendor?.substring(0, selected);
        }
        if (selectedType !== 0) {
          if (product?.product_type) {
            productTypeAbbreviation = product.product_type.substring(
              0,
              selectedType
            );
          } else if (product?.productType) {
            productTypeAbbreviation = product.productType.substring(
              0,
              selectedType
            );
          }
        }

        if (conditions.length > 0) {
          conditions.forEach((condition) => {
            const { selectedField, valueToAdd, valueToMatch } = condition;

            if (selectedField === "product_title") {
              conditionedResult =
                variant.title.toLowerCase() === valueToMatch.toLowerCase()
                  ? (resultString != "" ? separator : "") + valueToAdd
                  : "";
            } else if (selectedField === "product_type") {
              const productType =
                product.productType?.toLowerCase() ||
                product.product_type?.toLowerCase();
              conditionedResult =
                productType === valueToMatch.toLowerCase()
                  ? (resultString != "" ? separator : "") + valueToAdd
                  : "";
            } else if (selectedField === "product_vendor") {
              conditionedResult =
                product.vendor?.toLowerCase() === valueToMatch.toLowerCase()
                  ? (resultString != "" ? separator : "") + valueToAdd
                  : "";
            } else if (selectedField === "product_tag") {
              conditionedResult =
                product.tags &&
                product.tags
                  .split(",")
                  .some((tag) =>
                    tag
                      .trim()
                      .toLowerCase()
                      .includes(valueToMatch.toLowerCase())
                  )
                  ? (resultString !== "" ? separator : "") + valueToAdd
                  : "";
            }
            resultString += conditionedResult;
          });
        }

        if (applyToEmpty && product?.sku) continue;
        if (currentPlan === "Pay as You Go" && creditsRemaining <= createdSku) {
          break;
        }
        let sku = generateSku(
          product?.title ? product.title : "",
          basicRules,
          separator,
          delimeters,
          delimetersPosition,
          vendorAbbreviation,
          productTypeAbbreviation,
          resultString,
          count,
          layoutOrder,
          productVariant,
          productTitleInclude,
          product.title,
          makeAllCapital,
          bodyNumberType.bodyNumberType,
          product.id,
          null
        );
        resultString = "";
        let skuExists = true;
        while (skuExists) {
          const response = await shopifyErrorHandler(() =>
            client.query({
              data: `query {
                productVariants (first:10){
                edges {
                  node {
                    id
                    sku,
                    title
                    }
                  }
                }
              }`,
            })
          );

          const existingSku = response.body.data.productVariants.edges.find(
            (edge) => {
              const skuValue = edge.node.sku
                ? edge.node.sku.split(" ").join("")
                : "";
              const searchValue = sku ? sku.split(" ").join("") : "";
              return skuValue === searchValue;
            }
          );

          if (
            existingSku &&
            bodyNumberType.bodyNumberType !== "productId" &&
            bodyNumberType.bodyNumberType !== "variantId" &&
            bodyNumberType.bodyNumberType !== "disable"
          ) {
            if (incaseOfDuplicate === "newSKU") {
              // count++;

              if (bodyNumberType.bodyNumberType === "random") {
                count = generateRandomNumber(bodyNumberType.randomNumberLength);
              } else {
                count++; // Increment count for each variant if countPerVariant is true
              }

              if (
                currentPlan === "Pay as You Go" &&
                creditsRemaining <= createdSku
              ) {
                break;
              }

              sku = generateSku(
                product.title,
                basicRules,
                separator,
                delimeters,
                delimetersPosition,
                vendorAbbreviation,
                productTypeAbbreviation,
                resultString,
                count,
                layoutOrder,
                productVariant,
                productTitleInclude,
                product.title,
                makeAllCapital,
                bodyNumberType.bodyNumberType,
                product.id,
                null
              );
              resultString = "";
            } else {
              skuExists = false;
            }
          } else {
            skuExists = false;
          }
        }

        const response = await shopifyErrorHandler(() =>
          client.query({
            data: {
              query: GENERATE_SKU_MUTATION,
              variables: {
                input: {
                  id: Number.isInteger(product?.id)
                    ? // ? product.admin_graphql_api_id
                      `gid://shopify/Product/${product.id}`
                    : product.id,
                  sku: removeSpace ? sku.split(" ").join("") : sku,
                },
              },
            },
          })
        );
        if (countPerVariant) {
          // count++;
          if (bodyNumberType.bodyNumberType === "random") {
            count = generateRandomNumber(bodyNumberType.randomNumberLength);
          } else {
            count++; // Increment count for each variant if countPerVariant is true
          }
        }
        // count++;
        createdSku++;
        const progress = (createdSku / totalVariants) * 100;
        // progressCallback(progress);
      }
      if (!countPerVariant) {
        // count++;
        if (bodyNumberType.bodyNumberType === "random") {
          count = generateRandomNumber(bodyNumberType.randomNumberLength);
        } else {
          count++; // Increment count for each variant if countPerVariant is true
        }
      }
    }
  } catch (error) {
    console.log(error);
    if (error instanceof GraphqlQueryError) {
      console.log(
        "GraphQL query error details:",
        error.message,
        error.response
      );
      return {
        error: `${error.message}\n${JSON.stringify(error.response, null, 2)}`,
      };
    } else {
      throw error;
    }
  }
  return { createdSku, count };
}

function generateRandomNumber(length) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomNum.toString();
}
