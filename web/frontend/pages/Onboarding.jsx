import React, { useEffect, useState } from "react";
import {
  Button,
  ButtonGroup,
  Card,
  FormLayout,
  Frame,
  InlineStack,
  Layout,
  Page,
  ProgressBar,
  SkeletonBodyText,
  SkeletonDisplayText,
} from "@shopify/polaris";
import { useNavigate } from "@shopify/app-bridge-react";
import { useAuthenticatedFetch } from "@shopify/app-bridge-react";
import Instruction from "../components/Onboarding/Instruction";
import SkuApps from "../components/Onboarding/SkuApps";
import StoreDetails from "../components/Onboarding/StoreDetails";
import StoreType from "../components/Onboarding/StoreType";
import Plans from "../components/Onboarding/Plans";

function Onboarding() {
  const navigate = useNavigate();
  const fetchApi = useAuthenticatedFetch();

  const [step, setStep] = useState(0);
  const [next, setNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState({
    businessName: "",
    email: "",
    phone: "",
    otherUsedApps: "none",
    devStore: "",
  });

  const nextStep = () => setStep((state) => ++state);
  const prevStep = () => setStep((state) => --state);

  const finishOnbarding = async () => {
    setSubmitting(true);
    await fetchApi("/api/shop", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(state),
    });

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
        setSubmitting(false);
        navigate("/generate-sku");
      },
      hasTimeout ? 1500 : 0
    );
  };

  const fetchShop = async () => {
    setLoading(true);
    const res = await fetchApi(`/api/shop`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const data = await res.json();
    setState({
      ...state,
      email: data.email || data.customer_email || "",
      phone: data.phone || "",
      businessName: data.name || "",
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchShop();
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/canvas-confetti@1.4.0/dist/confetti.browser.min.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <Frame>
      <Page
        title="Welcome to F: SKU Code Generator 👋"
        subtitle="Let's setup the app for your first use, please follow the steps."
        narrowWidth
      >
        <Layout>
          <Layout.Section>
            <InlineStack align="space-between" blockAlign="center" gap="400">
              <div style={{ display: "flex", flex: 1, gap: "0.5rem" }}>
                {Array.from({ length: 5 }, (_, i) => i).map((item) => (
                  <div style={{ maxWidth: "50px", width: "100%" }}>
                    <ProgressBar
                      size="small"
                      progress={step >= item ? 100 : 0}
                    />
                  </div>
                ))}
              </div>
              <ButtonGroup gap="tight">
                <Button onClick={prevStep} disabled={step == 0}>
                  Back
                </Button>
                {step == 4 ? (
                  <Button
                    variant="primary"
                    onClick={finishOnbarding}
                    loading={submitting}
                  >
                    Finish
                  </Button>
                ) : (
                  <Button variant="primary" disabled={!next} onClick={nextStep}>
                    Next
                  </Button>
                )}
              </ButtonGroup>
            </InlineStack>
          </Layout.Section>
          <Layout.Section>
            {loading && (
              <Card>
                <FormLayout>
                  <SkeletonDisplayText size="small" />
                  <SkeletonBodyText lines={2} />
                  <SkeletonDisplayText size="small" />
                  <SkeletonBodyText lines={2} />
                </FormLayout>
              </Card>
            )}
            {!loading && step == 0 && (
              <StoreDetails
                setNext={setNext}
                state={state}
                setState={setState}
              />
            )}
            {!loading && step == 1 && (
              <SkuApps setNext={setNext} state={state} setState={setState} />
            )}
            {!loading && step == 2 && (
              <StoreType setNext={setNext} state={state} setState={setState} />
            )}
            {!loading && step == 3 && (
              <Instruction
                setNext={setNext}
                state={state}
                setState={setState}
              />
            )}
            {!loading && step == 4 && <Plans setNext={setNext} />}
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}

export default Onboarding;
