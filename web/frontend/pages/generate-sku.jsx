import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Page,
  Layout,
  Thumbnail,
  FormLayout,
  TextField,
  Checkbox,
  Text,
  RadioButton,
  InlineStack,
  Tag,
  Button,
  Badge,
  Spinner,
  Frame,
  Popover,
  Link,
  Tooltip,
  Toast,
  Icon,
  Modal,
  BlockStack,
  Divider,
  Label,
} from "@shopify/polaris";
import {
  ResourcePicker,
  useAuthenticatedFetch,
  useNavigate,
} from "@shopify/app-bridge-react";
import logo from "../assets/logo.svg";
import TryOut from "../components/TryOut/TryOut";
import PreviewTable from "../components/PreviewTable/PreviewTable";
import skuGenerator from "../helpers/sku-generator";
import SkuLayout from "../components/SKULayout/Layout";
import { useTranslation } from "react-i18next";
import IntroJs from "intro.js";
import "intro.js/introjs.css";
import "./main.scss";
import useAuthContext from "../hooks/useShopContext";
import { QuestionCircleIcon } from "@shopify/polaris-icons";
import ConditionBased from "../components/ConditionBased/ConditionBased";
import JobAddedModal from "../components/Modal/JobAddedModal";
import { XSmallIcon } from "@shopify/polaris-icons";

const finalSpaceCharacters = [
  {
    id: "title",
    name: "Title",
  },
  {
    id: "variant",
    name: "Variant",
  },
  {
    id: "type",
    name: "Type",
  },
  {
    id: "vendor",
    name: "Vendor",
  },
  {
    id: "body",
    name: "Body",
  },
  {
    id: "if-then",
    name: "If-Then",
  },
];

