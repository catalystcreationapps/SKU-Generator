import "./PlanPage.scss";
import React, { useState, useCallback, useEffect } from "react";
import {
  Modal,
  Tooltip,
  Badge,
  InlineStack,
  BlockStack,
} from "@shopify/polaris";
import { Button } from "@shopify/polaris";
import SpecList from "./SpecList";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";
import { useAuthenticatedFetch } from "../../hooks/useAuthenticatedFetch";
import useAuthContext from "../../hooks/useShopContext";

export default function PlanCard({
  children,
  orgMoney = null,
  name,
  primary = false,
  ribbon = null,
  label = null,
  actionText = "Choose Plan",
  footerLine = null,
  specifications = [],
  currentPlan = null,
  proPlan = null,
  loading = null,
  trial = false,
  chargeId,
  downgrade = false,
  setProPlan,
  setCurrentPlan,
}) {
  const { shop } = useAuthContext();
  const app = useAppBridge();
  const redirect = Redirect.create(app);
  const [active, setActive] = useState(false);
  const fetchApi = useAuthenticatedFetch();
  const handleChange = useCallback(() => setActive(!active), [active]);

  const handleApiCall = async (endpoint) => {
    try {
      handleChange();
      const response = await fetchApi(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const data = await response.json();
      if (data.confirmation_url) {
        redirect.dispatch(Redirect.Action.REMOTE, data.confirmation_url);
      } else if (data.planName === "Free") {
        setProPlan(false);
        setCurrentPlan("Free Plan");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleChoosePlan = (endpoint) => {
    handleApiCall(endpoint);
  };

  return (
    <div className={`plan-page-card ${primary ? "plan-page-cardPrimary" : ""}`}>
      {trial && (
        <div className="trial-banner">
          <Badge tone="info">3 DAYS FREE TRIAL</Badge>
        </div>
      )}
      {name === "PAY AS YOU GO" && (
        <div className="trial-banner">
          <Badge tone="info">Up to 100 SKUs</Badge>
        </div>
      )}
      {ribbon && <span className="plan-page-cardRibbon">{ribbon}</span>}
      {label && <span className="plan-page-cardLabel">{label}</span>}
      <p className="plan-name">{name}</p>
      {orgMoney && <p className="plan-org-money">${orgMoney}</p>}
      <p className="my-12">{children}</p>
      <BlockStack>
        {trial ? (
          <div style={{ marginBottom: "10px" }}>
            <Badge
              status="success"
              progress="complete"
              statusAndProgressLabelOverride="Status: Published. Your online store is visible."
            >
              3 Days Free Trial Available
            </Badge>
          </div>
        ) : null}
        {name == "PRO MONTHLY" ? (
          <div>
            <Button
              disabled={proPlan}
              primary={primary}
              onClick={handleChange}
              loading={loading}
            >
              {actionText}
            </Button>
          </div>
        ) : downgrade ? (
          <div>
            <Button
              disabled={currentPlan === "Free Plan"}
              primary={primary}
              onClick={handleChange}
              loading={loading}
            >
              {actionText}
            </Button>
          </div>
        ) : (
          <div>
            <Button
              // disabled={actionText == "Current Plan" || name == "FREE"}
              primary={primary}
              onClick={handleChange}
              loading={loading}
            >
              {actionText}
            </Button>
          </div>
        )}
      </BlockStack>
      {footerLine && <p className="plan-page-footerLine">{footerLine}</p>}

      <SpecList specifications={specifications} />
      <Modal
        open={active}
        onClose={handleChange}
        title="Do you want to change the current plan?"
        primaryAction={{
          content: "Continue",
          onAction: () =>
            handleChoosePlan(
              `/api/handle${name.toLowerCase().replace(/\s/g, "")}`
            ),
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleChange,
          },
        ]}
      ></Modal>
    </div>
  );
}
