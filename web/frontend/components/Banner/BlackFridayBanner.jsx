import React, { useState, useCallback, useEffect } from "react";
import { StarIcon } from "@shopify/polaris-icons";
import { Card, Icon, InlineStack, Modal } from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";
import { useAuthenticatedFetch } from "../../hooks/useAuthenticatedFetch";
import { useTranslation } from "react-i18next";

function BlackFridayBanner({ setProPlan, setCurrentPlan }) {
  const app = useAppBridge();
  const { t } = useTranslation();
  const redirect = Redirect.create(app);
  const [active, setActive] = useState(false);
  const fetchApi = useAuthenticatedFetch();
  const handleChange = useCallback(() => setActive(!active), [active]);
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  function calculateTimeLeft() {
    // Get the current date and time
    const now = new Date();

    // Set the end of the day today (23:59:59)
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );

    const difference = endOfDay - now;
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  }

  const timerComponents = Object.keys(timeLeft).map((interval) => {
    if (!timeLeft[interval]) {
      return null;
    }

    return (
      <span
        key={interval}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          margin: "0 0.5rem",
        }}
      >
        <span style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
          {timeLeft[interval]}
        </span>
        <span style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
          {interval}
        </span>
      </span>
    );
  });

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

  return (
    <>
      <Card>
        <InlineStack>
          <div>
            <Icon source={StarIcon} />
          </div>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              color: "black",
              marginBottom: "0.5rem",
              marginLeft: "0.5rem",
            }}
          >
            {t("Dashboard.blackFridayBanner.heading")}
          </h2>
        </InlineStack>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <p
            style={{
              fontSize: "0.900rem",
              color: "#374151",
            }}
          >
            {t("Dashboard.blackFridayBanner.subHeading")}
          </p>
          <ul
            style={{
              listStyleType: "disc",
              listStylePosition: "inside",
              fontSize: "0.875rem",
              color: "#4b5563",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}
          >
            <li>{t("Dashboard.blackFridayBanner.list.first")}</li>
            <li>{t("Dashboard.blackFridayBanner.list.second")}</li>
            <li>{t("Dashboard.blackFridayBanner.list.third")}</li>
            <li>{t("Dashboard.blackFridayBanner.list.fourth")}</li>
          </ul>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "black",
              color: "white",
              padding: "0.5rem",
              borderRadius: "0.375rem",
            }}
          >
            <p style={{ marginRight: "1rem", fontSize: "0.975rem" }}>
              {t("Dashboard.blackFridayBanner.offerTimer.label")}:
            </p>
            <div style={{ display: "flex" }}>
              {timerComponents.length ? (
                timerComponents
              ) : (
                <span>
                  {t("Dashboard.blackFridayBanner.offerTimer.offerEnds")}
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "12px",
            }}
          >
            <p
              style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#1f2937",
              }}
            >
              {t("Dashboard.blackFridayBanner.offerTimer.content")}
            </p>
            <button
              style={{
                backgroundColor: "black",
                color: "white",
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onClick={handleChange}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#1f2937")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "black")
              }
            >
              {t("Dashboard.blackFridayBanner.offerTimer.button")}
            </button>
          </div>
        </div>
      </Card>
      <Modal
        open={active}
        onClose={handleChange}
        title={t("Dashboard.blackFridayBanner.offerTimer.modal.heading")}
        primaryAction={{
          content: t("Dashboard.blackFridayBanner.offerTimer.modal.continue"),
          onAction: () => handleApiCall("/api/handlepromonthly"),
        }}
        secondaryActions={[
          {
            content: t("Dashboard.blackFridayBanner.offerTimer.modal.cancel"),
            onAction: handleChange,
          },
        ]}
      ></Modal>
    </>
  );
}

export default BlackFridayBanner;