function generateSku() {
  const fetch = useAuthenticatedFetch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { shop, currentPlan, proPlan } = useAuthContext();
  const [basicRules, setBasicRules] = useState({
    head: "",
    body: 0,
    tail: "",
  });
  const [separator, setSeparator] = useState("");
  const [productOption, setProductOption] = useState("all");
  const [delimeters, setDelimeters] = useState("");
  const [delimetersPosition, setDelimetersPosition] = useState(false);
  const [applyToEmpty, setApplyToEmpty] = useState(false);
  const [removeSpace, setRemoveSpace] = useState(false);
  const [makeAllCapital, setMakeAllCapital] = useState(false);
  const [productVariant, setProductVariant] = useState(false);
  const [productTitleInclude, setProductTitleInclude] = useState(false);
  const [resourcePicker, setResourcePicker] = useState(false);
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagField, setTagField] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [showTryOut, setShowTryOut] = useState(true);
  const [active, setActive] = useState(false);
  const [skuCount, setSkuCount] = useState(0);
  const [previewProduct, setPreviewProduct] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState(0);
  const [selectedType, setSelectedType] = useState(0);
  const [popoverActive, setPopoverActive] = useState(false);
  const [popoverActive2, setPopoverActive2] = useState(false);
  const [incaseOfDuplicate, setIncaseOfDuplicate] = useState("newSKU");
  const [nextPageParameters, setNextPageParameters] = useState();
  const [previousPageParameters, setPreviousPageParameters] = useState();
  const [fetching, setFetching] = useState(false);
  const [productCount, setProductCount] = useState(0);
  const [fetchError, setFetchError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [layoutOrder, setLayoutOrder] = useState(finalSpaceCharacters);
  const [advancedLayout, setAdvancedLayout] = useState(false);
  const [lastBodyNo, setLastBodyNo] = useState(false);
  const [disableBodyNumber, setDisableBodyNumber] = useState(false);
  const [toastActive, setToastActive] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [countPerVariant, setCountPerVariant] = useState(true);
  const [conditions, setConditions] = useState([
    {
      selectedField: "",
      valueToAdd: "",
      valueToMatch: "",
    },
  ]);
  const [loadingCondition, setLoadingCondition] = useState(false);
  const [currentHandle, setCurrentHandle] = useState(1);
  const [bodyNumberType, setBodyNumberType] = useState("consecutive");
  const [randomNumberLength, setRandomNumberLength] = useState(3);

  useEffect(() => {
    fetchProduct();
    fetchNoOfProducts();
  }, [skuCount]);

  const fetchProductsFromAdmin = useCallback(async () => {
    const url = window.location.href;
    const params = new URLSearchParams(url.split("?")[1]);

    if (!params.has("ids[]")) {
      return;
    }

    setProductOption("custom"); // Set product option to custom

    const ids = params.getAll("ids[]");

    try {
      const response = await fetch(`/api/get-products/from-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
    }
  }, []);

  useEffect(() => {
    fetchProductsFromAdmin();
  }, [fetchProductsFromAdmin]);

  useEffect(() => {
    const token = localStorage.getItem("Final-SKU-onboardingToken");

    if (!token) {
      const intro = IntroJs();
      intro.setOptions({
        showProgress: true,
        scrollToElement: true,
        tooltipClass: "customTooltip",
        steps: [
          {
            title: "Welcome 👋",
            intro:
              "Thanks for installing app. Here's how it works. Click Next.",
          },
          {
            element: "#step-1",
            intro:
              '<p>In the "Prefix" field, you\'ll define the initial part of your SKU. It helps categorize your products distinctly.</p> <img style="width: 200px;" src="https://res.cloudinary.com/dupfwiwnp/image/upload/v1691754130/photofunny.net__6_yxvfsv.jpg"/>',
          },
          {
            element: "#step-2",
            intro:
              '<p>Moving on to the "Body" field, this numerical value increases with each product, ensuring unique SKUs.</p> <img style="width: 200px;" src="https://res.cloudinary.com/dupfwiwnp/image/upload/v1691759358/photofunny.net__9_xiodrd.jpg"/>',
          },
          {
            element: "#step-3",
            intro:
              '<p>Similar to the Prefix, you can set the "Suffix" value, which becomes the final part of your SKU.</p> <img style="width: 200px;" src="https://res.cloudinary.com/dupfwiwnp/image/upload/v1691759358/photofunny.net__8_kuw63s.jpg"/>',
          },
          {
            element: "#step-4",
            intro:
              '<p>Now, about the "Delimiter" – you have the flexibility to choose a separator that comes before the Suffix value.</p> <img style="width: 200px;" src="https://res.cloudinary.com/dupfwiwnp/image/upload/v1691759358/photofunny.net__7_cu9kv9.jpg"/>',
          },
          {
            element: "#step-5",
            intro:
              '<p>Ready for the finishing touch? Click on "Preview" to see the SKU based on your settings. Once you\'re satisfied, hit "Generate". This preview SKU will be shown in the last field of the "SKU Preview" table. Click "Done" to exit or click "Back" to go back.</p><img style="width: 263px;" src="https://res.cloudinary.com/dupfwiwnp/image/upload/v1691759892/photofunny.net__10_hdewtv.jpg" />',
          },
        ],
      });

      intro.onexit(() => {
        localStorage.setItem("Final-SKU-onboardingToken", "completed"); // Set token after onboarding
      });

      intro.start(); // Start the onboarding tour

      return () => {
        intro.exit(); // Clean up when the component unmounts
      };
    }
  }, []);

  const fetchProduct = useCallback(async (params = {}) => {
    try {
      setFetching(true);
      const queryString = new URLSearchParams(params).toString();
      const res = await fetch(`/api/products/list?${queryString}`);

      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      }

      const response = await res.json();
      setNextPageParameters(response.nextPageParameters);
      setPreviousPageParameters(response.previousPageParameters);
      setPreviewProduct(response.products);
    } catch (e) {
      console.warn("Error:", e);
    } finally {
      setFetching(false);
    }
  }, []);

  const fetchProductFromCollection = useCallback(
    async (params = {}, collections, type, first) => {
      let handles =
        (await collections) !== null
          ? collections.map((collection) => collection.handle)
          : [];
      try {
        setFetching(true);
        const response = await fetch(`/api/collections/list/${type}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            handles,
            params,
            currentHandle:
              type === "next"
                ? !first &&
                  params === null &&
                  currentHandle < collections.length
                  ? currentHandle + 1
                  : currentHandle
                : params === null && currentHandle > 1
                ? currentHandle - 1
                : currentHandle,
          }),
        });
        const res = await response.json();
        setCurrentHandle(parseInt(res.currentHandle));
        setNextPageParameters(res.nextPageParameters);
        setPreviousPageParameters(res.previousPageParameters);
        setPreviewProduct(res.products);
      } catch (e) {
        console.warn("Error:", e);
      } finally {
        setFetching(false);
      }
    },
    [currentHandle]
  );

  const fetchProductBasedOnTags = useCallback(
    async (params = {}, tags, type, first) => {
      try {
        setFetching(true);
        const response = await fetch(`/api/tags/list/${type}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tags,
            params,
            currentTag:
              type === "next"
                ? !first && params === null && currentHandle < tags.length
                  ? currentHandle + 1
                  : currentHandle
                : params === null && currentHandle > 1
                ? currentHandle - 1
                : currentHandle,
          }),
        });
        const res = await response.json();
        setCurrentHandle(parseInt(res.currentHandle));
        setNextPageParameters(res.nextPageParameters);
        setPreviousPageParameters(res.previousPageParameters);
        setPreviewProduct(res.products);
      } catch (e) {
        console.warn("Error:", e);
      } finally {
        setFetching(false);
      }
    },
    [currentHandle]
  );

  const resetForm = () => {
    setBasicRules({
      head: "",
      body: 0,
      tail: "",
    });
    setSeparator("");
    setProductOption("all");
    setApplyToEmpty(false);
    setProducts([]);
    setDelimeters("");
    setSelected(0);
    setSelectedType(0);
  };

  const handleBasicRules = (key, value) => {
    setBasicRules({ ...basicRules, [key]: value });
  };

  const handleSeparator = (value) => {
    setSeparator(value);
  };

  const handleProductOption = async (value) => {
    if (value === "custom" || value === "collection") {
      setResourcePicker(true);
    } else if (value === "all") {
      await fetchProduct();
    }
    setProductOption(value);
    setProducts([]);
    setCollections([]);
    setTags([]);
  };

  const handleDelimeterOption = (value) => {
    setDelimeters(value);
  };

  const handleApplyToEmpty = (value) => {
    setApplyToEmpty(value);
  };

  const handleRemoveSpace = (value) => {
    setRemoveSpace(value);
  };

  const handleLastBodyNo = useCallback(
    () => setLastBodyNo((lastBodyNo) => !lastBodyNo),
    []
  );

  const handleProductVariant = (value) => {
    setProductVariant(value);
  };

  const handleProductTitleInclude = (value) => {
    setProductTitleInclude(value);
  };

  const handleDisableBodyNumber = (value) => {
    setDisableBodyNumber(value);
  };

  const handleResourcePicker = (value) => {
    if (productOption === "custom") {
      setProducts(value.selection);
      setCollections([]);
    } else if (productOption === "collection") {
      fetchProductFromCollection(null, value.selection, "next", true);
      setCollections(value.selection);
      setProducts([]);
    }

    setResourcePicker(false);
  };

  const togglePopoverActive = useCallback(
    () => setPopoverActive((popoverActive) => !popoverActive),
    []
  );

  const secondTogglePopoverActive = useCallback(
    () => setPopoverActive2((popoverActive2) => !popoverActive2),
    []
  );

  const handleUpgradePlanModal = useCallback(() => {
    setUpgradeModal((upgradeModal) => !upgradeModal);
  });

  const handlePreview = async () => {
    setGenerating(true);
    const skuProducts = await skuGenerator(
      productOption === "custom" ? products : previewProduct,
      basicRules,
      separator,
      applyToEmpty,
      delimeters,
      delimetersPosition,
      selected,
      selectedType,
      removeSpace,
      makeAllCapital,
      layoutOrder,
      productVariant,
      productTitleInclude,
      conditions,
      countPerVariant,
      productOption,
      bodyNumberType,
      randomNumberLength
    );
    setPreviewProduct(skuProducts);
    setGenerating(false);
  };

  const fetchNoOfProducts = async () => {
    let response;
    response = await fetch("/api/products/count");
    const data = await response.json();
    setProductCount(data.count);
  };

  const toggleToastActive = () => {
    setToastActive((toastActive) => !toastActive);
  };

  const toastMessage = toastActive ? (
    <Toast
      duration={3000}
      onDismiss={toggleToastActive}
      content="SKUs Generated Successfully"
    />
  ) : null;

  async function submitForm() {
    setIsFetching(true);
    setActive(true);

    if (productOption === "custom") {
      // Map the products and update the state
      const mappedProducts = products.map((product) => {
        const match = product.id.match(/\d+$/);
        return match ? match[0] : null;
      });
      makeApiCall(mappedProducts);
    } else {
      makeApiCall(products);
    }
  }

  async function makeApiCall(payload) {
    try {
      const response = await fetch(`/api/sku/${shop.shop.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basicRules,
          separator,
          productOption,
          applyToEmpty,
          products: payload,
          delimeters,
          delimetersPosition,
          selected,
          selectedType,
          removeSpace,
          makeAllCapital,
          lastBodyNo,
          incaseOfDuplicate,
          layoutOrder,
          productVariant,
          currentPlan,
          conditions,
          collections,
          tags,
          productTitleInclude,
          disableBodyNumber,
          countPerVariant,
          bodyNumberType,
          randomNumberLength,
        }),
      });

      const data = await response.json();
      if (data.error) {
        console.log(data.error);
        setFetchError(true);
        setIsFetching(false);
      } else if (data.consumed) {
        setFetchError(true);
        setErrorMessage(data.consumed);
        setIsFetching(false);
      } else {
        // checkProgress(data.jobIds);
        if (data.jobIds) {
          setFetchError(false);
          setIsFetching(false);
          resetForm();
        }
      }
    } catch (error) {
      console.error("There was an error:", error);
      // display error message in modal or alert
    }
  }

  //Button element as activator for product vendor popover
  const activator = (
    <div style={{ width: "250px" }}>
      <Button
        onClick={togglePopoverActive}
        fullWidth
        textAlign="left"
        children={
          <Text>
            {selected === 0 ? "Not Used" : `First ${selected} Character`}
          </Text>
        }
        disclosure
      ></Button>
    </div>
  );

  //Button element as activator for product type popover
  const second_activator = (
    <div style={{ width: "250px" }}>
      <Button
        onClick={secondTogglePopoverActive}
        fullWidth
        textAlign="left"
        children={
          <Text>
            {selectedType === 0
              ? "Not Used"
              : `First ${selectedType} Character`}
          </Text>
        }
        disclosure
      ></Button>
    </div>
  );

  const handleSelectChange = useCallback(
    (value, conditionIndex) => {
      const updatedConditions = [...conditions];
      updatedConditions[conditionIndex].selectedField = value;
      setConditions(updatedConditions);
    },
    [conditions]
  );

  const setValueToMatch = useCallback(
    (value, conditionIndex) => {
      const updatedConditions = [...conditions];
      updatedConditions[conditionIndex].valueToMatch = value;
      setConditions(updatedConditions);
    },
    [conditions]
  );

  const setValueToAdd = useCallback(
    (value, conditionIndex) => {
      const updatedConditions = [...conditions];
      updatedConditions[conditionIndex].valueToAdd = value;
      setConditions(updatedConditions);
    },
    [conditions]
  );

  const addNewCondition = () => {
    setConditions((prevConditions) => [
      ...prevConditions,
      {
        selectedField: "",
        valueToAdd: "",
        valueToMatch: "",
      },
    ]);
  };

  const removeCondition = (conditionIndex) => {
    setConditions((prevConditions) => [
      ...prevConditions.slice(0, conditionIndex),
      ...prevConditions.slice(conditionIndex + 1),
    ]);
  };

  const handleAddTag = () => {
    if (tagField !== "") {
      setTags([...tags, tagField]);
      fetchProductBasedOnTags(null, [...tags, tagField], "next", true);
      setTagField("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleGetCondition = async () => {
    setLoadingCondition(true);
    if (shop.shop.id) {
      const res = await fetch(`/api/load-conditions/${shop.shop.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const resp = await res.json();
      if (resp) {
        setConditions(resp.data);
      }
      setLoadingCondition(false);
    }
  };

  const handleChange = useCallback((_, newValue) => {
    setBodyNumberType(newValue);
  }, []);

  return (
    <Frame>
      <Page>
        <br />
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <div style={{ display: "flex" }}>
                <div style={{ flex: "1" }}>
                  <InlineStack blockAlign="center" gap={"200"}>
                    <Thumbnail source={logo} size="small" />
                    <Text fontWeight="bold" variant="headingLg">
                      {t("SkuGenerate.heading")}
                    </Text>
                  </InlineStack>
                </div>
                <div style={{ flex: "1" }}>
                  <InlineStack align="end">
                    <p
                      style={{
                        fontSize: "12px",
                        marginTop: "10px",
                        fontFamily: "sans-serif",
                        textAlign: "center",
                      }}
                    >
                      {t("SkuGenerate.helpUrl.line1")}{" "}
                      <a href="https://appsfinal.freshdesk.com/support/tickets/new">
                        {t("SkuGenerate.helpUrl.line2")}
                      </a>
                    </p>
                  </InlineStack>
                </div>
              </div>
            </Card>
          </Layout.Section>
          <Layout.Section>
            <Card>
              <Text fontWeight="bold" variant="headingLg">
                {t("SkuGenerate.basicRules.heading")}
              </Text>
              <div style={{ marginTop: "10px" }} />
              <FormLayout>
                <FormLayout.Group condensed>
                  <TextField
                    id="step-1"
                    type="text"
                    label={t("SkuGenerate.basicRules.column1.label")}
                    helpText={t("SkuGenerate.basicRules.column1.helpText")}
                    value={basicRules.head}
                    onChange={(value) => handleBasicRules("head", value)}
                    autoComplete="off"
                  />
                  <TextField
                    id="step-2"
                    type="number"
                    label={t("SkuGenerate.basicRules.column2.label")}
                    helpText={t("SkuGenerate.basicRules.column2.helpText")}
                    value={basicRules.body}
                    onChange={(value) => handleBasicRules("body", value)}
                    autoComplete="off"
                    disabled={[
                      "continue",
                      "disable",
                      "productId",
                      "variantId",
                      "random",
                    ].includes(bodyNumberType)}
                  />
                  <TextField
                    id="step-3"
                    type="text"
                    label={t("SkuGenerate.basicRules.column3.label")}
                    helpText={t("SkuGenerate.basicRules.column3.helpText")}
                    value={basicRules.tail}
                    onChange={(value) => handleBasicRules("tail", value)}
                    autoComplete="off"
                  />
                </FormLayout.Group>
                <BlockStack>
                  <RadioButton
                    label={t(
                      "SkuGenerate.basicRules.radioButtons.option1.label"
                    )}
                    helpText={t(
                      "SkuGenerate.basicRules.radioButtons.option1.helpText"
                    )}
                    checked={bodyNumberType === "consecutive"}
                    id="consecutive"
                    name="consecutive"
                    onChange={handleChange}
                  />

                  {currentPlan === "Free Plan" ? (
                    <>
                      <InlineStack blockAlign="start" gap={"100"}>
                        <Tooltip
                          preferredPosition="above"
                          content={t(
                            "SkuGenerate.basicRules.radioButtons.option2.tooltipContent"
                          )}
                        >
                          <RadioButton
                            label={
                              <>
                                <span>
                                  {t(
                                    "SkuGenerate.basicRules.radioButtons.option2.label"
                                  )}
                                </span>
                                {currentPlan === "Free Plan" && (
                                  <span
                                    style={{
                                      marginLeft: "8px",
                                      display: "inline-block",
                                    }}
                                  >
                                    <Badge tone="success">Paid</Badge>
                                  </span>
                                )}
                              </>
                            }
                            helpText={t(
                              "SkuGenerate.basicRules.radioButtons.option2.helpText"
                            )}
                            checked={bodyNumberType === "continue"}
                            id="continue"
                            name="continue"
                            onChange={handleChange}
                            disabled={currentPlan === "Free Plan"}
                          />
                        </Tooltip>
                      </InlineStack>
                    </>
                  ) : (
                    <RadioButton
                      label={t(
                        "SkuGenerate.basicRules.radioButtons.option2.label"
                      )}
                      helpText={t(
                        "SkuGenerate.basicRules.radioButtons.option2.helpText"
                      )}
                      checked={bodyNumberType === "continue"}
                      id="continue"
                      name="continue"
                      onChange={handleChange}
                    />
                  )}
                  <RadioButton
                    label={t(
                      "SkuGenerate.basicRules.radioButtons.option3.label"
                    )}
                    helpText={t(
                      "SkuGenerate.basicRules.radioButtons.option3.helpText"
                    )}
                    checked={bodyNumberType === "disable"}
                    id="disable"
                    name="disable"
                    onChange={handleChange}
                  />
                  <RadioButton
                    label={t(
                      "SkuGenerate.basicRules.radioButtons.option4.label"
                    )}
                    helpText={t(
                      "SkuGenerate.basicRules.radioButtons.option4.helpText"
                    )}
                    checked={bodyNumberType === "productId"}
                    id="productId"
                    name="productId"
                    onChange={handleChange}
                  />
                  <RadioButton
                    label={t(
                      "SkuGenerate.basicRules.radioButtons.option5.label"
                    )}
                    helpText={t(
                      "SkuGenerate.basicRules.radioButtons.option5.helpText"
                    )}
                    id="variantId"
                    name="variantId"
                    checked={bodyNumberType === "variantId"}
                    onChange={handleChange}
                  />
                  <RadioButton
                    label={t(
                      "SkuGenerate.basicRules.radioButtons.option6.label"
                    )}
                    helpText={t(
                      "SkuGenerate.basicRules.radioButtons.option6.helpText"
                    )}
                    id="random"
                    name="random"
                    checked={bodyNumberType === "random"}
                    onChange={handleChange}
                  />
                  {bodyNumberType === "random" && (
                    <InlineStack blockAlign="center" gap={"150"}>
                      <div
                        style={{
                          width: "70px",
                          marginLeft: "28px",
                        }}
                      >
                        <TextField
                          type="number"
                          value={randomNumberLength}
                          onChange={setRandomNumberLength}
                          autoComplete="off"
                        />
                      </div>
                      <Label>
                        {t(
                          "SkuGenerate.basicRules.radioButtons.option6.numberField"
                        )}
                      </Label>
                    </InlineStack>
                  )}
                </BlockStack>
              </FormLayout>
              {advancedLayout ? (
                <FormLayout>
                  <p style={{ marginTop: "20px", fontWeight: "700" }}>
                    {t("SkuGenerate.basicRules.layout.heading")}
                  </p>
                  <SkuLayout
                    layoutOrder={layoutOrder}
                    setLayoutOrder={setLayoutOrder}
                  />
                </FormLayout>
              ) : null}
              <p
                style={{
                  textAlign: "center",
                  marginTop: "1em",
                  color: "#0000EE",
                  cursor: "pointer",
                  textDecorationLine: "underline",
                }}
                onClick={() => {
                  setAdvancedLayout((value) => !value);
                }}
              >
                {advancedLayout ? `Hide` : `Show`} Advanced Options
              </p>
            </Card>
          </Layout.Section>
          <Layout.Section>
            <Card title={t("SkuGenerate.separator.heading")}>
              <Text fontWeight="bold" variant="headingLg">
                {t("SkuGenerate.separator.heading")}
              </Text>
              <div style={{ marginTop: "10px" }} />
              <FormLayout>
                <TextField
                  type="text"
                  label={t("SkuGenerate.separator.label")}
                  helpText={t("SkuGenerate.separator.helpText")}
                  value={separator}
                  onChange={handleSeparator}
                  autoComplete="off"
                />
              </FormLayout>
              <FormLayout>
                <div
                  style={{ marginTop: "10px", marginBottom: "10px" }}
                  id="step-4"
                >
                  <InlineStack align="space-between">
                    <Text variation="strong">
                      {t("SkuGenerate.separator.delimeters.heading")}
                    </Text>
                    <RadioButton
                      label={t("SkuGenerate.separator.delimeters.radioButton")}
                      checked={delimeters == ""}
                      value=""
                      onChange={() => handleDelimeterOption("")}
                    />
                    <RadioButton
                      label="-"
                      checked={delimeters == "-"}
                      value="-"
                      onChange={() => handleDelimeterOption("-")}
                    />
                    <RadioButton
                      label="_"
                      checked={delimeters == "_"}
                      value="_"
                      onChange={() => handleDelimeterOption("_")}
                    />
                    <RadioButton
                      label="|"
                      checked={delimeters == "|"}
                      value="|"
                      onChange={() => handleDelimeterOption("|")}
                    />
                    <RadioButton
                      label="/"
                      checked={delimeters == "/"}
                      value="/"
                      onChange={() => handleDelimeterOption("/")}
                    />
                    <RadioButton
                      label="."
                      checked={delimeters == "."}
                      value="."
                      onChange={() => handleDelimeterOption(".")}
                    />
                    <Checkbox
                      label={t("SkuGenerate.separator.delimeters.checkBox")}
                      checked={delimetersPosition}
                      onChange={() =>
                        setDelimetersPosition(!delimetersPosition)
                      }
                    />
                  </InlineStack>
                </div>
              </FormLayout>
              <FormLayout>
                <InlineStack align="space-between">
                  <Text variation="strong">
                    {t("SkuGenerate.separator.productVendor.heading")}
                  </Text>
                  <Popover
                    active={popoverActive}
                    activator={activator}
                    onClose={togglePopoverActive}
                    sectioned
                  >
                    <BlockStack>
                      <InlineStack>
                        <RadioButton
                          label={t("SkuGenerate.separator.productVendor.line1")}
                          checked={selected === 0}
                          id="not_used"
                          name="vendor"
                          onChange={() => setSelected(0)}
                        />
                      </InlineStack>
                      <InlineStack>
                        <RadioButton
                          label={t("SkuGenerate.separator.productVendor.line2")}
                          checked={selected === 1}
                          id="first_char"
                          name="vendor"
                          onChange={() => setSelected(1)}
                        />
                      </InlineStack>
                      <InlineStack>
                        <RadioButton
                          label={t("SkuGenerate.separator.productVendor.line3")}
                          checked={selected === 2}
                          id="first_2_char"
                          name="vendor"
                          onChange={() => setSelected(2)}
                        />
                      </InlineStack>
                      <InlineStack fill>
                        <RadioButton
                          label={t("SkuGenerate.separator.productVendor.line4")}
                          checked={selected === 3}
                          id="first_3_char"
                          name="vendor"
                          onChange={() => setSelected(3)}
                        />
                      </InlineStack>
                      <InlineStack fill>
                        <RadioButton
                          label={t("SkuGenerate.separator.productVendor.line5")}
                          checked={selected === 4}
                          id="first_4_char"
                          name="vendor"
                          onChange={() => setSelected(4)}
                        />
                      </InlineStack>
                    </BlockStack>
                  </Popover>
                  <Text variation="strong">
                    {t("SkuGenerate.separator.productType.heading")}
                  </Text>
                  <Popover
                    active={popoverActive2}
                    activator={second_activator}
                    onClose={secondTogglePopoverActive}
                    sectioned
                  >
                    <BlockStack>
                      <InlineStack>
                        <RadioButton
                          label={t("SkuGenerate.separator.productType.line1")}
                          checked={selectedType === 0}
                          id="not_used"
                          name="product_type"
                          onChange={() => setSelectedType(0)}
                        />
                      </InlineStack>
                      <InlineStack>
                        <RadioButton
                          label={t("SkuGenerate.separator.productType.line2")}
                          checked={selectedType === 1}
                          id="first_char"
                          name="product_type"
                          onChange={() => setSelectedType(1)}
                        />
                      </InlineStack>
                      <InlineStack>
                        <RadioButton
                          label={t("SkuGenerate.separator.productType.line3")}
                          checked={selectedType === 2}
                          id="first_2_char"
                          name="product_type"
                          onChange={() => setSelectedType(2)}
                        />
                      </InlineStack>
                      <InlineStack>
                        <RadioButton
                          label={t("SkuGenerate.separator.productType.line4")}
                          checked={selectedType === 3}
                          id="first_3_char"
                          name="product_type"
                          onChange={() => setSelectedType(3)}
                        />
                      </InlineStack>
                      <InlineStack>
                        <RadioButton
                          label={t("SkuGenerate.separator.productType.line5")}
                          checked={selectedType === 4}
                          id="first_4_char"
                          name="product_type"
                          onChange={() => setSelectedType(4)}
                        />
                      </InlineStack>
                    </BlockStack>
                  </Popover>
                </InlineStack>
              </FormLayout>
            </Card>
          </Layout.Section>
          <Layout.Section>
            <Card>
              <InlineStack alignment="center" distribution="equalSpacing">
                <InlineStack gap={"100"}>
                  <Text fontWeight="bold" variant="headingLg">
                    {t("SkuGenerate.conditionConfiguration.heading")}
                  </Text>
                  {!proPlan && <Badge tone="success">Pro</Badge>}
                </InlineStack>
                {shop?.shop?.id === 55905943718 && (
                  <Button
                    loading={loadingCondition}
                    onClick={handleGetCondition}
                  >
                    Recent conditions
                  </Button>
                )}
              </InlineStack>
              <div style={{ height: "15px" }} />
              <InlineStack>
                <Text variant="bodyMd" tone="subdued">
                  {t("SkuGenerate.conditionConfiguration.content")}
                </Text>
                <Tooltip
                  content={t(
                    "SkuGenerate.conditionConfiguration.tooltipContent"
                  )}
                  preferredPosition="above"
                >
                  <Icon source={QuestionCircleIcon} tone="subdued" />
                </Tooltip>
              </InlineStack>
              <div style={{ marginTop: "20px" }} />
              <FormLayout>
                {conditions.map((condition, index) => (
                  <div key={index} style={{ position: "relative" }}>
                    <ConditionBased
                      index={index}
                      condition={condition}
                      handleSelectChange={handleSelectChange}
                      setValueToMatch={setValueToMatch}
                      setValueToAdd={setValueToAdd}
                      proPlan={proPlan}
                      handleUpgradePlanModal={handleUpgradePlanModal}
                    />
                    {conditions.length > 1 && (
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          padding: "5px",
                          cursor: "pointer",
                        }}
                        onClick={() => removeCondition(index)}
                      >
                        <Icon source={XSmallIcon} color="critical" />
                      </div>
                    )}
                  </div>
                ))}
                <InlineStack align="center">
                  <Button
                    plain
                    onClick={proPlan ? addNewCondition : handleUpgradePlanModal}
                  >
                    + {t("SkuGenerate.conditionConfiguration.action")}
                  </Button>
                </InlineStack>
              </FormLayout>
            </Card>
          </Layout.Section>
          <Layout.Section>
            <Card padding={"0"}>
              <div
                style={{
                  paddingTop: "15px",
                  paddingLeft: "15px",
                  paddingRight: "15px",
                }}
              >
                <InlineStack align="space-between">
                  <Text fontWeight="bold" variant="headingLg">
                    {t("SkuGenerate.products.heading")}
                  </Text>
                  <Text variation="strong">
                    {t("SkuGenerate.products.subHeading")}: {productCount}
                  </Text>
                </InlineStack>
              </div>
              <div
                style={{
                  textAlign: "end",
                  paddingRight: "15px",
                }}
              >
                {currentPlan === "Free Plan" ? (
                  <>
                    <Text variation="subdued">
                      ({t("SkuGenerate.products.freePlan.line1")})
                    </Text>
                    <Link
                      onClick={() => {
                        navigate("/PlansPricing");
                      }}
                    >
                      {t("SkuGenerate.products.freePlan.line2")}
                    </Link>
                  </>
                ) : (
                  <div style={{ margin: "10px" }} />
                )}
              </div>
              <Divider />
              <div style={{ padding: "15px" }}>
                <FormLayout>
                  <FormLayout.Group>
                    <RadioButton
                      label={t("SkuGenerate.products.radioButton1")}
                      checked={productOption == "all"}
                      value="all"
                      onChange={() => handleProductOption("all")}
                    />
                    <RadioButton
                      label={t("SkuGenerate.products.radioButton2")}
                      checked={productOption == "custom"}
                      value="custom"
                      onChange={() => handleProductOption("custom")}
                    />
                    <RadioButton
                      label={t("SkuGenerate.products.radioButton3")}
                      checked={productOption == "collection"}
                      value="collection"
                      onChange={() => handleProductOption("collection")}
                    />
                    <RadioButton
                      label={t("SkuGenerate.products.radioButton4.heading")}
                      checked={productOption == "tag"}
                      value="tag"
                      onChange={() => handleProductOption("tag")}
                    />
                  </FormLayout.Group>
                </FormLayout>
              </div>
              <Divider />
              {(productOption === "custom" ||
                productOption === "collection") && (
                <>
                  <div style={{ padding: "15px" }}>
                    <div style={{ marginBottom: "10px" }}>
                      Selected{" "}
                      {productOption === "custom" ? "products" : "collections"}{" "}
                      <Badge size="small">
                        {productOption === "custom"
                          ? products.reduce((a, b) => a + b.variants.length, 0)
                          : collections.length}
                      </Badge>
                    </div>
                    <InlineStack gap={"100"}>
                      {productOption === "custom"
                        ? products.map((product) =>
                            product.variants.map((variant) => (
                              <Tag key={variant.id}>
                                {product.title} {variant.title}
                              </Tag>
                            ))
                          )
                        : collections.map((collection) => (
                            <Tag key={collection.id}>
                              {collection.title}{" "}
                              <Badge size="small">
                                {collection.productsCount}
                              </Badge>
                            </Tag>
                          ))}
                    </InlineStack>
                  </div>
                  <Divider />
                </>
              )}
              {productOption === "tag" && (
                <>
                  <div style={{ padding: "15px" }}>
                    <TextField
                      placeholder="Eg: Vintage, Cotton, Summer, etc."
                      value={tagField}
                      onChange={setTagField}
                      connectedRight={
                        <Button onClick={handleAddTag}>
                          + {t("SkuGenerate.products.radioButton4.button")}
                        </Button>
                      }
                    />
                    <div style={{ marginTop: "10px" }} />
                    <InlineStack gap={"100"}>
                      <>
                        {t("SkuGenerate.products.radioButton4.line1")}{" "}
                        <Badge size="small">{tags.length}</Badge>
                      </>
                      {tags.map((tag) => (
                        <Tag key={tag} onRemove={() => handleRemoveTag(tag)}>
                          {tag}{" "}
                        </Tag>
                      ))}
                    </InlineStack>
                  </div>
                  <Divider />
                </>
              )}
              <div style={{ padding: "15px" }}>
                <InlineStack blockAlign="center" align="space-between">
                  <Text fontWeight="medium">
                    {t("SkuGenerate.products.label1.heading")}
                  </Text>
                  <RadioButton
                    label={t("SkuGenerate.products.label1.option1")}
                    checked={incaseOfDuplicate == "newSKU"}
                    value="newSKU"
                    onChange={() => setIncaseOfDuplicate("newSKU")}
                  />
                  <RadioButton
                    label={t("SkuGenerate.products.label1.option2")}
                    checked={incaseOfDuplicate == "existingSKU"}
                    value="existingSKU"
                    onChange={() => setIncaseOfDuplicate("existingSKU")}
                  />
                </InlineStack>
                <div style={{ marginTop: "1em" }}>
                  <InlineStack blockAlign="center" align="space-between">
                    <Text fontWeight="medium">
                      {t("SkuGenerate.products.label2.heading")}
                    </Text>
                    <Checkbox
                      label={t("SkuGenerate.products.label2.option1")}
                      checked={applyToEmpty}
                      onChange={handleApplyToEmpty}
                    />
                    <Checkbox
                      label={t("SkuGenerate.products.label2.option2")}
                      checked={productVariant}
                      onChange={handleProductVariant}
                    />
                    <Checkbox
                      label={t("SkuGenerate.products.label2.option3")}
                      checked={removeSpace}
                      onChange={handleRemoveSpace}
                    />
                    <Checkbox
                      label={t("SkuGenerate.products.label2.option4")}
                      checked={productTitleInclude}
                      onChange={handleProductTitleInclude}
                    />
                    <Checkbox
                      label={t("SkuGenerate.products.label2.option6")}
                      checked={countPerVariant}
                      onChange={setCountPerVariant}
                    />
                    <Checkbox
                      label={t("SkuGenerate.products.label2.option5")}
                      checked={makeAllCapital}
                      onChange={setMakeAllCapital}
                    />
                  </InlineStack>
                </div>
              </div>
            </Card>
          </Layout.Section>
          <Layout.Section>
            <InlineStack align="space-between">
              <Button tone="critical" onClick={resetForm}>
                {t("SkuGenerate.buttons.button1")}
              </Button>
              <Button id="step-5" onClick={handlePreview}>
                {t("SkuGenerate.buttons.button2")}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  submitForm();
                }}
                disabled={
                  (products.length == 0 && productOption == "custom") ||
                  (collections.length == 0 && productOption == "collection") ||
                  (tags.length == 0 && productOption == "tag") ||
                  isFetching
                }
              >
                {isFetching ? (
                  <InlineStack alignment="center" spacing="loose">
                    <Spinner size="small"></Spinner>
                    <Text>Generating SKUs</Text>
                  </InlineStack>
                ) : (
                  <Text>{t("SkuGenerate.buttons.button3")}</Text>
                )}
              </Button>
            </InlineStack>
          </Layout.Section>
          <Layout.Section>
            <Card padding={"0"}>
              <div style={{ padding: "15px" }}>
                <Text fontWeight="bold" variant="headingLg">
                  {t("SkuGenerate.skuPreview.heading")}
                </Text>
              </div>
              <Divider />
              <PreviewTable
                previewProduct={
                  productOption === "custom" ? products : previewProduct
                }
                generating={generating}
                nextPageParameters={nextPageParameters}
                previousPageParameters={previousPageParameters}
                fetchProduct={fetchProduct}
                fetchProductFromCollection={fetchProductFromCollection}
                fetchProductBasedOnTags={fetchProductBasedOnTags}
                fetching={fetching}
                productOption={productOption}
                collections={collections}
                tags={tags}
                currentHandle={currentHandle}
              />
            </Card>
          </Layout.Section>
        </Layout>

        {active && (
          <JobAddedModal
            active={active}
            setActive={setActive}
            isFetching={isFetching}
            fetchError={fetchError}
            errorMessage={errorMessage}
          />
        )}

        <Modal
          small
          open={upgradeModal}
          instant
          onClose={handleUpgradePlanModal}
          primaryAction={{
            content: t("SkuGenerate.conditionConfiguration.modal.upgrade"),
            onAction: () => navigate("/PlansPricing"),
          }}
          title={
            <p className="modal-title">
              {t("SkuGenerate.conditionConfiguration.modal.heading")}
            </p>
          }
        >
          <Modal.Section>
            <p className="modal-paragraph">
              {t("SkuGenerate.conditionConfiguration.modal.content")}
            </p>
          </Modal.Section>
        </Modal>

        <ResourcePicker
          onSelection={handleResourcePicker}
          onCancel={() => setResourcePicker(false)}
          open={resourcePicker}
          resourceType={productOption === "custom" ? "Product" : "Collection"}
        ></ResourcePicker>
      </Page>
      <Page>{showTryOut ? <TryOut setShowTryOut={setShowTryOut} /> : ""}</Page>
      {toastMessage}
    </Frame>
  );
}

export default generateSku;
