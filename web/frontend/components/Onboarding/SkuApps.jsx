import React, { useState, useEffect } from "react";
import { Card, ChoiceList, FormLayout, TextField } from "@shopify/polaris";

function SkuApps({ setNext, state, setState }) {
  const [tool, setTool] = useState(state.otherUsedApps);
  const [other, setOther] = useState("");

  useEffect(() => {
    // get the text field value if user chose: other
    let value = tool[0];
    if (tool == "other") value = other;

    if (value.trim()) setNext(true);
    else setNext(false);

    setState({ ...state, otherUsedApps: value });
  }, [tool, other]);

  return (
    <Card>
      <FormLayout>
        <ChoiceList
          title="Has your store previously utilized any SKU generating applications?"
          choices={[
            { label: "None", value: "none" },
            { label: "EasyScan: SKU & Barcode", value: "easyscan" },
            { label: "SKUGen", value: "skugen" },
            { label: "Easy SKU and Barcode Generator", value: "EasySKUandBarcodeGenerator" },
            { label: "SKU IQ for TikTok Shop or POS", value: "SKUIQforTikTokShoporPOS" },
            { label: "Other", value: "other" },
          ]}
          selected={tool}
          onChange={(value) => setTool(value)}
        />
        {tool == "other" && (
          <TextField
            label="Name of the tool"
            type="text"
            value={other}
            onChange={(value) => setOther(value)}
          />
        )}
      </FormLayout>
    </Card>
  );
}

export default SkuApps;
