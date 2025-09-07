import {
  Card,
  FormLayout,
  Page,
  Select,
  Button,
  Text,
  Frame,
  Divider,
} from "@shopify/polaris";
import React, { useCallback, useState } from "react";
import { ReplayIcon, ExternalIcon } from "@shopify/polaris-icons";
import { useNavigate } from "react-router-dom";
import { Toast } from "@shopify/polaris";
import { useTranslation } from "react-i18next";

function Settings() {
  const [toastActive, setToastActive] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleOnboarding = () => {
    localStorage.removeItem("Final-SKU-onboardingToken");
    navigate("/");
  };

  const handleGuide = () => {
    window.open(
      "https://appsfinal.freshdesk.com/support/solutions/categories/82000473558/folders/82000696438"
    );
  };

  const toggleToastActive = useCallback(
    () => setToastActive((toastActive) => !toastActive),
    []
  );

  const toastMarkup = toastActive ? (
    <Toast
      duration={3000}
      content="Language Changed Successfully"
      onDismiss={toggleToastActive}
    />
  ) : null;

  return (
    <Frame>
      <Page title={t("Settings.heading")}>
        <Card padding={"0"}>
          <Divider />
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "15px",
            }}
          >
            <div style={{ width: "40%" }}>
              <p
                style={{
                  fontWeight: "600",
                  fontSize: "1rem",
                  marginBottom: "1em",
                }}
              >
                {t("Settings.row2.title")}
              </p>
              <Text variation="subdued">{t("Settings.row2.subTitle")}</Text>
            </div>
            <div style={{ width: "60%" }}>
              <FormLayout>
                <Button onClick={handleOnboarding} icon={ReplayIcon}>
                  {t("Settings.row2.label")}
                </Button>
                <Text variation="subdued">{t("Settings.row2.helpText")}</Text>
              </FormLayout>
            </div>
          </div>
          <Divider />
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "15px",
            }}
          >
            <div style={{ width: "40%" }}>
              <p
                style={{
                  fontWeight: "600",
                  fontSize: "1rem",
                  marginBottom: "1em",
                }}
              >
                {t("Settings.row3.title")}
              </p>
              <Text variation="subdued">{t("Settings.row3.subTitle")}</Text>
            </div>
            <div style={{ width: "60%" }}>
              <FormLayout>
                <Button onClick={handleGuide} icon={ExternalIcon}>
                  {t("Settings.row3.label")}
                </Button>
                <Text variation="subdued">{t("Settings.row3.helpText")}</Text>
              </FormLayout>
            </div>
          </div>
        </Card>
        {toastMarkup}
      </Page>
    </Frame>
  );
}

export default Settings;
