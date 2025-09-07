import React, { useEffect } from "react";
import felixImage from "../../assets/felix.jpeg";
import thumbnailImage from "../../assets/Thumbnail.webp";
import { BlockStack, MediaCard, Text, VideoThumbnail } from "@shopify/polaris";

function Instruction({ state, setNext }) {
    
  useEffect(() => {
    setNext(true);
  }, [state]);

  return (
    <BlockStack>
      <MediaCard
        title="Walkthrough video 🔍"
        primaryAction={{
          content: "Watch video",
          url: "https://www.youtube.com/watch?v=VbpS6_UhV9I",
        }}
        description="Watch this walkthrough video for a better undestanding of the app and how to use it."
      >
        <VideoThumbnail videoLength={202} thumbnailUrl={thumbnailImage} />
      </MediaCard>
      <MediaCard
        title="Get a Free CRO Audit Report ✨"
        primaryAction={{
          content: "Book a Slot",
          url: "https://bit.ly/free-cro-audit-abfinal",
        }}
        description={
          <Text as="p">
            Led by <b>Felix Josemon</b> & team, who have generated over{" "}
            <b>$150,000+</b> through <b>A/B Testing</b> and <b>CRO</b> for
            various brands.
          </Text>
        }
      >
        <VideoThumbnail thumbnailUrl={felixImage} />
      </MediaCard>
    </BlockStack>
  );
}

export default Instruction;
