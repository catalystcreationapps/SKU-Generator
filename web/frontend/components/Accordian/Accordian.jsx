import React, { useState, useCallback, useEffect } from "react";
import {
  Layout,
  Card,
  FormLayout,
  TextField,
  TextContainer,
  Button,
  Icon,
  Modal,
  InlineStack,
  RadioButton,
  Checkbox,
  Popover,
  ButtonGroup,
  Tooltip,
  Text,
  BlockStack,
  Label,
  Collapsible,
} from "@shopify/polaris";
import { useTranslation } from "react-i18next";
import { useAuthenticatedFetch } from "@shopify/app-bridge-react";
import {
  DeleteIcon,
  HideIcon,
  ViewIcon,
  XSmallIcon,
  StatusActiveIcon,
  ButtonIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  SaveIcon,
} from "@shopify/polaris-icons";
import SkuLayout from "../SKULayout/Layout";
import ConditionBased from "../ConditionBased/ConditionBased";
import "./Accordian.css";

function Accordian({
  item,
  index,
  shopId,
  setUpdated,
  appliedPreference,
  toggleActive,
  toggleActiveForDelete,
  toggleActiveForApply,
  setListOfPreference,
  listOfPreference,
  proPlan,
  setAppliedPreference,
}) {
  if (!appliedPreference && index === 0) {
    appliedPreference = item._id;
  }
  const { t } = useTranslation();
  const fetch = useAuthenticatedFetch();
  const [activeIndex, setActiveIndex] = useState(-1);
  const [layoutOrder, setLayoutOrder] = useState(item.layoutOrder);
  const [basicRules, setBasicRules] = useState({
    head: item.basicRules.head,
    body: item.basicRules.body,
    tail: item.basicRules.tail,
  });
  const [separator, setSeparator] = useState(item.separator);
  const [delimeters, setDelimeters] = useState(item.delimeters);
  const [popoverActive, setPopoverActive] = useState(false);
  const [popoverActive2, setPopoverActive2] = useState(false);
  const [delimetersPosition, setDelimetersPosition] = useState(
    item.delimetersPosition
  );
  const [applyToEmpty, setApplyToEmpty] = useState(item.applyToEmpty);
  const [removeSpace, setRemoveSpace] = useState(item.removeSpace);
  const [makeAllCapital, setMakeAllCapital] = useState(item.makeAllCapital);
  const [productVariant, setProductVariant] = useState(item.productVariant);
  const [selected, setSelected] = useState(item.selected);
  const [selectedType, setSelectedType] = useState(item.selectedType);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [icon, setIcon] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [conditions, setConditions] = useState(item.conditions);
  const [productTitleInclude, setProductTitleInclude] = useState(
    item.productTitleInclude
  );
  const [bodyNumberType, setBodyNumberType] = useState(
    item?.bodyNumberType?.bodyNumberType
  );
  const [randomNumberLength, setRandomNumberLength] = useState(
    item?.bodyNumberType?.randomNumberLength
  );
  const [open, setOpen] = useState(false);

  const handleClick = (index) => {
    setActiveIndex(index === activeIndex ? -1 : index);
    setIcon((icon) => !icon);
  };

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

  const handleChange = useCallback((_, newValue) => {
    setBodyNumberType(newValue);
  }, []);

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

  useEffect(() => {
    if (item) {
      const isDataChanged =
        item.layoutOrder !== layoutOrder ||
        item.basicRules.head !== basicRules.head ||
        item.basicRules.body !== basicRules.body ||
        item.basicRules.tail !== basicRules.tail ||
        item.separator !== separator ||
        item.delimeters !== delimeters ||
        item.delimetersPosition !== delimetersPosition ||
        item.applyToEmpty !== applyToEmpty ||
        item.removeSpace !== removeSpace ||
        item.makeAllCapital !== makeAllCapital ||
        item?.bodyNumberType?.bodyNumberType !== bodyNumberType ||
        item?.bodyNumberType?.randomNumberLength !== randomNumberLength ||
        item.productVariant !== productVariant ||
        item.selected !== selected ||
        item.selectedType !== selectedType ||
        item.conditions !== conditions ||
        item.productTitleInclude !== productTitleInclude ||
        false;
      setIsChanged(isDataChanged);
    }
  }, [
    item,
    layoutOrder,
    basicRules,
    separator,
    delimeters,
    delimetersPosition,
    applyToEmpty,
    removeSpace,
    makeAllCapital,
    bodyNumberType,
    randomNumberLength,
    productVariant,
    selected,
    selectedType,
    conditions,
    productTitleInclude,
  ]);

  const handleDeleteModal = (id) => {
    setSelectedId(id);
    setOpenModal(true);
  };

  const handleDelete = async (selectedId) => {
    setLoading(true);
    if (shopId && selectedId) {
      const res = await fetch(
        `/api/remove-skupreference/${shopId}/${selectedId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      const resp = await res.json();
      if (resp.success) {
        setListOfPreference(
          [...listOfPreference].filter((x) => x._id !== resp.selectedId)
        );
        setUpdated((updated) => !updated);
        toggleActiveForDelete();
      }
      setLoading(false);
    }
  };

  const handleApply = async (selectedId) => {
    setApplying(true);
    if (shopId && selectedId) {
      const res = await fetch(
        `/api/apply-skupreference/${shopId}/${selectedId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      const resp = await res.json();
      if (resp.success) {
        setAppliedPreference(resp.selectedId);
        toggleActiveForApply();
      }
      setApplying(false);
    }
  };

  const handleEdit = async (preferenceId) => {
    try {
      setLoading(true);
      fetch(`/api/edit-skupreference/${shopId}/${preferenceId}`, {
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
          setUpdated((updated) => !updated);
          setLoading(false);
          toggleActive();
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

  const handleProductTitleInclude = (value) => {
    setProductTitleInclude(value);
  };

  const handleToggle = useCallback(() => {
    setOpen((open) => !open);
    setIcon((icon) => !icon);
  }, []);

  return (
    <div style={{ width: "95%", marginBottom: "15px" }}>
      <Card key={item}>
        <InlineStack align="space-between">
          <p style={{ fontSize: "17px", fontWeight: "600" }}>
            {index + 1}. {t("AutomatedSku.preference.heading")}
          </p>
          <div style={{ display: "flex", gap: "30px" }}>
            <div style={{ alignSelf: "center" }}>
              <Button
                variant="monochromePlain"
                disabled={!proPlan}
                onClick={handleToggle}
                ariaExpanded={open}
                ariaControls="basic-collapsible"
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <div style={{ width: "23px", height: "23px" }}>
                    {icon ? <HideIcon /> : <ViewIcon />}
                  </div>
                  <p style={{ fontSize: "15px" }}>
                    {icon
                      ? t(
                          "AutomatedSku.preference.accordion.hideOrView.content1"
                        )
                      : t(
                          "AutomatedSku.preference.accordion.hideOrView.content2"
                        )}
                  </p>
                </div>
              </Button>
            </div>
            <div style={{ alignSelf: "center" }}>
              <Tooltip
                content={
                  appliedPreference === item._id
                    ? t(
                        "AutomatedSku.preference.accordion.apply.tooltipContent1"
                      )
                    : t(
                        "AutomatedSku.preference.accordion.apply.tooltipContent2"
                      )
                }
                preferredPosition="above"
                dismissOnMouseOut
              >
                <Button
                  variant="monochromePlain"
                  loading={applying}
                  disabled={applying || !proPlan}
                  onClick={() =>
                    appliedPreference !== item._id
                      ? handleApply(item._id)
                      : null
                  }
                  pressed={appliedPreference === item._id}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <div style={{ width: "23px", height: "23px" }}>
                      {appliedPreference === item._id ? (
                        <StatusActiveIcon />
                      ) : (
                        <ButtonIcon />
                      )}
                    </div>
                    <p style={{ fontSize: "15px" }}>
                      {appliedPreference === item._id
                        ? t("AutomatedSku.preference.accordion.apply.content1")
                        : t("AutomatedSku.preference.accordion.apply.content2")}
                    </p>
                  </div>
                </Button>
              </Tooltip>
            </div>
            <div style={{ alignSelf: "center" }}>
              <Button
                variant="monochromePlain"
                disabled={loading || !proPlan}
                loading={loading}
                primary={isChanged}
                onClick={() => {
                  isChanged
                    ? handleEdit(item._id)
                    : handleDeleteModal(item._id);
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <div style={{ width: "23px", height: "23px" }}>
                    {!isChanged ? <DeleteIcon /> : <SaveIcon />}
                  </div>
                  <p style={{ fontSize: "15px" }}>
                    {isChanged
                      ? t("AutomatedSku.preference.accordion.delete.content1")
                      : t("AutomatedSku.preference.accordion.delete.content2")}
                  </p>
                </div>
              </Button>
            </div>
            <div style={{ alignSelf: "center" }} onClick={handleToggle}>
              <div style={{ width: "23px", height: "23px" }}>
                {icon ? <ChevronDownIcon /> : <ChevronLeftIcon />}
              </div>
            </div>
          </div>
        </InlineStack>
        <Collapsible
          open={open}
          id="basic-collapsible"
          transition={{ duration: "500ms", timingFunction: "ease-in-out" }}
          // key={bodyNumberType}
        >
          <div style={{ marginTop: "20px" }}>
            <p style={{ fontSize: "17px", fontWeight: "600" }}>
              {t("SkuGenerate.basicRules.heading")}
            </p>
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
                  helpText={t("SkuGenerate.basicRules.column3.helpText")}
                  value={basicRules.tail}
                  onChange={(value) => handleBasicRules("tail", value)}
                  autoComplete="off"
                />
              </FormLayout.Group>
              <BlockStack>
                <RadioButton
                  label={t("SkuGenerate.basicRules.radioButtons.option1.label")}
                  helpText={t(
                    "SkuGenerate.basicRules.radioButtons.option1.helpText"
                  )}
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
                      {t(
                        "SkuGenerate.basicRules.radioButtons.option6.numberField"
                      )}
                    </Label>
                  </InlineStack>
                )}
              </BlockStack>
            </FormLayout>
            <br />
            <FormLayout>
              <InlineStack>
                <p style={{ fontSize: "17px", fontWeight: "600" }}>
                {t("SkuGenerate.basicRules.layout.heading")}
                </p>
              </InlineStack>
              <SkuLayout
                layoutOrder={layoutOrder}
                setLayoutOrder={setLayoutOrder}
              />
            </FormLayout>
            <p
              style={{ fontSize: "17px", fontWeight: "600", marginTop: "20px" }}
            >
              {t("SkuGenerate.conditionConfiguration.heading")}
            </p>
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
            <p
              style={{ fontSize: "17px", fontWeight: "600", marginTop: "20px" }}
            >
              {t("SkuGenerate.separator.heading")}
            </p>
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
            <div style={{ marginTop: "5px" }} />
            <FormLayout>
              <InlineStack align="space-between">
                <Text fontWeight="medium">
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
            <FormLayout>
              <InlineStack align="space-between">
                <BlockStack gap={"200"}>
                  <Text fontWeight="medium">
                  {t("SkuGenerate.separator.productVendor.heading")}
                  </Text>
                  <Popover
                    active={popoverActive}
                    activator={activator}
                    onClose={togglePopoverActive}
                    sectioned
                  >
                    <BlockStack>
                      <RadioButton
                        label={t("SkuGenerate.separator.productVendor.line1")}
                        checked={selected === 0}
                        id="not_used"
                        name="vendor"
                        onChange={() => setSelected(0)}
                      />
                      <RadioButton
                        label={t("SkuGenerate.separator.productVendor.line2")}
                        checked={selected === 1}
                        id="first_char"
                        name="vendor"
                        onChange={() => setSelected(1)}
                      />
                      <RadioButton
                        label={t("SkuGenerate.separator.productVendor.line3")}
                        checked={selected === 2}
                        id="first_2_char"
                        name="vendor"
                        onChange={() => setSelected(2)}
                      />
                      <RadioButton
                        label={t("SkuGenerate.separator.productVendor.line4")}
                        checked={selected === 3}
                        id="first_3_char"
                        name="vendor"
                        onChange={() => setSelected(3)}
                      />
                      <RadioButton
                        label={t("SkuGenerate.separator.productVendor.line5")}
                        checked={selected === 4}
                        id="first_4_char"
                        name="vendor"
                        onChange={() => setSelected(4)}
                      />
                    </BlockStack>
                  </Popover>
                </BlockStack>
                <BlockStack gap={"200"}>
                  <Text fontWeight="medium">
                  {t("SkuGenerate.separator.productType.heading")}
                  </Text>
                  <Popover
                    active={popoverActive2}
                    activator={second_activator}
                    onClose={secondTogglePopoverActive}
                    sectioned
                  >
                    <BlockStack>
                      <RadioButton
                        label={t("SkuGenerate.separator.productType.line1")}
                        checked={selectedType === 0}
                        id="not_used"
                        name="product_type"
                        onChange={() => setSelectedType(0)}
                      />
                      <RadioButton
                        label={t("SkuGenerate.separator.productType.line2")}
                        checked={selectedType === 1}
                        id="first_char"
                        name="product_type"
                        onChange={() => setSelectedType(1)}
                      />
                      <RadioButton
                        label={t("SkuGenerate.separator.productType.line3")}
                        checked={selectedType === 2}
                        id="first_2_char"
                        name="product_type"
                        onChange={() => setSelectedType(2)}
                      />
                      <RadioButton
                        label={t("SkuGenerate.separator.productType.line4")}
                        checked={selectedType === 3}
                        id="first_3_char"
                        name="product_type"
                        onChange={() => setSelectedType(3)}
                      />
                      <RadioButton
                        label={t("SkuGenerate.separator.productType.line5")}
                        checked={selectedType === 4}
                        id="first_4_char"
                        name="product_type"
                        onChange={() => setSelectedType(4)}
                      />
                    </BlockStack>
                  </Popover>
                </BlockStack>
              </InlineStack>
              <div>
                <InlineStack align="space-between">
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
                    label={t("SkuGenerate.products.label2.option5")}
                    checked={makeAllCapital}
                    onChange={setMakeAllCapital}
                  />
                </InlineStack>
              </div>
            </FormLayout>
          </div>
        </Collapsible>
      </Card>
      <Modal
        open={openModal}
        title={t("AutomatedSku.preference.accordion.modal.heading")}
        onClose={() => setOpenModal(false)}
        primaryAction={{
          content: t("AutomatedSku.preference.accordion.modal.delete"),
          destructive: "Delete",
          onAction: () => handleDelete(selectedId),
          loading: loading,
        }}
        secondaryActions={[
          {
            content: t("AutomatedSku.preference.accordion.modal.cancel"),
            onAction: () => {
              setOpenModal(false);
            },
          },
        ]}
      >
        <Modal.Section>
          <TextContainer>
            <p>{t("AutomatedSku.preference.accordion.modal.content")}</p>
          </TextContainer>
        </Modal.Section>
      </Modal>
    </div>
  );
}

export default Accordian;
