import { Frame, Page } from "@shopify/polaris";
import React from "react";

function Help() {
  return (
    <Frame>
      <Page>
        <iframe
          style={{ width: "100%", height: "100vh" }}
          sandbox
          allowfullscreen
          frameBorder="0"
          src="https://appsfinal.freshdesk.com/support/solutions/categories/82000473558/folders/82000696438"
        />
      </Page>
    </Frame>
  );
}

export default Help;
