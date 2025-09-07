import React from "react";
import {
  IndexTable,
  Thumbnail,
  Text,
  InlineStack,
  Spinner,
  Pagination,
  Divider,
} from "@shopify/polaris";
import { useTranslation } from "react-i18next";

function PreviewTable({
  previewProduct,
  generating,
  previousPageParameters,
  nextPageParameters,
  fetchProduct,
  fetchProductFromCollection,
  fetchProductBasedOnTags,
  fetching,
  productOption,
  collections,
  tags,
  currentHandle,
}) {
  const resourceName = {
    singular: "product",
    plural: "products",
  };
  const { t } = useTranslation();

  const rowMarkup = previewProduct.map((product, index) =>
    product.variants.map((variant) => (
      <IndexTable.Row
        id={variant.id}
        key={`${product.id}-${variant.id}`}
        position={index}
      >
        <IndexTable.Cell key={`thumbnail-${product.id}-${variant.id}`}>
          {productOption === "custom" ? (
            <Thumbnail
              source={
                product.images.length > 0 ? product.images[0].originalSrc : ""
              }
              size="small"
            />
          ) : (
            <Thumbnail
              source={
                product.featuredImage !== null ? product.featuredImage.url : ""
              }
              size="small"
            />
          )}
        </IndexTable.Cell>
        <IndexTable.Cell key={`title-${product.id}-${variant.id}`}>
          <Text as="span" alignment="start">
            {product.title} {variant.title}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell key={`product-type-${product.id}-${variant.id}`}>
          {product.productType ? (
            <Text as="span" alignment="start">
              {product.productType}
            </Text>
          ) : (
            <Text variation="negative" as="span" alignment="start">
              Not specified
            </Text>
          )}
        </IndexTable.Cell>
        <IndexTable.Cell key={`vendor-${product.id}-${variant.id}`}>
          <Text as="span" alignment="start">
            {product.vendor}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell key={`sku-${product.id}-${variant.id}`}>
          <Text>{variant.sku}</Text>
        </IndexTable.Cell>
        <IndexTable.Cell key={`prev-sku-${product.id}-${variant.id}`}>
          {generating ? (
            <InlineStack alignment="center" spacing="loose">
              <Spinner size="small"></Spinner>
            </InlineStack>
          ) : (
            <Text fontWeight="bold" tone="caution">
              {variant.prevSku ? variant.prevSku : product.prevSku}
            </Text>
          )}
        </IndexTable.Cell>
      </IndexTable.Row>
    ))
  );

  return (
    <>
      <IndexTable
        key={"PreviewTable"}
        lastColumnSticky
        resourceName={resourceName}
        itemCount={previewProduct.length}
        headings={[
          { title: <span>{t("SkuGenerate.skuPreview.label1")}</span> },
          { title: <span>{t("SkuGenerate.skuPreview.label2")}</span> },
          { title: <span>{t("SkuGenerate.skuPreview.label3")}</span> },
          { title: <span>{t("SkuGenerate.skuPreview.label4")}</span> },
          { title: <span>{t("SkuGenerate.skuPreview.label5")}</span> },
          { title: <span>{t("SkuGenerate.skuPreview.label6")}</span> },
        ]}
        selectable={false}
        loading={fetching}
      >
        {rowMarkup}
      </IndexTable>
      <Divider />
      <br />
      <InlineStack align="center">
        {productOption === "collection" ? (
          <Pagination
            hasPrevious={Boolean(previousPageParameters) || currentHandle > 1}
            onPrevious={() => {
              fetchProductFromCollection(
                previousPageParameters,
                collections,
                "previous"
              );
            }}
            hasNext={
              Boolean(nextPageParameters) || currentHandle < collections.length
            }
            onNext={() => {
              fetchProductFromCollection(
                nextPageParameters,
                collections,
                "next",
                false
              );
            }}
          />
        ) : productOption === "tag" ? (
          <Pagination
            hasPrevious={Boolean(previousPageParameters) || currentHandle > 1}
            onPrevious={() => {
              fetchProductBasedOnTags(previousPageParameters, tags, "previous");
            }}
            hasNext={Boolean(nextPageParameters) || currentHandle < tags.length}
            onNext={() => {
              fetchProductBasedOnTags(nextPageParameters, tags, "next", false);
            }}
          />
        ) : (
          <Pagination
            hasPrevious={previousPageParameters && productOption === "all"}
            onPrevious={() => {
              fetchProduct(previousPageParameters);
            }}
            hasNext={nextPageParameters && productOption === "all"}
            onNext={() => {
              fetchProduct(nextPageParameters);
            }}
          />
        )}
      </InlineStack>
      <p
        style={{
          fontSize: "12px",
          marginTop: "10px",
          fontFamily: "sans-serif",
          textAlign: "center",
        }}
      >
        {t("SkuGenerate.helpUrl.line1")}{" "}
        <a href="https://appsfinal.freshdesk.com/support/tickets/new">
          {t("SkuGenerate.helpUrl.line2")}
        </a>
      </p>
    </>
  );
}

export default React.memo(PreviewTable);
