import {
  Button,
  Card,
  EmptyState,
  Frame,
  FullscreenBar,
  IndexTable,
  InlineStack,
  Page,
  Text,
  TextField,
  Thumbnail,
} from "@shopify/polaris";
import React, { useEffect, useState } from "react";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import { Toast } from "@shopify/app-bridge-react";
import { EditIcon } from "@shopify/polaris-icons";
import useAuthContext from "../hooks/useShopContext";
import { useTranslation } from "react-i18next";

function DuplicatedSKUs() {
  const emptyToastProps = { content: null };
  const { t } = useTranslation();
  const { shop } = useAuthContext();
  const fetch = useAuthenticatedFetch();
  const [checking, setChecking] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [duplicatedProducts, setDuplicatedProducts] = useState([]);
  const [totalDuplicates, setTotalDuplicates] = useState(0);
  const [affectedProducts, setAffectedProducts] = useState(0);
  const [mostDuplicatedSku, setMostDuplicatedSku] = useState(null);
  const [editedSkus, setEditedSkus] = useState({}); // Track multiple edits
  const [hasEditedSkus, setHasEditedSkus] = useState(false); // Track if any SKU is edited
  const [editingSku, setEditingSku] = useState(null);
  const [toastProps, setToastProps] = useState(emptyToastProps);
  const [loading, setLoading] = useState(false);

  const checkForDuplicate = async () => {
    setChecking(true);
    const res = await fetch("/api/check-duplicate-sku", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const resp = await res.json();
    setDataFetched(true);
    setDuplicatedProducts(resp.duplicates);
    setTotalDuplicates(resp.totalDuplicates);
    setAffectedProducts(resp.productsAffected);
    setMostDuplicatedSku(resp.mostDuplicatedSKU);
    setChecking(false);
  };

  const startEditing = (variantId, currentSku) => {
    setEditingSku(variantId);
    setEditedSkus((prev) => ({ ...prev, [variantId]: currentSku }));
  };

  const handleSkuChange = (variantId, newSku) => {
    setEditedSkus((prev) => ({ ...prev, [variantId]: newSku || "" }));
  };

  // Use effect to check if any SKU has been edited
  useEffect(() => {
    const hasChanges = duplicatedProducts.some((product) =>
      product.some(
        (variant) =>
          (editedSkus[variant.variantId] &&
            editedSkus[variant.variantId] !== variant.currentSku) ||
          editedSkus[variant.variantId] === ""
      )
    );

    setHasEditedSkus(hasChanges);
  }, [editedSkus, duplicatedProducts]);

  const saveAllSkus = async () => {
    setLoading(true);
    const res = await fetch(
      `/api/save-edited-duplicate-sku/${shop?.shop?.id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ skus: editedSkus }),
      }
    );

    const resp = await res.json();
    if (resp.status === "success") {
      // Update the local duplicated products with the new SKUs
      setDuplicatedProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.map((variant) =>
            editedSkus[variant.variantId]
              ? { ...variant, currentSku: editedSkus[variant.variantId] }
              : variant
          )
        )
      );
      setToastProps({ content: "Products SKUs Updated Successfully" });
      setEditedSkus({});
      setHasEditedSkus(false); // Reset the edited state
      setEditingSku(null);
    } else if (resp.status === "No credits") {
      setToastProps({
        content: "Upgrade your plan or Refill your credits",
        error: true,
      });
    } else {
      setToastProps({ content: "Products SKUs failed to update", error: true });
    }
    setLoading(false);
  };

  const resourceName = {
    singular: "duplicate",
    plural: "duplicates",
  };

  const rowMarkup = duplicatedProducts?.map((data) =>
    data?.map(
      ({ variantId, image, productTitle, variantTitle, currentSku }, index) => (
        <IndexTable.Row id={variantId} key={variantId} position={index}>
          <IndexTable.Cell>
            <InlineStack align="center">
              <Thumbnail
                source={
                  image !== null
                    ? image
                    : "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/800px-No_image_available.svg.png"
                }
                size="small"
              />
            </InlineStack>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <InlineStack align="center">{productTitle}</InlineStack>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <InlineStack align="center">{variantTitle}</InlineStack>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <InlineStack align="center">
              {editingSku === variantId ? (
                <div style={{ display: "flex", alignItems: "center" }}>
                  <TextField
                    value={editedSkus[variantId]}
                    onChange={(value) => handleSkuChange(variantId, value)}
                    autoFocus
                  />
                </div>
              ) : (
                <InlineStack blockAlign="center" gap={"200"}>
                  <Text
                    variant="bodyMd"
                    style={{ cursor: "pointer", color: "#007ace" }}
                  >
                    {editedSkus[variantId] || currentSku}
                  </Text>
                  <Button
                    onClick={() => startEditing(variantId, currentSku)}
                    icon={EditIcon}
                  />
                </InlineStack>
              )}
            </InlineStack>
          </IndexTable.Cell>
        </IndexTable.Row>
      )
    )
  );

  const cancelEdits = () => {
    setEditedSkus({}); // Reset edited SKUs to original values
    setEditingSku(null);
  };

  const toastMarkup = toastProps.content && (
    <Toast {...toastProps} onDismiss={() => setToastProps(emptyToastProps)} />
  );

  const emptyStateMarkup =
    duplicatedProducts?.length === 0 ? (
      <EmptyState
        heading={t("DuplicatedSku.empty.heading")}
        secondaryAction={{
          content: t("DuplicatedSku.empty.button"),
          url: "https://appsfinal.freshdesk.com/support/tickets/new",
        }}
        image="https://cdn.shopify.com/s/files/1/2376/3301/products/emptystate-files.png"
      >
        <p>{t("DuplicatedSku.empty.content")}</p>
      </EmptyState>
    ) : null;

  return (
    <Frame>
      <Page
        title={
          <Text fontWeight="bold" variant="headingLg">
            {t("DuplicatedSku.heading")}
          </Text>
        }
      >
        {dataFetched ? (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h2 style={{ fontSize: "1rem", fontWeight: "600" }}>
                {t("DuplicatedSku.duplicateData.heading")}
              </h2>
              <Button
                variant="primary"
                onClick={checkForDuplicate}
                disabled={checking}
                loading={checking}
              >
                <p style={{ fontSize: "0.75rem" }}>
                  {checking ? (
                    <>{t("DuplicatedSku.duplicateData.button.content1")}</>
                  ) : (
                    t("DuplicatedSku.duplicateData.button.content2")
                  )}
                </p>
              </Button>
            </div>

            <div
              style={{
                display: "grid",
                gap: "24px",
                marginBottom: "24px",
                gridTemplateColumns: "repeat(3, 1fr)", // Set to 3 columns
              }}
            >
              <div
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  padding: "16px",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "8px",
                  }}
                >
                  <h3
                    style={{
                      margin: "0",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                    }}
                  >
                    {t("DuplicatedSku.duplicateData.infoCards.label1")}
                  </h3>
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                  {totalDuplicates}
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  padding: "16px",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "8px",
                  }}
                >
                  <h3
                    style={{
                      margin: "0",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                    }}
                  >
                    {t("DuplicatedSku.duplicateData.infoCards.label2")}
                  </h3>
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                  {affectedProducts}
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  padding: "16px",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "8px",
                  }}
                >
                  <h3
                    style={{
                      margin: "0",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                    }}
                  >
                    {t("DuplicatedSku.duplicateData.infoCards.label3")}
                  </h3>
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "bold" }}>
                  {/* {`${mostDuplicatedSku?.sku} (${mostDuplicatedSku?.count}  {t("DuplicatedSku.duplicateData.infoCards.miniLabel")})`} */}
                  {`${mostDuplicatedSku?.sku} (${mostDuplicatedSku?.count} ${t(
                    "DuplicatedSku.duplicateData.infoCards.miniLabel"
                  )})`}
                </div>
              </div>
            </div>

            {hasEditedSkus && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <Button disabled={loading} onClick={cancelEdits}>
                  {t("DuplicatedSku.duplicateData.editedSku.button1")}
                </Button>
                <Button
                  loading={loading}
                  disabled={loading}
                  variant="primary"
                  onClick={saveAllSkus}
                  primary
                >
                  {t("DuplicatedSku.duplicateData.editedSku.button2")}
                </Button>
              </div>
            )}

            <Card padding={"0"}>
              <IndexTable
                emptyState={emptyStateMarkup}
                resourceName={resourceName}
                itemCount={duplicatedProducts.length}
                headings={[
                  {
                    title: t("DuplicatedSku.duplicateData.table.column1"),
                    alignment: "center",
                  },
                  {
                    title: t("DuplicatedSku.duplicateData.table.column2"),
                    alignment: "center",
                  },
                  {
                    title: t("DuplicatedSku.duplicateData.table.column3"),
                    alignment: "center",
                  },
                  {
                    title: t("DuplicatedSku.duplicateData.table.column4"),
                    alignment: "center",
                  },
                ]}
                selectable={false}
              >
                {rowMarkup}
              </IndexTable>
            </Card>
            <br />
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                marginBottom: "24px",
                padding: "16px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div
                style={{ borderBottom: "1px solid #e0e0e0", padding: "8px 0" }}
              >
                <h2
                  style={{ margin: "0", fontSize: "1rem", fontWeight: "bold" }}
                >
                  {t("DuplicatedSku.duplicateChecker.heading")}
                </h2>
              </div>
              <div style={{ padding: "16px" }}>
                <p
                  style={{
                    marginBottom: "16px",
                    fontSize: "1rem",
                    color: "#4a4a4a",
                  }}
                >
                  {t("DuplicatedSku.duplicateChecker.content1")}
                </p>
                <p style={{ fontSize: "1rem", color: "#4a4a4a" }}>
                  {t("DuplicatedSku.duplicateChecker.content2")}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Button
                variant="primary"
                onClick={checkForDuplicate}
                disabled={checking}
                loading={checking}
              >
                <p style={{ fontSize: "0.75rem" }}>
                  {checking ? (
                    <>{t("DuplicatedSku.duplicateChecker.button.content1")}</>
                  ) : (
                    t("DuplicatedSku.duplicateChecker.button.content2")
                  )}
                </p>
              </Button>
            </div>
          </div>
        )}
      </Page>
      {toastMarkup}
    </Frame>
  );
}

export default DuplicatedSKUs;
