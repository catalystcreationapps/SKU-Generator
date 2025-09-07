import {
  Frame,
  IndexTable,
  Page,
  Text,
  Badge,
  Card,
  InlineStack,
  ProgressBar,
  EmptyState,
  Spinner,
  Icon,
  Banner,
  Button,
} from "@shopify/polaris";
import { DeleteIcon, RefreshIcon } from "@shopify/polaris-icons";
import React, { useEffect, useState } from "react";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import { useNavigate } from "react-router-dom";
import useAuthContext from "../hooks/useShopContext";
import OldAndNewSkus from "../components/History/OldAndNewSkus";
import { Toast } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";

function ProgressPage() {
  const { shop, currentPlan, proPlan } = useAuthContext();
  const { t } = useTranslation();
  const emptyToastProps = { content: null };
  const fetchApi = useAuthenticatedFetch();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [jobId, setJobId] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleting, setDeleting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [toastProps, setToastProps] = useState(emptyToastProps);

  const getStatus = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/api/sku/jobs/${shop.shop.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const resp = await res.json();
      setLoading(false);
      setJobs(resp.jobs);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const getOldSKUData = async () => {
    try {
      const res = await fetchApi("/api/old-sku/present", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const resp = await res.json();
    } catch (error) {
      console.log(error);
    }
  };

  const getSkuData = async (id, page = 1) => {
    setJobId(id);
    setFetching(true);
    setActivePage(true);
    try {
      const res = await fetchApi(`/api/sku/job/data/${id}?page=${page}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const resp = await res.json();
      setHistoryData(resp.productsData);
      setTotalPages(resp.totalPages); // set total pages
      setTotalItems(resp.totalItems); // set total items
      setFetching(false);
    } catch (error) {
      console.log(error);
      setFetching(false);
    }
  };

  useEffect(() => {
    if (shop) {
      getStatus();
    }
  }, [shop]);

  const resourceName = {
    singular: "job",
    plural: "jobs",
  };

  const deleteJob = async (jobId) => {
    setDeleting(true);
    try {
      const res = await fetchApi(`/api/sku/job/delete/${jobId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const resp = await res.json();
      if (resp.success) {
        setToastProps({
          content: "Successfully Deleted the Job",
          error: false,
        });
      } else {
        setToastProps({
          content: "Failed to Delete the Job",
          error: true,
        });
      }
      getStatus();
      setDeleting(false);
    } catch (error) {
      console.log(error);
      setDeleting(false);
    }
  };

  const retryJob = async (jobId) => {
    setRetrying(true);
    try {
      const res = await fetchApi(`/api/sku/job/retry/${jobId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const resp = await res.json();
      if (resp.success) {
        setToastProps({
          content: "Retrying the Job",
          error: false,
        });
      } else {
        setToastProps({
          content: "Failed to retry the Job",
          error: true,
        });
      }
      getStatus();
      setRetrying(false);
    } catch (error) {
      console.log(error);
      setRetrying(false);
    }
  };

  const rowMarkup = jobs?.map(
    (
      { id, status, progress, failed, data, createdAt, estimatedTime },
      index
    ) => (
      <IndexTable.Row
        id={id}
        key={id}
        position={index}
        onClick={() => getSkuData(id, currentPage)}
      >
        <IndexTable.Cell>
          <InlineStack align="center">
            <Text variant="bodyMd" fontWeight="bold" as="span">
              #{id}
            </Text>
          </InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack align="center">{createdAt}</InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack align="center">{data}</InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack align="center">
            <Badge
              tone={
                status === "completed"
                  ? "success"
                  : status === "failed"
                  ? "critical"
                  : status === "waiting"
                  ? "attention"
                  : "info"
              }
            >
              {toCamelCase(status)}
            </Badge>
          </InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack align="center">
            <Text>{progress}%</Text>
            <ProgressBar
              animated
              progress={progress}
              size="small"
              tone={
                status === "completed"
                  ? "success"
                  : status === "failed"
                  ? "critical"
                  : status === "waiting"
                  ? "primary"
                  : "highlight"
              }
            />
          </InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack align="center">{estimatedTime}</InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack align="center" gap={"200"}>
            {status === "failed" && (
              <Button
                loading={retrying}
                disabled={retrying}
                onClick={(e) => {
                  e.stopPropagation();
                  retryJob(id);
                }}
                icon={RefreshIcon}
              />
            )}
            <Button
              loading={deleting}
              disabled={deleting}
              onClick={(e) => {
                e.stopPropagation();
                deleteJob(id);
              }}
              icon={DeleteIcon}
            />
          </InlineStack>
        </IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  const emptyStateMarkup =
    jobs.length === 0 ? (
      <EmptyState
        heading={t("ProgressOrHistory.table.empty.heading")}
        action={{
          content: t("ProgressOrHistory.table.empty.generate"),
          onAction: () => navigate("/"),
        }}
        secondaryAction={{
          content: t("ProgressOrHistory.table.empty.contact"),
          url: "https://appsfinal.freshdesk.com/support/tickets/new",
        }}
        image="https://cdn.shopify.com/s/files/1/2376/3301/products/emptystate-files.png"
      >
        <p>{t("ProgressOrHistory.table.empty.content")}</p>
      </EmptyState>
    ) : null;

  const toastMarkup = toastProps.content && (
    <Toast {...toastProps} onDismiss={() => setToastProps(emptyToastProps)} />
  );

  return (
    <Frame>
      {loading ? (
        <Page>
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
        </Page>
      ) : activePage ? (
        <OldAndNewSkus
          setActivePage={setActivePage}
          fetching={fetching}
          historyData={historyData}
          jobId={jobId}
          totalPages={totalPages}
          totalItems={totalItems}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          getSkuData={getSkuData}
        />
      ) : (
        <Page
          title={
            <Text fontWeight="bold" variant="headingLg">
              {t("ProgressOrHistory.heading")}
            </Text>
          }
          primaryAction={{
            content: (
              <div
                style={{ display: "flex", alignItems: "center", gap: "3px" }}
                onClick={() => getStatus()}
              >
                <Icon source={RefreshIcon} />
                {t("ProgressOrHistory.button")}
              </div>
            ),
          }}
          backAction={{
            content: "Back",
            onAction: () => navigate("/"),
          }}
          subtitle={t("ProgressOrHistory.subHeading")}
        >
          <p>{t("ProgressOrHistory.content")}</p>
          <br />
          <Banner
            title={t("ProgressOrHistory.limitedBackupBanner.heading")}
            tone="warning"
          >
            <p>{t("ProgressOrHistory.limitedBackupBanner.content")}</p>
          </Banner>

          <br />
          <Card padding={"0"}>
            <IndexTable
              emptyState={emptyStateMarkup}
              resourceName={resourceName}
              itemCount={jobs?.length}
              headings={[
                {
                  title: t("ProgressOrHistory.table.column1"),
                  alignment: "center",
                },
                {
                  title: t("ProgressOrHistory.table.column2"),
                  alignment: "center",
                },
                {
                  title: t("ProgressOrHistory.table.column3"),
                  alignment: "center",
                },
                {
                  title: t("ProgressOrHistory.table.column4"),
                  alignment: "center",
                },
                {
                  title: t("ProgressOrHistory.table.column5"),
                  alignment: "center",
                },
                {
                  title: t("ProgressOrHistory.table.column6"),
                  alignment: "center",
                },
                {
                  title: t("ProgressOrHistory.table.column7"),
                  alignment: "center",
                },
              ]}
              selectable={false}
            >
              {rowMarkup}
            </IndexTable>
          </Card>
          {/* {shop?.shop?.id !== 64038469846 && (
            <Button onClick={getOldSKUData}>
              Get products data having old SKUs
            </Button>
          )} */}
        </Page>
      )}
      {toastMarkup}
    </Frame>
  );
}

export default ProgressPage;

function toCamelCase(str) {
  if (str.length === 0) return str; // Return the string as is if it's empty
  return str.charAt(0).toUpperCase() + str.slice(1);
}
