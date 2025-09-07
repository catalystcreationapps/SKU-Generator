import {
  Card,
  EmptyState,
  IndexTable,
  InlineStack,
  Page,
  Pagination,
  Spinner,
  Text,
  Thumbnail,
} from "@shopify/polaris";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthenticatedFetch } from "../../hooks/useAuthenticatedFetch";
import { useTranslation } from "react-i18next";

function OldAndNewSkus({
  setActivePage,
  fetching,
  historyData,
  jobId,
  totalPages,
  totalItems,
  currentPage,
  setCurrentPage,
  getSkuData,
}) {
  const fetchApi = useAuthenticatedFetch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [reverting, setReverting] = useState(false);

  const resourceName = {
    singular: "history",
    plural: "histories",
  };

  const revertToOldSku = async () => {
    setReverting(true);
    try {
      const res = await fetchApi(`/api/sku/revert/${jobId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const resp = await res.json();
      setReverting(false);
    } catch (error) {
      console.log(error);
      setReverting(false);
    }
  };

  const rowMarkup = historyData?.map((data) =>
    data?.variants.map(({ id, title, sku, oldSku }, index) => (
      <IndexTable.Row id={id} key={id} position={index}>
        <IndexTable.Cell>
          <InlineStack align="center">
            <Thumbnail
              source={
                data.featuredImage !== null
                  ? data.featuredImage.url
                  : "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/800px-No_image_available.svg.png"
              }
              size="small"
            />
          </InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack align="center">{data.title}</InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack align="center">{title}</InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack align="center">{oldSku}</InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack align="center">
            <Text>{sku}</Text>
          </InlineStack>
        </IndexTable.Cell>
      </IndexTable.Row>
    ))
  );

  const emptyStateMarkup =
    historyData?.length === 0 ? (
      <EmptyState
        heading={t("ProgressOrHistory.oldVsNewSku.empty.heading")}
        action={{
          content: t("ProgressOrHistory.oldVsNewSku.empty.generate"),
          onAction: () => navigate("/"),
        }}
        secondaryAction={{
          content: t("ProgressOrHistory.oldVsNewSku.empty.contact"),
          url: "https://appsfinal.freshdesk.com/support/tickets/new",
        }}
        image="https://cdn.shopify.com/s/files/1/2376/3301/products/emptystate-files.png"
      >
        <p>{t("ProgressOrHistory.oldVsNewSku.empty.content")}</p>
      </EmptyState>
    ) : null;

  // Handle pagination
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      getSkuData(jobId, currentPage + 1);
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      getSkuData(jobId, currentPage - 1);
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Page
      title={
        <Text fontWeight="bold" variant="headingLg">
          {t("ProgressOrHistory.oldVsNewSku.heading")}
        </Text>
      }
      primaryAction={{
        content: (
          <div
            style={{ display: "flex", alignItems: "center", gap: "3px" }}
            onClick={() => revertToOldSku()}
          >
            {t("ProgressOrHistory.oldVsNewSku.button")}
          </div>
        ),
        loading: reverting,
      }}
      backAction={{
        content: "Back",
        onAction: () => setActivePage(false),
      }}
      subtitle={t("ProgressOrHistory.oldVsNewSku.subHeading")}
    >
      {fetching ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "97vh",
          }}
        >
          <Spinner size="large" />
        </div>
      ) : (
        <Card padding={"0"}>
          <IndexTable
            emptyState={emptyStateMarkup}
            resourceName={resourceName}
            itemCount={historyData?.length || 0}
            headings={[
              {
                title: t("ProgressOrHistory.oldVsNewSku.table.column1"),
                alignment: "center",
              },
              {
                title: t("ProgressOrHistory.oldVsNewSku.table.column2"),
                alignment: "center",
              },
              {
                title: t("ProgressOrHistory.oldVsNewSku.table.column3"),
                alignment: "center",
              },
              {
                title: t("ProgressOrHistory.oldVsNewSku.table.column4"),
                alignment: "center",
              },
              {
                title: t("ProgressOrHistory.oldVsNewSku.table.column5"),
                alignment: "center",
              },
            ]}
            selectable={false}
          >
            {rowMarkup}
          </IndexTable>
          <Pagination
            onPrevious={handlePreviousPage}
            onNext={handleNextPage}
            type="table"
            hasNext={currentPage < totalPages}
            hasPrevious={currentPage > 1}
            label={`${(currentPage - 1) * 25 + 1}-${Math.min(
              currentPage * 25,
              totalItems
            )} of ${totalItems} products`}
          />
        </Card>
      )}
      <br />
    </Page>
  );
}

export default OldAndNewSkus;
