import {
  Badge,
  Banner,
  Card,
  EmptyState,
  Frame,
  IndexTable,
  InlineStack,
  Link,
  Page,
  ProgressBar,
  Spinner,
  Text,
} from "@shopify/polaris";
import React, { useEffect, useState } from "react";
import useAuthContext from "../hooks/useShopContext";
import { useNavigate } from "react-router-dom";
import TryOut from "../components/TryOut/TryOut";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import BannerOffer from "../components/Banner/Banner";
import startCountdown from "../helpers/count-down";
import ReviewModal from "../components/Modal/ReviewModal";
import BlackFridayBanner from "../components/Banner/BlackFridayBanner";
import { useTranslation } from "react-i18next";

export default function HomePage() {
  const fetchApi = useAuthenticatedFetch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(
    localStorage.getItem("hideBanner") !== "true"
  );
  const [showTryOut, setShowTryOut] = useState(true);
  const { shop, currentPlan, proPlan, loading } = useAuthContext();
  const [createdInThisMonth, setCreatedInThisMonth] = useState(0);
  const [addedInThisMonth, setAddedInThisMonth] = useState(0);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [permanentDomain, setPermanentDomain] = useState("");
  const [shopId, setShopId] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const getShop = async () => {
      try {
        const res = await fetchApi("/api/getdetails", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        const resp = await res.json();
        setPermanentDomain(resp.response.body.shop.myshopify_domain);
        setShopId(resp.response.body.shop.id);
        window.$crisp.push(["set", "session:data", ["AppName", "FinalSKU"]]);
        window.$crisp.push([
          "set",
          "user:nickname",
          [resp.response.body.shop.shop_owner],
        ]);
        window.$crisp.push([
          "set",
          "user:email",
          [resp.response.body.shop.email],
        ]);
        window.$crisp.push([
          "set",
          "session:data",
          ["Store", resp.response.body.shop.myshopify_domain],
        ]);
        window.$crisp.push(["set", "session:data", ["Plan", currentPlan]]);
        window.$crisp.push([
          "set",
          "session:data",
          ["Plan", resp.response.body.shop.plan_display_name],
        ]);
        window.$crisp.push([
          "set",
          "session:data",
          ["StoreCreatedAt", resp.response.body.shop.created_at],
        ]);
        window.$crisp.push([
          "set",
          "session:data",
          ["PlanName", resp.response.body.shop.plan_name],
        ]);
        window.$crisp.push([
          "set",
          "session:data",
          [
            "Review link",
            "https://apps.shopify.com/sku-code-generator#modal-show=WriteReviewModal",
          ],
        ]);
        window.$crisp.push([
          "set",
          "session:data",
          ["primaryLocale", resp.response.body.shop.primary_locale],
        ]);
      } catch (error) {
        console.log("Error getting shop details:", error);
      }
    };
    getShop();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("Final-SKU-onboardingToken");
    if (!token) {
      navigate("/generate-sku");
    }
  }, []);

  useEffect(() => {
    startCountdown();
  }, []);

  const getStatus = async () => {
    try {
      const res = await fetchApi(`/api/sku/jobs/${shop.shop.id}?limit=${3}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const resp = await res.json();
      setLoadingJobs(false);
      setJobs(resp.jobs ? resp.jobs : []);
    } catch (error) {
      console.log(error);
      setLoadingJobs(false);
    }
  };

  const getInitialData = async () => {
    try {
      const res = await fetchApi(`/api/credits-data/${shop.shop.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const resp = await res.json();
      setCreatedInThisMonth(resp.createdInThisMonth);
      setAddedInThisMonth(resp.addedInThisMonth);
      setCreditsRemaining(resp.creditsRemaining);
    } catch (error) {
      console.log(error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (shop) {
      getStatus();
      getInitialData();
    }
  }, [shop]);

  const hideBanner = () => {
    setShowBanner(false);
    localStorage.setItem("hideBanner", "true");
  };

  const emptyStateMarkup =
    jobs.length === 0 ? (
      <EmptyState
        heading={t("Dashboard.historyOrProgressCard.table.emptyData.heading")}
        action={{
          content: t(
            "Dashboard.historyOrProgressCard.table.emptyData.generate"
          ),
          onAction: () => navigate("/generate-sku"),
        }}
        secondaryAction={{
          content: t("Dashboard.historyOrProgressCard.table.emptyData.contact"),
          url: "https://appsfinal.freshdesk.com/support/tickets/new",
        }}
        image="https://cdn.shopify.com/s/files/1/2376/3301/products/emptystate-files.png"
      >
        <p>{t("Dashboard.historyOrProgressCard.table.emptyData.content")}</p>
      </EmptyState>
    ) : null;

  const resourceName = {
    singular: "job",
    plural: "jobs",
  };

  const rowMarkup = jobs.map(
    (
      { id, status, progress, failed, data, createdAt, estimatedTime },
      index
    ) => (
      <IndexTable.Row id={id} key={id} position={index}>
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
      </IndexTable.Row>
    )
  );

  return (
    <Frame>
      <Page title={t("Dashboard.heading")}>
        {showBanner && (
          <Banner
            title={t("Dashboard.askReviewBanner.heading")}
            onDismiss={hideBanner}
            action={{
              content: t("Dashboard.askReviewBanner.content.button"),
              onAction: () =>
                // window.open(
                //   "https://apps.shopify.com/sku-code-generator#modal-show=WriteReviewModal",
                //   "_blank"
                // ),
                setActive(true),
            }}
          >
            <Text fontWeight="semibold">
              {t("Dashboard.askReviewBanner.content.line1")}
            </Text>
            <p style={{ fontWeight: "500", marginTop: "5px" }}>
              {t("Dashboard.askReviewBanner.content.line2")}
            </p>
            <p style={{ fontWeight: "500", marginTop: "5px" }}>
              ✨ {t("Dashboard.askReviewBanner.content.line3")}
            </p>
          </Banner>
        )}
        <br />
        {/* <InlineStack>
          <BannerOffer
            banner={null}
            setBanner={null}
            currentPlan={currentPlan}
          />
        </InlineStack> */}
        <BlackFridayBanner />
        <br />
        <InlineStack align="space-between">
          <Card>
            <div style={{ width: "200px" }}>
              <Text variant="bodyMd" tone="subdued">
                {t("Dashboard.infoCards.card1.label")}
              </Text>
              <InlineStack align="start" blockAlign="baseline" gap={"100"}>
                <div style={{ height: "30px" }} />
                {initialLoading || currentPlan === "" ? (
                  <Spinner size="small" />
                ) : (
                  <Text variant="headingXl">{createdInThisMonth}</Text>
                )}
                <Text variant="bodyMd" tone="subdued">
                  {t("Dashboard.infoCards.card1.value")}
                </Text>
              </InlineStack>
            </div>
          </Card>
          <Card>
            <div style={{ width: "200px" }}>
              <Text variant="bodyMd" tone="subdued">
                {t("Dashboard.infoCards.card2.label")}
              </Text>
              <InlineStack align="start" blockAlign="baseline" gap={"100"}>
                <div style={{ height: "30px" }} />
                {initialLoading || currentPlan === "" ? (
                  <Spinner size="small" />
                ) : (
                  <Text variant="headingXl">{addedInThisMonth}</Text>
                )}
                <Text variant="bodyMd" tone="subdued">
                  {t("Dashboard.infoCards.card2.value")}
                </Text>
              </InlineStack>
            </div>
          </Card>
          <Card>
            <div style={{ width: "200px" }}>
              <InlineStack>
                <Text variant="bodyMd" tone="subdued">
                  {t("Dashboard.infoCards.card3.label")}
                </Text>
                <Link onClick={() => navigate("/PlansPricing")}>
                  {currentPlan === "Pay as You Go"
                    ? "Get More?"
                    : "Change Plan?"}
                </Link>
              </InlineStack>
              <InlineStack align="start" blockAlign="baseline" gap={"100"}>
                <div style={{ height: "30px" }} />
                {initialLoading || currentPlan === "" ? (
                  <Spinner size="small" />
                ) : currentPlan === "Pay as You Go" ? (
                  <Text variant="headingXl">{creditsRemaining}</Text>
                ) : currentPlan === "Free Plan" ? (
                  <Text variant="headingMd">On Free Plan</Text>
                ) : (
                  <Text variant="headingMd">
                    {t("Dashboard.infoCards.card3.value")}
                  </Text>
                )}
                {currentPlan !== "Free Plan" && (
                  <Text variant="bodyMd" tone="subdued">
                    {t("Dashboard.infoCards.card1.value")}
                  </Text>
                )}
              </InlineStack>
            </div>
          </Card>
          <Card>
            <div style={{ width: "200px" }}>
              <Text variant="bodyMd" tone="subdued">
                {t("Dashboard.infoCards.card4.label")}
              </Text>
              <div style={{ height: "10px" }} />
              {loading ? (
                <Spinner size="small" />
              ) : (
                <Text variant="headingMd">{currentPlan}</Text>
              )}
            </div>
          </Card>
        </InlineStack>
        <br />
        <InlineStack align="space-between">
          <Text fontWeight="bold" variant="bodyLg">
            {t("Dashboard.historyOrProgressCard.heading")}
          </Text>
          <Link
            onClick={() => {
              navigate("/progress-page");
            }}
          >
            {t("Dashboard.historyOrProgressCard.link")}
          </Link>
        </InlineStack>
        <br />
        {loadingJobs ? (
          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "20vh",
              }}
            >
              <Spinner size="large" />
            </div>
          </Card>
        ) : (
          <Card padding={"0"}>
            <IndexTable
              emptyState={emptyStateMarkup}
              resourceName={resourceName}
              itemCount={jobs?.length}
              headings={[
                {
                  title: t("Dashboard.historyOrProgressCard.table.column1"),
                  alignment: "center",
                },
                {
                  title: t("Dashboard.historyOrProgressCard.table.column2"),
                  alignment: "center",
                },
                {
                  title: t("Dashboard.historyOrProgressCard.table.column3"),
                  alignment: "center",
                },
                {
                  title: t("Dashboard.historyOrProgressCard.table.column4"),
                  alignment: "center",
                },
                {
                  title: t("Dashboard.historyOrProgressCard.table.column5"),
                  alignment: "center",
                },
                {
                  title: t("Dashboard.historyOrProgressCard.table.column6"),
                  alignment: "center",
                },
              ]}
              selectable={false}
            >
              {rowMarkup}
            </IndexTable>
          </Card>
        )}
        <br />
        {showTryOut ? <TryOut setShowTryOut={setShowTryOut} /> : ""}
      </Page>
      <ReviewModal active={active} setActive={setActive} />
    </Frame>
  );
}

function toCamelCase(str) {
  if (str.length === 0) return str; // Return the string as is if it's empty
  return str.charAt(0).toUpperCase() + str.slice(1);
}
