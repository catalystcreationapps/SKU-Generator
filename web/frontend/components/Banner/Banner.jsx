import { Card, Link, InlineStack, MediaCard } from "@shopify/polaris";
import React from "react";
import { useNavigate } from "@shopify/app-bridge-react";
import "./Banner.css";
import felix from "../../assets/felix.jpeg";

function BannerOffer({ banner, setBanner, currentPlan }) {
  const navigate = useNavigate();
  return (
    <div style={{ width: "100%", display: "flex", gap: "10px" }}>
      <div style={{ width: "49%" }}>
        <Card padding={"200"}>
          <p className="banner-title">
            ⚡ Unlock Unlimited SKU Generations! ⚡
          </p>
          <p className="banner-text">Limited time offer on our app!</p>
          <div className="container" style={{ marginRight: "5px" }}>
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: "500",
              }}
            >
              OFFER CLOSES IN :
            </span>
            <div>
              <span className="countdown-label days-label">Days</span>
              <span className="countdown-label hours-label">Hours</span>
              <span className="countdown-label minutes-label">Minutes</span>
              <span className="countdown-label seconds-label">Seconds</span>
            </div>
            <div className="countdown-value-container">
              <span
                className="countdown-value"
                id="days"
                style={{ fontWeight: "bold" }}
              ></span>
              <span className="countdown-separator">:</span>
              <span
                className="countdown-value"
                id="hours"
                style={{ fontWeight: "bold" }}
              ></span>
              <span className="countdown-separator">:</span>
              <span
                className="countdown-value"
                id="minutes"
                style={{ fontWeight: "bold" }}
              ></span>
              <span className="countdown-separator">:</span>
              <span
                className="countdown-value"
                id="seconds"
                style={{ fontWeight: "bold" }}
              ></span>
            </div>
            <Link
              onClick={() => {
                navigate("/PlansPricing");
              }}
            >
              <p style={{ marginBottom: "5px" }}>Upgrade Plan Now?</p>
            </Link>
          </div>
        </Card>
      </div>
      <div style={{ width: "50%" }}>
        <MediaCard
          size="small"
          title="Hi, I'm Felix!"
          primaryAction={{
            content: "Let's Chat",
            onAction: () => {
              const crisp = window.$crisp;
              crisp.push(["set", "message:text", ["Hi Felix, I need help!"]]);
              crisp.push(["do", "chat:toggle"]);
            },
          }}
          description="Have questions or need assistance with our app? Our friendly support team is always ready to help. We're here to ensure you have a smooth and hassle-free experience!"
        >
          <img
            alt=""
            width="100%"
            height="100%"
            style={{
              objectFit: "cover",
              objectPosition: "center",
            }}
            src={felix}
          />
        </MediaCard>
      </div>
    </div>
  );
}

export default BannerOffer;

// <InlineStack>
//   <Card>
//     <p className="banner-title">
//       ⚡ Unlock the Monthly / Yearly Plan for Unlimited SKU generations! ⚡
//     </p>
//     <p className="banner-text" style={{ marginTop: "1em" }}>
//       Get amazing offer on our app!
//     </p>
//     <p className="banner-text">
//       Save time, effort, and supercharge your store's performance.
//     </p>
//     <div className="container" style={{ marginRight: "5px" }}>
//       <span
//         style={{
//           fontSize: "1rem",
//           fontWeight: "700",
//           marginBottom: "10px",
//         }}
//       >
//         OFFER CLOSES IN :
//       </span>
//       <div>
//         <span className="countdown-label days-label">Days</span>
//         <span className="countdown-label hours-label">Hours</span>
//         <span className="countdown-label minutes-label">Minutes</span>
//         <span className="countdown-label seconds-label">Seconds</span>
//       </div>
//       <div className="countdown-value-container">
//         <span
//           className="countdown-value"
//           id="days"
//           style={{ fontWeight: "bold" }}
//         ></span>
//         <span className="countdown-separator">:</span>
//         <span
//           className="countdown-value"
//           id="hours"
//           style={{ fontWeight: "bold" }}
//         ></span>
//         <span className="countdown-separator">:</span>
//         <span
//           className="countdown-value"
//           id="minutes"
//           style={{ fontWeight: "bold" }}
//         ></span>
//         <span className="countdown-separator">:</span>
//         <span
//           className="countdown-value"
//           id="seconds"
//           style={{ fontWeight: "bold" }}
//         ></span>
//       </div>
//       <Link
//         onClick={() => {
//           navigate("/PlansPricing");
//         }}
//       >
//         <p>Upgrade Plan Now?</p>
//       </Link>
//     </div>
//   </Card>
//   <Card padding={"0"}>
//     Have questions or need assistance with our app? Our friendly support
//     team is always ready to help. We're here to ensure you have a smooth and
//     hassle-free experience!
//   </Card>
//   {/* <MediaCard
//     size="small"
//     title="Hi, I'm Felix!"
//     primaryAction={{
//       content: "Let's Chat",
//       onAction: () => {
//         const crisp = window.$crisp;
//         crisp.push(["set", "message:text", ["Hi Felix, I need help!"]]);
//         crisp.push(["do", "chat:toggle"]);
//       },
//     }}
//     description="Have questions or need assistance with our app? Our friendly support team is always ready to help. We're here to ensure you have a smooth and hassle-free experience!"
//   >
//     <img
//       alt=""
//       width="50%"
//       // height="100%"
//       style={{
//         objectFit: "cover",
//         objectPosition: "center",
//       }}
//       src={felix}
//     />
//   </MediaCard> */}
// </InlineStack>
