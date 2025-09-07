import React from "react";
import { Button, Card, Grid, InlineStack } from "@shopify/polaris";
import { useTranslation } from "react-i18next";
import "./TryOut.css";
import BarcodeIcon from "../../assets/Barcode-Icon.png";
import InvoiceIcon from "../../assets/Invoice-Icon.png";
import VatIcon from "../../assets/Vat-Icon.png";
import MBCIcon from "../../assets/MBC-Icon.jpg";
import { ArrowDownIcon } from "@shopify/polaris-icons";
import useAuthContext from "../../hooks/useShopContext";

function TryOut({ setShowTryOut }) {
  const { t } = useTranslation();
  const { shop } = useAuthContext();

  const apps = [
    {
      id: 1,
      name: "PDF Invoice ‑ Order Printer",
      icon: InvoiceIcon,
      category: t("Dashboard.recommendedApps.app1.category"),
      description: t("Dashboard.recommendedApps.app1.content"),
      rating: 4.8,
      downloads: "1M+",
      bfs: true,
      url: `https://admin.shopify.com/store/${shop?.shop?.name}/apps/final-invoice-pro`,
    },
    {
      id: 2,
      name: "F: Retail Barcode Generator",
      icon: BarcodeIcon,
      category: t("Dashboard.recommendedApps.app2.category"),
      description: t("Dashboard.recommendedApps.app2.content"),
      rating: 4.1,
      downloads: "5M+",
      bfs: true,
      url: `https://admin.shopify.com/store/${shop?.shop?.name}/apps/sku-barcode-labels-generator`,
    },
    {
      id: 3,
      name: "F: B2B VAT: Display Dual Price",
      icon: VatIcon,
      category: t("Dashboard.recommendedApps.app3.category"),
      description: t("Dashboard.recommendedApps.app3.content"),
      rating: 4.6,
      downloads: "10M+",
      bfs: true,
      url: `https://admin.shopify.com/store/${shop?.shop?.name}/apps/final-price`,
    },
    {
      id: 4,
      name: "MBC Bundle App ◕‿◕ Buy X Get Y",
      icon: MBCIcon,
      category: t("Dashboard.recommendedApps.app4.category"),
      description: t("Dashboard.recommendedApps.app4.content"),
      rating: 4.8,
      downloads: "3M+",
      bfs: true,
      url: "https://apps.shopify.com/bundle-products-mbc?utm_source=SKUGenerator_Final_partner&utm_medium=referral&utm_campaign=in_app_link",
    },
  ];

  return (
    <div style={{ marginBottom: "15px" }}>
      <p style={{ fontWeight: "700", fontSize: "19px" }}>
        {t("Dashboard.recommendedApps.heading")}
      </p>
      <p
        style={{
          fontSize: "12px",
          color: "grey",
          fontWeight: "500",
          marginBottom: "15px",
        }}
      >
        {t("Dashboard.recommendedApps.subHeading")}
      </p>
      <Grid>
        {apps.map((app) => (
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
            <Card>
              <InlineStack gap={"300"} blockAlign="center">
                <img
                  src={app.icon}
                  alt={`${app.name} icon`}
                  style={{ width: "50px", height: "50px", borderRadius: "7px" }}
                />
                <div>
                  <p style={{ fontSize: "15px", fontWeight: "700" }}>
                    {app.name}
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: "500",
                      color: "grey",
                    }}
                    className="text-sm text-muted-foreground"
                  >
                    {app.category}
                  </p>
                </div>
              </InlineStack>
              <p
                style={{
                  marginTop: "13px",
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "grey",
                }}
              >
                {app.description}
              </p>
              <div style={{ marginTop: "8px" }} />
              <InlineStack gap="200">
                <div style={{ display: "flex" }}>
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>
                      {i < Math.floor(app.rating) ? "⭐" : "☆"}
                    </span>
                  ))}
                </div>
                <span style={{ color: "grey" }}>{app.rating.toFixed(1)}</span>
              </InlineStack>
              <div style={{ marginTop: "8px" }} />
              <InlineStack align="space-between" blockAlign="center">
                {app.bfs && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "2px 7px",
                      borderRadius: "4px",
                      backgroundColor: "#E0EFFE",
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                      fontFamily: "Arial, sans-serif",
                    }}
                  >
                    <span
                      role="img"
                      aria-label="diamond"
                      style={{ fontSize: "10px" }}
                    >
                      💎
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#1F2937",
                      }}
                    >
                      Built for Shopify
                    </span>
                  </div>
                )}
                <Button
                  onClick={() => window.open(app.url)}
                  variant="primary"
                  icon={ArrowDownIcon}
                >
                  {t("Dashboard.recommendedApps.button")}
                </Button>
              </InlineStack>
            </Card>
          </Grid.Cell>
        ))}
      </Grid>
    </div>
  );
}

export default TryOut;
