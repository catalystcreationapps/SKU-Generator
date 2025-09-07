import React, { useEffect } from "react";
import { Card, FormLayout, TextField } from "@shopify/polaris";

function StoreDetails({ setNext, state, setState }) {
  useEffect(() => {
    if (state.email.trim() && state.phone.trim() && state.businessName.trim())
      setNext(true);
    else setNext(false);
  }, [state]);

  return (
    <Card>
      <FormLayout>
        <TextField
          label="Business name"
          type="text"
          placeholder="My store"
          value={state.businessName}
          onChange={(value) => setState({ ...state, businessName: value })}
        />
        <TextField
          label="Contact email"
          type="email"
          placeholder="eample@example.com"
          value={state.email}
          onChange={(value) => setState({ ...state, email: value })}
        />
        <TextField
          label="Contact number"
          type="tel"
          placeholder="00000-00000"
          value={state.phone}
          onChange={(value) => setState({ ...state, phone: value })}
        />
      </FormLayout>
    </Card>
  );
}

export default StoreDetails;
