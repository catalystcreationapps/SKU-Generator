import { Banner, BlockStack, InlineStack, ProgressBar } from "@shopify/polaris";
import React from "react";
import { CreditCardIcon } from "@shopify/polaris-icons";
import { useTranslation } from "react-i18next";

function CreditsBanner({
  remainingCredits = 0,
  usedCredits = 0,
  lowCreditThreshold = 30,
  currentPlan,
}) {
  const { t } = useTranslation();
  const totalCredits = usedCredits + remainingCredits;
  const usagePercentage =
    totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0;
  const isLowCredit = remainingCredits <= lowCreditThreshold;

  return (
    <div
      style={{
        width: "50%",
        margin: "auto",
        border: "1px solid #E1E5EB",
        borderRadius: "10px",
        padding: "10px 15px",
      }}
    >
      <InlineStack blockAlign="center">
        <div
          style={{
            width: "30px",
            height: "30px",
            marginRight: "8px",
          }}
        >
          <CreditCardIcon />
        </div>
        <p
          style={{
            fontWeight: "800",
            fontSize: "17px",
          }}
        >
          Pay-As-You-Go Credits
        </p>
      </InlineStack>
      <div style={{ marginTop: "10px" }} />
      {currentPlan === "Pay as You Go" && isLowCredit && (
        <>
          <Banner
            title={t("PlansAndPricing.lowCreditBanner.heading")}
            tone="warning"
          >
            <p style={{ fontSize: "14px" }}>
              {t("PlansAndPricing.lowCreditBanner.content")}
            </p>
          </Banner>
          <div style={{ marginTop: "10px" }} />
        </>
      )}

      <BlockStack gap={"100"}>
        <InlineStack align="space-between">
          <p style={{ fontWeight: "600" }}>
            {t("PlansAndPricing.RemainingCreditsBanner.usedCredits")}
          </p>
          <p style={{ fontWeight: "600" }}>{usedCredits}</p>
        </InlineStack>
        <ProgressBar
          animated
          size="small"
          tone="primary"
          progress={usagePercentage}
        />
        <InlineStack align="space-between">
          <p style={{ fontWeight: "600" }}>
            {t("PlansAndPricing.RemainingCreditsBanner.remainingCredits")}
          </p>
          <p style={{ fontWeight: "600" }}>{remainingCredits}</p>
        </InlineStack>
        <div
          style={{
            color: "GrayText",
            fontSize: "13px",
            textAlign: "end",
          }}
        >
          {t("PlansAndPricing.RemainingCreditsBanner.totalCredits")}:{" "}
          {totalCredits}
        </div>
      </BlockStack>
    </div>
  );
}

export default CreditsBanner;
