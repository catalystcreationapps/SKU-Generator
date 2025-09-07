import React, { useCallback, useEffect, useState } from "react";
import useAuthContext from "../hooks/useShopContext";
import SmartSKU from "../components/Smart-SKU/SmartSKU";
import Accordian from "../components/Accordian/Accordian";
import { useAuthenticatedFetch } from "@shopify/app-bridge-react";
import {
  Card,
  Layout,
  Page,
  Button,
  InlineStack,
  EmptyState,
  Frame,
  Toast,
  Spinner,
  Modal,
  Text,
  Divider,
  Badge,
} from "@shopify/polaris";
import NewPreference from "../components/Preference/NewPreference";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PlusIcon } from "@shopify/polaris-icons";
import "../components/Accordian/Accordian.css";

function AutomatedSKU() {
  const { t } = useTranslation();
  const { shop, currentPlan, proPlan } = useAuthContext();
  const navigate = useNavigate();
  const fetch = useAuthenticatedFetch();
  const [active, setActive] = useState(false);
  const [listOfPreference, setListOfPreference] = useState([]);
  const [updated, setUpdated] = useState(false);
  const [appliedPreference, setAppliedPreference] = useState("");
  const [toastActive, setToastActive] = useState(false);
  const [deleteToastActive, setDeleteToastActive] = useState(false);
  const [createToastActive, setCreateToastActive] = useState(false);
  const [applyToastActive, setApplyToastActive] = useState(false);
  const [activateToastActive, setActivateToastActive] = useState(false);
  const [deactivateToastActive, setDeactivateToastActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [proPlanq, setProPlan] = useState(false);
  const [currentPlanq, setCurrentPlan] = useState("");
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [currentPlanLoading, setCurrentPlanLoading] = useState(true);
  const [chargeId, setChargeId] = useState("");

  const getPreference = async () => {
    if (shop) {
      setLoading(true);
      const res = await fetch(`/api/get-skupreference/${shop.shop.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const resp = await res.json();
      setListOfPreference(resp.data);
      setAppliedPreference(resp.appliedPreference);
      setLoading(false);
    }
  };

  const upgradePlan = async () => {
    try {
      setCurrentPlanLoading(true);
      return await fetch(`/api/upgradeplan/${shop.shop.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
        .then((res) => res.json())
        .then((resp) => {
          setCurrentPlan(resp.chargeName);
          if (resp.proPlan) {
            setProPlan(true);
            setChargeId(resp.charge_id);
          } else {
            setProPlan(false);
          }
          setCurrentPlanLoading(false);
        });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (shop) {
      upgradePlan();
    }
  }, [shop]);

  useEffect(() => {
    if (shop && proPlan) {
      getPreference();
    }
  }, [shop, updated, proPlan]);

  const handleModal = useCallback(() => {
    setActive((active) => !active);
  }, []);

  const handleUpgradePlanModal = useCallback(() => {
    setUpgradeModal((upgradeModal) => !upgradeModal);
  });

  const toggleActive = useCallback(
    () => setToastActive((toastActive) => !toastActive),
    []
  );

  const toggleActiveForDelete = useCallback(
    () => setDeleteToastActive((deleteToastActive) => !deleteToastActive),
    []
  );

  const toggleActiveForCreate = useCallback(
    () => setCreateToastActive((createToastActive) => !createToastActive),
    []
  );

  const toggleActiveForApply = useCallback(
    () => setApplyToastActive((applyToastActive) => !applyToastActive),
    []
  );

  const toggleActiveForActivating = useCallback(() => {
    setActivateToastActive((activateToastActive) => !activateToastActive);
  });

  const toggleActiveForDeactivating = useCallback(() =>
    setDeactivateToastActive((deactivateToastActive) => !deactivateToastActive)
  );

  const toastMarkup = toastActive ? (
    <Toast
      content="Preference Updated Successfully"
      duration={3000}
      onDismiss={toggleActive}
    />
  ) : deleteToastActive ? (
    <Toast
      duration={3000}
      content="Preference Deleted Successfully"
      onDismiss={toggleActiveForDelete}
    />
  ) : createToastActive ? (
    <Toast
      duration={3000}
      content="Preference Added Successfully"
      onDismiss={toggleActiveForCreate}
    />
  ) : applyToastActive ? (
    <Toast
      duration={3000}
      content="Selected Preference Applied"
      onDismiss={toggleActiveForApply}
    />
  ) : activateToastActive ? (
    <Toast
      duration={3000}
      content="Automated SKU Enabled"
      onDismiss={toggleActiveForActivating}
    />
  ) : deactivateToastActive ? (
    <Toast
      duration={3000}
      content="Automated SKU Disabled"
      onDismiss={toggleActiveForDeactivating}
    />
  ) : null;

  return (
    <Frame>
      {active ? (
        <Page title={t("AutomatedSku.preference.createNewPreference.heading")}>
          <NewPreference
            handleModal={handleModal}
            toggleActiveForCreate={toggleActiveForCreate}
            setUpdated={setUpdated}
            shopId={shop.shop.id}
            proPlan={proPlan}
            setUpgradeModal={setUpgradeModal}
          />
        </Page>
      ) : (
        <Page
          title={
            <InlineStack gap={"100"}>
              <Text fontWeight="bold" variant="headingLg">
                {t("AutomatedSku.heading")}
              </Text>
              {!proPlan && <Badge tone="success">Pro</Badge>}
            </InlineStack>
          }
        >
          <Layout>
            <Layout.Section>
              <SmartSKU
                currentPlanLoading={currentPlanLoading}
                currentPlan={currentPlan}
                proPlan={proPlan}
                setProPlan={setProPlan}
                chargeId={chargeId}
                setUpgradeModal={setUpgradeModal}
                toggleActiveForActivating={toggleActiveForActivating}
                toggleActiveForDeactivating={toggleActiveForDeactivating}
                shopId={shop?.shop?.id}
              />
            </Layout.Section>
            <br />
            <Layout.Section>
              <Card padding={"0"}>
                <div style={{ padding: "15px" }}>
                  <InlineStack align="space-between" blockAlign="center">
                    <Text fontWeight="bold" variant="headingLg">
                      {t("AutomatedSku.preference.heading")}
                    </Text>
                    <Button
                      icon={PlusIcon}
                      variant="primary"
                      disabled={!proPlan}
                      onClick={proPlan ? handleModal : handleUpgradePlanModal}
                    >
                      <p style={{ padding: "5px", fontSize: "13px" }}>
                        {t("AutomatedSku.preference.empty.button")}
                      </p>
                    </Button>
                  </InlineStack>
                </div>
                <Divider />
                <div className="accordion-container">
                  {loading ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: "200px",
                      }}
                    >
                      <Spinner accessibilityLabel="Loading" size="large" />
                    </div>
                  ) : (
                    <>
                      {listOfPreference.length > 0 ? (
                        <>
                          {listOfPreference.map((item, index) => (
                            <Accordian
                              item={item}
                              index={index}
                              shopId={shop.shop.id}
                              setUpdated={setUpdated}
                              appliedPreference={appliedPreference}
                              toggleActive={toggleActive}
                              toggleActiveForDelete={toggleActiveForDelete}
                              toggleActiveForApply={toggleActiveForApply}
                              setListOfPreference={setListOfPreference}
                              listOfPreference={listOfPreference}
                              proPlan={proPlan}
                              setAppliedPreference={setAppliedPreference}
                            />
                          ))}
                        </>
                      ) : (
                        <EmptyState
                          heading={t("AutomatedSku.preference.empty.heading")}
                          action={{
                            content: t("AutomatedSku.preference.empty.button"),
                            onAction: proPlan
                              ? handleModal
                              : handleUpgradePlanModal,
                          }}
                          image="https://cdn.shopify.com/s/files/1/2376/3301/products/emptystate-files.png"
                        >
                          <p>
                            {t("AutomatedSku.preference.empty.line1")}
                            <strong>
                              {t("AutomatedSku.preference.empty.line2")}
                            </strong>
                            {t("AutomatedSku.preference.empty.line3")}
                            <strong>
                              {t("AutomatedSku.preference.empty.line4")}
                            </strong>
                          </p>
                        </EmptyState>
                      )}
                    </>
                  )}
                </div>
              </Card>
            </Layout.Section>
          </Layout>
          <Modal
            small
            open={upgradeModal}
            instant
            onClose={handleUpgradePlanModal}
            primaryAction={{
              content: t("AutomatedSku.preference.empty.modal.upgrade"),
              onAction: () => navigate("/PlansPricing"),
            }}
            title={
              <p className="modal-title">
                {t("AutomatedSku.preference.empty.modal.heading")}
              </p>
            }
          >
            <Modal.Section>
              <p className="modal-paragraph">
                {t("AutomatedSku.preference.empty.modal.content")}
              </p>
            </Modal.Section>
          </Modal>
        </Page>
      )}
      {toastMarkup}
    </Frame>
  );
}

export default AutomatedSKU;
