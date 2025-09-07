import React, { useState, useEffect, useCallback } from "react";
import {
  Banner,
  Button,
  ButtonGroup,
  Card,
  FormLayout,
  Page,
  Tabs,
  Frame,
} from "@shopify/polaris";
import { useAuthenticatedFetch } from "@shopify/app-bridge-react";
import startCountdown from "../helpers/count-down";
import useAuthContext from "../hooks/useShopContext";
import { Toast } from "@shopify/app-bridge-react";
import "./main.scss";
import NewPlanCard from "../components/upgrade/NewPlanCard";
import BlackFridayBanner from "../components/Banner/BlackFridayBanner";
import CreditsBanner from "../components/Banner/CreditsBanner";
import { useTranslation } from "react-i18next";

function PlansPricing() {
  const [shopId, setShopId] = useState("");
  const { t } = useTranslation();
  const { shop, currentPlan, proPlan } = useAuthContext();
  const [permanentDomain, setPermanentDomain] = useState("");
  const [callPlan, setCallPlan] = useState(false);
  const [proPlanq, setProPlan] = useState(false);
  const [currentPlanq, setCurrentPlan] = useState("");
  const [loading, setLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(true);
  const [planTab, setPlanTab] = useState(0);
  const [planData, setPlanData] = useState();
  const [hasReviewed, setHasReviewed] = useState(true);

  const fetchApi = useAuthenticatedFetch();

  useEffect(() => {
    startCountdown();
  }, []);

  const handleButtonClick = useCallback(
    (index) => {
      if (planTab === index) return;
      setPlanTab(index);
    },
    [planTab]
  );

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/canvas-confetti@1.4.0/dist/confetti.browser.min.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

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
      } catch (error) {
        console.log("Error getting shop details:", error);
      }
    };
    getShop();
  }, []);

  useEffect(() => {
    if (shopId) {
      setLoading(true);
      const upgradePlan = async () => {
        try {
          const res = await fetchApi(`/api/upgradeplan/${shopId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          });
          const resp = await res.json();
          setCurrentPlan(resp.chargeName);
          setPlanData(resp);
          setProPlan(resp.proPlan);
          setLoading(false);
          setHasReviewed(resp.hasReviewed);
        } catch (error) {
          console.log(error);
          setLoading(false);
        }
      };
      upgradePlan();
    }
  }, [shopId, callPlan]);

  const handleTabChange = useCallback(
    (selectedTabIndex) => setPlanTab(selectedTabIndex),
    []
  );

  const chatWithUs = () => {
    setTimeout(() => {
      $crisp.push(["do", "chat:open", ["Hi"]]);
      $crisp.push([
        "do",
        "message:send",
        ["text", "Hello, I would like to get free credits."],
      ]);
    }, 500);

    setTimeout(() => {
      $crisp.push([
        "do",
        "message:show",
        ["text", "Hi! We've added an extra 50 credits to your store!"],
      ]);
    }, 5000);
    setTimeout(() => {
      $crisp.push([
        "do",
        "message:show",
        [
          "text",
          "Could you do us a small favor and leave a review? It would mean a lot to us!",
        ],
      ]);
    }, 7000);
    setTimeout(async () => {
      $crisp.push([
        "do",
        "message:show",
        [
          "text",
          "Here's the link: https://apps.shopify.com/sku-code-generator#modal-show=WriteReviewModal",
        ],
      ]);
      await getFreeCredits();
    }, 11000);
    setTimeout(() => {
      $crisp.push(["do", "message:show", ["text", "Thanks so much! 🌟"]]);
    }, 13000);
  };

  const getFreeCredits = async () => {
    const res = await fetchApi(`/api/add-bonus/${shopId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const resp = await res.json();
    let hasTimeout = false;
    if (window && window.confetti) {
      hasTimeout = true;
      window.confetti({
        particleCount: 200,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f5f5f5", "#FF9933", "#138808"],
      });
    }
    setTimeout(
      () => {
        <Toast content="🎉 50 credits added 👍!" duration={2000} />;
      },
      hasTimeout ? 1500 : 0
    );
  };

  return (
    <Frame>
      <Page title={t("PlansAndPricing.heading")}>
        <>
          <Card>
            {/* <Card>
              <div className="black-friday-container">
                <h1 className="christmas-offer-title">
                  {" "}
                  Seasonal Spectacular Savings!{" "}
                </h1>
                <p className="christmas-offer-message">
                  Dive into Discounts - Limited Time Offer!
                </p>
                <div className="countdown-container">
                  <div className="countdown-item">
                    <span className="countdown-value" id="days">
                      00
                    </span>
                    <span className="countdown-label">Days</span>
                  </div>
                  <div className="countdown-item">
                    <span className="countdown-value" id="hours">
                      00
                    </span>
                    <span className="countdown-label">Hours</span>
                  </div>
                  <div className="countdown-item">
                    <span className="countdown-value" id="minutes">
                      00
                    </span>
                    <span className="countdown-label">Minutes</span>
                  </div>
                  <div className="countdown-item">
                    <span className="countdown-value" id="seconds">
                      00
                    </span>
                    <span className="countdown-label">Seconds</span>
                  </div>
                </div>
              </div>
            </Card>
            <br /> */}
            {!hasReviewed && (
              <>
                <div>
                  <Banner
                    title={`🎁 ${t(
                      "PlansAndPricing.getFreeCreditsBanner.heading"
                    )}`}
                    tone="info"
                    action={{
                      content: `💬 ${t(
                        "PlansAndPricing.getFreeCreditsBanner.button"
                      )}`,
                      onAction: () => chatWithUs(),
                    }}
                  >
                    <p>{t("PlansAndPricing.getFreeCreditsBanner.content")}</p>
                  </Banner>
                </div>
                <br />
              </>
            )}
            <BlackFridayBanner
              setProPlan={setProPlan}
              setCurrentPlan={setCurrentPlan}
            />
            <br />
            <Card>
              <FormLayout>
                {showBanner && (
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <Banner
                      hideIcon
                      title={`You are currently using the ${
                        currentPlan ? currentPlan : " ....."
                      }`}
                      status="info"
                      onDismiss={() => {
                        setShowBanner(false);
                      }}
                    />
                  </div>
                )}
                <Tabs
                  fitted
                  tabs={[
                    {
                      id: "plans",
                      content: t("PlansAndPricing.tabs.value1"),
                      panelID: "plans",
                    },
                    {
                      id: "credits",
                      content: t("PlansAndPricing.tabs.value2"),
                      panelID: "credits",
                    },
                  ]}
                  selected={planTab}
                  onSelect={handleTabChange}
                />
                {planTab == 0 ? (
                  <div className="plan-page-wrapper">
                    <NewPlanCard
                      actionText={
                        currentPlan == "Free Plan"
                          ? "Current Plan"
                          : "Choose Plan"
                      }
                      footerLine=""
                      downgrade={true}
                      currentPlan={currentPlan}
                      setCurrentPlan={setCurrentPlan}
                      loading={loading}
                      setProPlan={setProPlan}
                      // primary
                      specifications={[
                        "For Basic Shopify plan users and development stores",
                        "Easy & fast setup",
                        "Show SKU preview for all of your products",
                        "Target first 20 products for SKU generation",
                      ]}
                      name="FREE"
                      orgMoney="0.00"
                    >
                      <p
                        style={{
                          color: "GrayText",
                          marginTop: "8px",
                          fontSize: "14px",
                        }}
                      >
                        Free Forever
                      </p>
                    </NewPlanCard>
                    <NewPlanCard
                      // primary
                      // ribbon={"POPULAR PLAN"}
                      actionText={
                        currentPlan === "Basic Monthly"
                          ? "Current Plan"
                          : "Choose Plan"
                      }
                      setProPlan={setProPlan}
                      setCurrentPlan={setCurrentPlan}
                      loading={loading}
                      specifications={[
                        "Everything in Free Plan +",
                        "Priority Support",
                        "All delimiters options",
                        "All SKU layouts can be used",
                        "All abbreviation like product vendor and type can used",
                        "Unlimited product SKUs generation",
                      ]}
                      name="BASIC MONTHLY"
                      orgMoney="19.00"
                    >
                      <p
                        style={{
                          color: "GrayText",
                          marginTop: "8px",
                          fontSize: "14px",
                        }}
                      >
                        Billed at $19.00 Monthly
                      </p>
                    </NewPlanCard>
                    <NewPlanCard
                      // primary
                      // ribbon={"LIMITED OFFER"}
                      actionText={
                        currentPlan === "Lifetime Subscription"
                          ? "Current Plan"
                          : currentPlan === "Lifetime Plan"
                          ? "Current Plan"
                          : currentPlan === "Basic Yearly"
                          ? "Current Plan"
                          : "Choose Plan"
                      }
                      setProPlan={setProPlan}
                      setCurrentPlan={setCurrentPlan}
                      loading={loading}
                      specifications={[
                        "Everything in Free Plan +",
                        "Priority Support",
                        "All delimiters options",
                        "All SKU layouts can be used",
                        "All abbreviation like product vendor and type can used",
                        "Unlimited product SKUs generation",
                      ]}
                      name="BASIC YEARLY"
                      orgMoney="149.00"
                    >
                      <p
                        style={{
                          color: "GrayText",
                          marginTop: "8px",
                          fontSize: "14px",
                        }}
                      >
                        Billed at $149.00 Yearly
                      </p>
                    </NewPlanCard>
                    <NewPlanCard
                      primary
                      loading={loading}
                      trial={true}
                      ribbon={"POPULAR PLAN"}
                      actionText={
                        proPlan ? "Current Plan" : "Claim Your $1 Offer Now"
                      }
                      specifications={[
                        "Everything in Basic Monthly +",
                        "Automatically generates SKUs for new products you add.",
                        "Automatically creates SKUs for unlimited products according to your preference.",
                        "Customize your SKU preferences to suit your needs.",
                        "Set multiple SKU preferences as needed.",
                        "Perfect for stores that frequently expand their inventory.",
                        "Enjoy a user-friendly and intuitive UI.",
                      ]}
                      name="PRO MONTHLY"
                      currentPlan={currentPlan}
                      setCurrentPlan={setCurrentPlan}
                      setProPlan={setProPlan}
                      proPlan={proPlan}
                      orgMoney="39.00"
                      label="SPECIAL OFFER"
                      blackFridayOff
                    >
                      <p
                        style={{
                          color: "GrayText",
                          marginTop: "8px",
                          fontSize: "14px",
                        }}
                      >
                        Billed at $39.00 Monthly
                      </p>
                    </NewPlanCard>
                  </div>
                ) : planTab == 1 ? (
                  <div>
                    {/* <Banner
                      title="Write a Review and Earn Free Credits Now!"
                      tone="info"
                      action={{
                        content: "Write Review",
                        onAction: handleWriteReview,
                      }}
                    >
                      <InlineStack vertical>
                        <p>
                          We value your feedback! Write a review and get free
                          credits added to your account.
                        </p>
                      </InlineStack>
                    </Banner> */}
                    <div style={{ width: "60%", margin: "auto" }}></div>
                    <CreditsBanner
                      remainingCredits={planData?.creditsRemaining}
                      usedCredits={planData?.createdSkus}
                      lowCreditThreshold={30}
                      currentPlan={currentPlan}
                    />
                    <div
                      style={{
                        width: "50%",
                        margin: "auto",
                        marginTop: "20px",
                      }}
                    >
                      <NewPlanCard
                        primary
                        ribbon={"LIMITED OFFER"}
                        actionText={
                          currentPlan === "Pay as You Go"
                            ? "Buy More Credits"
                            : "Buy Credits"
                        }
                        setProPlan={setProPlan}
                        setCurrentPlan={setCurrentPlan}
                        loading={loading}
                        specifications={[
                          "100 product SKUs generation",
                          "Everything in Free Plan +",
                          "Priority Support",
                          "All delimiters options",
                          "All SKU layouts can be used",
                          "All abbreviation like product vendor and type can used",
                        ]}
                        name="PAY AS YOU GO"
                        orgMoney="5.00"
                      >
                        <p
                          style={{
                            color: "GrayText",
                            marginTop: "8px",
                            fontSize: "14px",
                          }}
                        >
                          No monthly commitments, pay only for what you use.
                        </p>
                      </NewPlanCard>
                    </div>
                  </div>
                ) : (
                  <></>
                )}
              </FormLayout>
            </Card>
          </Card>
        </>
      </Page>
    </Frame>
  );
}

export default PlansPricing;
