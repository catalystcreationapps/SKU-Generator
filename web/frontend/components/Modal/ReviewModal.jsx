import React from "react";
import { Modal, Button } from "@shopify/polaris";
import ReactStars from "react-rating-stars-component";
import { useTranslation } from "react-i18next";

function ReviewModal({ active, setActive }) {
  const { t } = useTranslation();
  const ratingChanged = (newRating) => {
    if (newRating > 3) {
      window.open(
        " https://apps.shopify.com/sku-code-generator#modal-show=WriteReviewModal"
      );
    } else {
      window.open(
        "https://docs.google.com/forms/d/e/1FAIpQLSc-vO4AvGY47hdp4C8hXhVa89W6_PXxkmTgImbTjMmSid5bvQ/viewform"
      );
    }
    setActive(false);
  };

  return (
    <Modal open={active} size="small" onClose={() => setActive(false)}>
      <Modal.Section>
        <div className="">
          <div style={{ padding: "20px", textAlign: "center" }}>
            <h2 style={{ fontWeight: "bold" }}>
              {t("Dashboard.askReviewBanner.modal.heading")}
            </h2>
            <p style={{ marginTop: "10px" }}>
              {t("Dashboard.askReviewBanner.modal.subHeading")}
            </p>
            <div
              style={{
                padding: "20px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <ReactStars
                count={5}
                onChange={ratingChanged}
                size={24}
                activeColor="#ffd700"
              />
            </div>
            <p>{t("Dashboard.askReviewBanner.modal.content.line1")}</p>
            <p style={{ marginBottom: "10px" }}>
              {t("Dashboard.askReviewBanner.modal.content.line2")}
            </p>
            <Button variant="primary" onClick={() => setActive(false)}>
              {t("Dashboard.askReviewBanner.modal.cancel")}
            </Button>
          </div>
        </div>
      </Modal.Section>
    </Modal>
  );
}

export default ReviewModal;
