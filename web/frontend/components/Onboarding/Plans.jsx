import { Card } from "@shopify/polaris";
import React from "react";
import MiniPlanCard from "./MiniPlanCard";

function Plans() {
  return (
    <Card>
      <div className="plan-page-wrapper">
        <MiniPlanCard
          primary
          ribbon={"LIMITED OFFER"}
          actionText={"Choose Plan"}
          setProPlan={null}
          setCurrentPlan={null}
          loading={false}
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
        </MiniPlanCard>
        <MiniPlanCard
          primary
          trial={true}
          ribbon={"POPULAR PLAN"}
          actionText={"Claim Your $1 Offer Now"}
          specifications={[
            "Everything in Basic Monthly +",
            "Automatically generates SKUs for new products you add.",
            "Automatically creates SKUs for unlimited products according to your preference.",
            "Customize your SKU preferences to suit your needs.",
          ]}
          name="PRO MONTHLY"
          currentPlan={null}
          setCurrentPlan={null}
          setProPlan={null}
          proPlan={null}
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
        </MiniPlanCard>

        <MiniPlanCard
          primary
          ribbon={"LIMITED OFFER"}
          actionText={"Choose Plan"}
          setProPlan={null}
          setCurrentPlan={null}
          loading={false}
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
        </MiniPlanCard>

        <MiniPlanCard
          primary
          ribbon={"LIMITED OFFER"}
          actionText={"Choose Plan"}
          setProPlan={null}
          setCurrentPlan={null}
          loading={false}
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
        </MiniPlanCard>
      </div>
    </Card>
  );
}

export default Plans;
