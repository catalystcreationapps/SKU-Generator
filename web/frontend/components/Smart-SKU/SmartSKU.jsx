import {
  Card,
  InlineStack,
  Icon,
  Text,
  Divider,
  Badge,
  BlockStack,
} from "@shopify/polaris";
import React, { useEffect, useState } from "react";
import Switch from "react-switch";
import { useAuthenticatedFetch } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import "./SmartSKU.css";
import { AutomationIcon } from "@shopify/polaris-icons";

function SmartSKU({
  currentPlan,
  proPlan,
  setProPlan,
  setUpgradeModal,
  currentPlanLoading,
  chargeId,
  toggleActiveForActivating,
  toggleActiveForDeactivating,
  shopId,
}) {
  const { t } = useTranslation();
  const fetch = useAuthenticatedFetch();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkWebhookStatus = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/webhook/status/${shopId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        const resp = await res.json();
        if (isMounted) {
          if (resp.status === true) {
            setChecked(resp.status);
          }
          setLoading(false);
        }
      } catch (err) {
        console.log(err);
        setLoading(false);
      }
    };
    checkWebhookStatus();
    return () => {
      isMounted = false;
    };
  }, [shopId]);

  const handleChange = async () => {
    if (!proPlan) {
      setUpgradeModal((upgradeModal) => !upgradeModal);
    } else {
      try {
        setLoading(true);
        const res = await fetch(`/api/webhook/start/${shopId}/${checked}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        const resp = await res.json();
        if (resp.msg === "success") {
          if (checked === false) {
            toggleActiveForActivating();
          } else {
            toggleActiveForDeactivating();
          }
          setChecked((checked) => !checked);
        }
        setLoading(false);
      } catch (error) {
        console.log("Error getting shop details:", error);
      }
    }
  };

  return (
    <Card padding={"500"}>
      <InlineStack align="space-between">
        <BlockStack gap={"100"}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div style={{ width: "30px", height: "30px" }}>
              <AutomationIcon />
            </div>
            <p style={{ fontSize: "22px", fontWeight: "600" }}>
              {t("AutomatedSku.automatedSKU.heading")}
            </p>
          </div>
          <p style={{ fontSize: "14px", color: "grey", fontWeight: "500" }}>
            {t("AutomatedSku.automatedSKU.subHeading")}
          </p>
        </BlockStack>
        <Switch
          disabled={loading}
          onChange={handleChange}
          checked={checked}
          className="react-switch"
        />
      </InlineStack>
      <p
        style={{
          fontSize: "14px",
          color: "grey",
          fontWeight: "500",
          marginTop: "15px",
        }}
      >
        {t("AutomatedSku.automatedSKU.content")}
      </p>

      <p
        style={{
          fontSize: "14px",
          color: "grey",
          fontWeight: "500",
          marginTop: "15px",
          marginBottom: "15px",
        }}
      >
        {t("AutomatedSku.automatedSKU.label")}
      </p>
      <ol style={{ fontSize: "14px", color: "grey", fontWeight: "500" }}>
        <li>{t("AutomatedSku.automatedSKU.list.first")}</li>
        <li>{t("AutomatedSku.automatedSKU.list.second")}</li>
        <li>{t("AutomatedSku.automatedSKU.list.third")}</li>
      </ol>
    </Card>
  );
}

export default SmartSKU;
