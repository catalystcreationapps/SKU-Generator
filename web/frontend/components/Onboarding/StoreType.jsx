import React, { useEffect, useState } from "react";
import { Card, ChoiceList, FormLayout, TextField } from "@shopify/polaris";

function StoreType({ setNext, state, setState }) {
  const [dev, setDev] = useState(state.devStore ? "yes" : "no");

  useEffect(() => {
    setState((prevState) => ({
      ...prevState,
      devStore: dev === "yes",
    }));
    setNext(true);
  }, [dev]);

  return (
    <Card>
      <FormLayout>
        <ChoiceList
          title="Is this a development store?"
          choices={[
            { label: "No, it's a live store", value: "no" },
            { label: "Yes, it's a development store", value: "yes" },
          ]}
          selected={dev}
          onChange={(value) => setDev(value)}
        />
      </FormLayout>
    </Card>
  );
}

export default StoreType;
