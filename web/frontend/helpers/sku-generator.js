export default async function skuGenerator(
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
  layoutOrder,
  productVariant,
  productTitleInclude,
  conditions,
  countPerVariant,
  productOption,
  bodyNumberType,
  randomNumberLength
) {
  let count = Number(
    bodyNumberType === "random"
      ? generateRandomNumber(randomNumberLength)
      : basicRules.body
  );
  let vendorAbbreviation,
    productTypeAbbreviation,
    conditionedResult = "",
    resultString = "";

  try {
    for (const product of products) {
      if (product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
          if (selected !== 0) {
            vendorAbbreviation = product.vendor.substring(0, selected); // extract the specified characters of the product vendor string
          }
          if (selectedType !== 0) {
            const productType = product.product_type || product.productType;
            productTypeAbbreviation = productType?.substring(0, selectedType);
          }
          conditions.forEach((condition) => {
            const { selectedField, valueToAdd, valueToMatch } = condition;

            if (selectedField === "product_title") {
              conditionedResult =
                variant.title.toLowerCase() === valueToMatch.toLowerCase()
                  ? (resultString !== "" ? separator : "") + valueToAdd
                  : "";
            } else if (selectedField === "product_type") {
              const productType =
                product.productType?.toLowerCase() ||
                product.product_type?.toLowerCase();
              conditionedResult =
                productType === valueToMatch.toLowerCase()
                  ? (resultString !== "" ? separator : "") + valueToAdd
                  : "";
            } else if (selectedField === "product_vendor") {
              conditionedResult =
                product.vendor?.toLowerCase() === valueToMatch.toLowerCase()
                  ? (resultString !== "" ? separator : "") + valueToAdd
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
          if (applyToEmpty && variant.sku) continue;
          const sku = generateSku(
            productOption === "custom"
              ? variant.title.replace(/\s*\/\s*/g, "")
              : [variant.option1, variant.option2, variant.option3]
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
          variant.prevSku = removeSpace ? sku.split(" ").join("") : sku;
          if (countPerVariant) {
            if (bodyNumberType === "random") {
              count = generateRandomNumber(randomNumberLength);
            } else {
              count++; // Increment count for each variant if countPerVariant is true
            }
          }
        }
      } else {
        // If the product doesn't have variants, use the product itself
        if (selected !== 0) {
          vendorAbbreviation = product.vendor.substring(0, selected); // extract the specified characters of the product vendor string
        }
        if (selectedType !== 0) {
          const productType = product.product_type || product.productType;
          productTypeAbbreviation = productType?.substring(0, selectedType);
        }
        conditions.forEach((condition) => {
          const { selectedField, valueToAdd, valueToMatch } = condition;
          if (selectedField === "product_title") {
            conditionedResult =
              product.title.toLowerCase() === valueToMatch.toLowerCase()
                ? (resultString !== "" ? separator : "") + valueToAdd
                : "";
          } else if (selectedField === "product_type") {
            const productType =
              product.productType?.toLowerCase() ||
              product.product_type?.toLowerCase();
            conditionedResult =
              productType === valueToMatch.toLowerCase()
                ? (resultString !== "" ? separator : "") + valueToAdd
                : "";
          } else if (selectedField === "product_vendor") {
            conditionedResult =
              product.vendor?.toLowerCase() === valueToMatch.toLowerCase()
                ? (resultString !== "" ? separator : "") + valueToAdd
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
        const sku = generateSku(
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
        product.prevSku = removeSpace ? sku.split(" ").join("") : sku;

        if (countPerVariant) {
          if (bodyNumberType === "random") {
            count = generateRandomNumber(randomNumberLength);
          } else {
            count++; // Increment count for each variant if countPerVariant is true
          }
        }
      }
      if (!countPerVariant) {
        if (bodyNumberType === "random") {
          count = generateRandomNumber(randomNumberLength);
        } else {
          count++; // Increment count for each variant if countPerVariant is true
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
  return products;
}

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
            const productIdNumber = productId
              ? String(productId.match(/\d+$/)?.[0])
              : "";
            skuComponents.push(productIdNumber);
          } else if (bodyNumberType === "variantId") {
            const variantIdNumber = variantId
              ? String(variantId.match(/\d+$/)?.[0])
              : "";
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

  // Filter out any empty components before joining them
  let sku = skuComponents
    .filter((component) => component !== "")
    .join(separator);

  // Capitalize SKU if makeAllCapital is true
  if (makeAllCapital) {
    sku = sku.toUpperCase();
  }

  return sku;
};

function generateRandomNumber(length) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomNum.toString();
}
