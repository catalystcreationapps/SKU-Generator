import React from "react";
import { FormLayout, Select, TextField } from "@shopify/polaris";
import { useTranslation } from "react-i18next";

function ConditionBased({
  index,
  condition,
  handleSelectChange,
  setValueToMatch,
  setValueToAdd,
  proPlan,
  handleUpgradePlanModal,
}) {
  const { t } = useTranslation();
  const options = [
    {
      label: t("SkuGenerate.conditionConfiguration.column1.option1"),
      value: "",
    },
    {
      label: t("SkuGenerate.conditionConfiguration.column1.option2"),
      value: "product_title",
    },
    {
      label: t("SkuGenerate.conditionConfiguration.column1.option3"),
      value: "product_vendor",
    },
    {
      label: t("SkuGenerate.conditionConfiguration.column1.option4"),
      value: "product_type",
    },
    {
      label: t("SkuGenerate.conditionConfiguration.column1.option5"),
      value: "product_tag",
    },
  ];

  return (
    <>
      <FormLayout.Group condensed>
        <Select
          id="1"
          label={t("SkuGenerate.conditionConfiguration.column1.label")}
          options={options}
          onChange={(value) =>
            proPlan
              ? handleSelectChange(value, index)
              : handleUpgradePlanModal()
          }
          value={condition.selectedField}
          helpText={t("SkuGenerate.conditionConfiguration.column1.helpText")}
        />
        <TextField
          id="2"
          type="text"
          label={t("SkuGenerate.conditionConfiguration.column2.label")}
          helpText={t("SkuGenerate.conditionConfiguration.column2.helpText")}
          value={condition.valueToMatch}
          prefix={t("SkuGenerate.conditionConfiguration.column2.prefix")}
          onChange={(value) =>
            proPlan ? setValueToMatch(value, index) : handleUpgradePlanModal()
          }
          autoComplete="off"
        />
        <TextField
          id="3"
          type="text"
          label={t("SkuGenerate.conditionConfiguration.column3.label")}
          helpText={t("SkuGenerate.conditionConfiguration.column3.helpText")}
          value={condition.valueToAdd}
          prefix={t("SkuGenerate.conditionConfiguration.column3.prefix")}
          onChange={(value) =>
            proPlan ? setValueToAdd(value, index) : handleUpgradePlanModal()
          }
          autoComplete="off"
        />
      </FormLayout.Group>
    </>
  );
}

export default ConditionBased;
