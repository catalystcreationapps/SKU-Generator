import React, { useState, useCallback } from "react";
import {
  Card,
  FormLayout,
  TextField,
  Button,
  InlineStack,
  Text,
  RadioButton,
  Checkbox,
  Popover,
  Icon,
  BlockStack,
  Label,
} from "@shopify/polaris";
import { useTranslation } from "react-i18next";
import { useAuthenticatedFetch } from "@shopify/app-bridge-react";
import SkuLayout from "../SKULayout/Layout";
import ConditionBased from "../ConditionBased/ConditionBased";
import { ExitIcon } from "@shopify/polaris-icons";

const finalSpaceCharacters = [
  {
    id: "title",
    name: "Title",
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

function NewPreference({
  toggleActiveForCreate,
  handleModal,
  setUpdated,
  shopId,
  proPlan,
  setUpgradeModal,
}) {
  const { t } = useTranslation();
  const fetch = useAuthenticatedFetch();
  const [layoutOrder, setLayoutOrder] = useState(finalSpaceCharacters);
  const [basicRules, setBasicRules] = useState({
    head: "",
    body: 0,
    tail: "",
  });
  const [separator, setSeparator] = useState("");
  const [delimeters, setDelimeters] = useState("");
  const [popoverActive, setPopoverActive] = useState(false);
  const [popoverActive2, setPopoverActive2] = useState(false);
  const [delimetersPosition, setDelimetersPosition] = useState(false);
  const [applyToEmpty, setApplyToEmpty] = useState(false);
  const [removeSpace, setRemoveSpace] = useState(false);
  const [makeAllCapital, setMakeAllCapital] = useState(false);
  const [productVariant, setProductVariant] = useState(true);
  const [selected, setSelected] = useState(0);
  const [selectedType, setSelectedType] = useState(0);
  const [loading, setLoading] = useState(false);
  const [productTitleInclude, setProductTitleInclude] = useState(false);
  const [conditions, setConditions] = useState([
    {
      selectedField: "",
      valueToAdd: "",
      valueToMatch: "",
    },
  ]);
  const [bodyNumberType, setBodyNumberType] = useState("consecutive");
  const [randomNumberLength, setRandomNumberLength] = useState(3);

  const handleBasicRules = (key, value) => {
    setBasicRules({ ...basicRules, [key]: value });
  };

  const handleSeparator = (value) => {
    setSeparator(value);
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

  const handleProductVariant = (value) => {
    setProductVariant(value);
  };

  const togglePopoverActive = useCallback(
    () => setPopoverActive((popoverActive) => !popoverActive),
    []
  );

  const secondTogglePopoverActive = useCallback(
    () => setPopoverActive2((popoverActive2) => !popoverActive2),
    []
  );

  const handleProductTitleInclude = (value) => {
    setProductTitleInclude(value);
  };

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

  const createNewRule = async () => {
    try {
      setLoading(true);
      fetch(`/api/create-skupreference/${shopId}`, {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basicRules,
          separator,
          applyToEmpty,
          delimeters,
          delimetersPosition,
          selected,
          selectedType,
          removeSpace,
          makeAllCapital,
          bodyNumberType,
          randomNumberLength,
          layoutOrder,
          productVariant,
          conditions,
          productTitleInclude,
        }),
      })
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          if (data.success) {
            setUpdated((updated) => !updated);
          }
          setLoading(false);
          toggleActiveForCreate();
          handleModal();
        })
        .catch((error) => {
          console.error("There was an error:", error);
          // display error message in modal or alert
        });
    } catch (err) {
      console.log(err);
    }
  };

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

  const handleChange = useCallback((_, newValue) => {
    setBodyNumberType(newValue);
  }, []);

  return (
    <div style={{ marginBottom: "2em" }}>
      <Card>
        <Text fontWeight="bold" variant="headingLg">
          {t("SkuGenerate.basicRules.heading")}
        </Text>
        <div style={{ marginTop: "10px" }} />
        <FormLayout>
          <FormLayout.Group condensed>
            <TextField
              type="text"
              label={t("SkuGenerate.basicRules.column1.label")}
              helpText={t("SkuGenerate.basicRules.column1.helpText")}
              value={basicRules.head}
              onChange={(value) => handleBasicRules("head", value)}
              autoComplete="off"
            />
            <TextField
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
              type="text"
              label={t("SkuGenerate.basicRules.column3.label")}
              helpText={t("SkuGenerate.basicRules.column3.label")}
              value={basicRules.tail}
              onChange={(value) => handleBasicRules("tail", value)}
              autoComplete="off"
            />
          </FormLayout.Group>
          <BlockStack>
            <RadioButton
              label={t("SkuGenerate.basicRules.radioButtons.option1.label")}
              helpText="Generate SKUs with sequential numbers like 1, 2, 3, 4, etc."
              checked={bodyNumberType === "consecutive"}
              id="consecutive"
              name="consecutive"
              onChange={handleChange}
            />
            <RadioButton
              label={t("SkuGenerate.basicRules.radioButtons.option2.label")}
              helpText={t(
                "SkuGenerate.basicRules.radioButtons.option2.helpText"
              )}
              checked={bodyNumberType === "continue"}
              id="continue"
              name="continue"
              onChange={handleChange}
            />
            <RadioButton
              label={t("SkuGenerate.basicRules.radioButtons.option3.label")}
              helpText={t(
                "SkuGenerate.basicRules.radioButtons.option3.helpText"
              )}
              checked={bodyNumberType === "disable"}
              id="disable"
              name="disable"
              onChange={handleChange}
            />
            <RadioButton
              label={t("SkuGenerate.basicRules.radioButtons.option4.label")}
              helpText={t(
                "SkuGenerate.basicRules.radioButtons.option4.helpText"
              )}
              checked={bodyNumberType === "productId"}
              id="productId"
              name="productId"
              onChange={handleChange}
            />
            <RadioButton
              label={t("SkuGenerate.basicRules.radioButtons.option5.label")}
              helpText={t(
                "SkuGenerate.basicRules.radioButtons.option5.helpText"
              )}
              id="variantId"
              name="variantId"
              checked={bodyNumberType === "variantId"}
              onChange={handleChange}
            />
            <RadioButton
              label={t("SkuGenerate.basicRules.radioButtons.option6.label")}
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
                  {t("SkuGenerate.basicRules.radioButtons.option6.numberField")}
                </Label>
              </InlineStack>
            )}
          </BlockStack>
        </FormLayout>
        <br />
        <FormLayout>
          <InlineStack>
            <Text fontWeight="bold">
              {t("SkuGenerate.basicRules.layout.heading")}
            </Text>
          </InlineStack>
          <SkuLayout
            layoutOrder={layoutOrder}
            setLayoutOrder={setLayoutOrder}
          />
        </FormLayout>
      </Card>
      <br />
      <Card>
        <Text fontWeight="bold" variant="headingLg">
          {t("SkuGenerate.conditionConfiguration.heading")}
        </Text>
        <div style={{ marginTop: "10px" }} />
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
                // handleUpgradePlanModal={handleUpgradePlanModal}
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
                  <Icon source={ExitIcon} color="critical" />
                </div>
              )}
            </div>
          ))}
          <InlineStack align="center">
            <Button
              plain
              onClick={
                proPlan
                  ? addNewCondition
                  : setUpgradeModal((upgradeModal) => !upgradeModal)
              }
            >
              + {t("SkuGenerate.conditionConfiguration.action")}
            </Button>
          </InlineStack>
        </FormLayout>
      </Card>
      <br />
      <Card>
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
        <div style={{ marginTop: "10px" }} />
        <FormLayout>
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
              onChange={() => setDelimetersPosition(!delimetersPosition)}
            />
          </InlineStack>
        </FormLayout>
        <div style={{ marginTop: "10px" }} />
        <FormLayout>
          <InlineStack align="space-around">
            <BlockStack>
              <Text variation="strong">
                {t("SkuGenerate.separator.productVendor.heading")}
              </Text>
              <Popover
                active={popoverActive}
                activator={activator}
                onClose={togglePopoverActive}
                sectioned
              >
                <InlineStack vertical>
                  <InlineStack fill>
                    <RadioButton
                      label={t("SkuGenerate.separator.productVendor.line1")}
                      checked={selected === 0}
                      id="not_used"
                      name="vendor"
                      onChange={() => setSelected(0)}
                    />
                  </InlineStack>
                  <InlineStack fill>
                    <RadioButton
                      label={t("SkuGenerate.separator.productVendor.line2")}
                      checked={selected === 1}
                      id="first_char"
                      name="vendor"
                      onChange={() => setSelected(1)}
                    />
                  </InlineStack>
                  <InlineStack fill>
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
                </InlineStack>
              </Popover>
            </BlockStack>
            <BlockStack alignment="center">
              <Text variation="strong">
                {t("SkuGenerate.separator.productType.heading")}
              </Text>
              <Popover
                active={popoverActive2}
                activator={second_activator}
                onClose={secondTogglePopoverActive}
                sectioned
              >
                <InlineStack vertical>
                  <InlineStack fill>
                    <RadioButton
                      label={t("SkuGenerate.separator.productType.line1")}
                      checked={selectedType === 0}
                      id="not_used"
                      name="product_type"
                      onChange={() => setSelectedType(0)}
                    />
                  </InlineStack>
                  <InlineStack fill>
                    <RadioButton
                      label={t("SkuGenerate.separator.productType.line2")}
                      checked={selectedType === 1}
                      id="first_char"
                      name="product_type"
                      onChange={() => setSelectedType(1)}
                    />
                  </InlineStack>
                  <InlineStack fill>
                    <RadioButton
                      label={t("SkuGenerate.separator.productType.line3")}
                      checked={selectedType === 2}
                      id="first_2_char"
                      name="product_type"
                      onChange={() => setSelectedType(2)}
                    />
                  </InlineStack>
                  <InlineStack fill>
                    <RadioButton
                      label={t("SkuGenerate.separator.productType.line4")}
                      checked={selectedType === 3}
                      id="first_3_char"
                      name="product_type"
                      onChange={() => setSelectedType(3)}
                    />
                  </InlineStack>
                  <InlineStack fill>
                    <RadioButton
                      label={t("SkuGenerate.separator.productType.line5")}
                      checked={selectedType === 4}
                      id="first_4_char"
                      name="product_type"
                      onChange={() => setSelectedType(4)}
                    />
                  </InlineStack>
                </InlineStack>
              </Popover>
            </BlockStack>
          </InlineStack>
          <div style={{ marginTop: "1em" }}>
            <InlineStack align="space-between">
              <Text variation="strong">
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
                label={t("SkuGenerate.products.label2.option5")}
                checked={makeAllCapital}
                onChange={setMakeAllCapital}
              />
            </InlineStack>
          </div>
        </FormLayout>
      </Card>
      <div style={{ margin: "10px" }}>
        <InlineStack align="center" gap={"500"}>
          <Button onClick={handleModal}>
            {t("AutomatedSku.preference.createNewPreference.button1")}
          </Button>
          <Button variant="primary" onClick={createNewRule} loading={loading}>
            {t("AutomatedSku.preference.createNewPreference.button2")}
          </Button>
        </InlineStack>
      </div>
    </div>
  );
}

export default NewPreference;
