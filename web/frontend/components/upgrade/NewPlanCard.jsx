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
import { useAppBridge, useNavigate } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";
import { useAuthenticatedFetch } from "../../hooks/useAuthenticatedFetch";
import useAuthContext from "../../hooks/useShopContext";

function NewPlanCard({
  children,
  blackFridayOff = false,
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
  const navigate = useNavigate();
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
        navigate("/");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleChoosePlan = (endpoint) => {
    handleApiCall(endpoint);
  };
  return (
    <div className="plan-page-card">
      <InlineStack align="space-between">
        <div>
          <p style={{ fontSize: "24px", fontWeight: "800" }}>{name}</p>
        </div>
        {label && (
          <div>
            <Badge>
              <p style={{ fontWeight: "600", color: "black" }}>{label}</p>
            </Badge>
          </div>
        )}
      </InlineStack>
      {blackFridayOff ? (
        <div style={{ marginTop: "20px" }}>
          <p
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "27px", fontWeight: "900" }}>$1</span>
            <span
              style={{ marginLeft: "5px", fontSize: "17px", color: "GrayText" }}
            >
              / first month
            </span>
          </p>
          <p style={{ color: "GrayText", marginTop: "8px", fontSize: "14px" }}>
            Then ${orgMoney}/month
          </p>
        </div>
      ) : (
        <div style={{ marginTop: "20px" }}>
          <p
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "27px", fontWeight: "900" }}>
              ${orgMoney}
            </span>
            {/* <span
              style={{
                marginLeft: "5px",
                fontSize: "17px",
                color: "GrayText",
              }}
            >
              / month
            </span> */}
          </p>
          {children}
        </div>
      )}

      {trial ? (
        <div style={{ margin: "10px" }}>
          <Badge
            status="success"
            progress="complete"
            statusAndProgressLabelOverride="Status: Published. Your online store is visible."
          >
            3 Days Free Trial Available
          </Badge>
        </div>
      ) : null}
      <SpecList specifications={specifications} />
      <div
        style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}
      >
        {name == "PRO MONTHLY" ? (
          <div style={{ width: "80%" }}>
            <Button
              variant="primary"
              fullWidth
              disabled={proPlan}
              onClick={handleChange}
              loading={loading}
            >
              {actionText}
            </Button>
          </div>
        ) : downgrade ? (
          <div style={{ width: "80%" }}>
            <Button
              variant="primary"
              fullWidth
              disabled={currentPlan === "Free Plan"}
              onClick={handleChange}
              loading={loading}
            >
              {actionText}
            </Button>
          </div>
        ) : (
          <div style={{ width: "80%" }}>
            <Button
              variant="primary"
              fullWidth
              disabled={actionText == "Current Plan" || name == "FREE"}
              onClick={handleChange}
              loading={loading}
            >
              {actionText}
            </Button>
          </div>
        )}
      </div>

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

export default NewPlanCard;
