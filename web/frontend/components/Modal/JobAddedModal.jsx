import { InlineStack, Link, Modal } from "@shopify/polaris";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./ProgressModal.css";
import Confetti from "react-confetti";
import ReactStars from "react-rating-stars-component";
import { useNavigate } from "react-router-dom";

function JobAddedModal({
  active,
  setActive,
  isFetching,
  fetchError,
  errorMessage,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [countDown, setCountdown] = useState(10);

  useEffect(() => {
    if (!isFetching) {
      setCountdown(10);
      const intervalId = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [isFetching]);

  useEffect(() => {
    if (countDown === 0) {
      reset();
    }
  }, [countDown, setActive]);

  const ratingChanged = (newRating) => {
    if (newRating > 3) {
      window.open(
        "https://apps.shopify.com/sku-code-generator#modal-show=WriteReviewModal"
      );
    } else {
      window.open(
        "https://docs.google.com/forms/d/e/1FAIpQLSc-vO4AvGY47hdp4C8hXhVa89W6_PXxkmTgImbTjMmSid5bvQ/viewform"
      );
    }
  };

  const reset = () => {
    setActive(false);
    // setProgressValue(0);
  };

  return (
    <Modal open={active} size="small">
      {isFetching ? (
        <Modal.Section>
          <p className="conatiner-text">
            {t("SkuGenerate.buttons.modal.processing.heading")}
          </p>
          <div className="conatiner">
            <p className="conatiner-text-small">
              {t("SkuGenerate.buttons.modal.processing.content")}
            </p>
          </div>
        </Modal.Section>
      ) : (
        <>
          {fetchError ? (
            errorMessage ? (
              <Modal.Section>
                <p className="container-heading" style={{ color: "#f11111" }}>
                  {t("SkuGenerate.buttons.modal.error.heading")}
                </p>
                <p className="conatiner-text">
                  {t(errorMessage)}
                  <p style={{ fontSize: "12px" }}>
                    {t("SkuGenerate.buttons.modal.helpUrl.line1")}{" "}
                    <a
                      href="https://appsfinal.freshdesk.com/support/tickets/new"
                      target="_blank"
                    >
                      {t("SkuGenerate.buttons.modal.helpUrl.line2")}
                    </a>{" "}
                    {t("SkuGenerate.buttons.modal.helpUrl.line3")}
                  </p>
                </p>
              </Modal.Section>
            ) : (
              <Modal.Section>
                <p className="container-heading" style={{ color: "#f11111" }}>
                  {t("SkuGenerate.buttons.modal.error.heading")}
                </p>
                <p className="conatiner-text">
                  {t("SkuGenerate.buttons.modal.error.content")}
                  <p style={{ fontSize: "12px" }}>
                    {t("SkuGenerate.buttons.modal.helpUrl.line1")}{" "}
                    <a
                      href="https://appsfinal.freshdesk.com/support/tickets/new"
                      target="_blank"
                    >
                      {t("SkuGenerate.buttons.modal.helpUrl.line2")}
                    </a>{" "}
                    {t("SkuGenerate.buttons.modal.helpUrl.line3")}
                  </p>
                </p>
              </Modal.Section>
            )
          ) : (
            <Modal.Section>
              <div className="conatiner">
                <img
                  style={{ width: "100px", height: "100px" }}
                  src="https://res.cloudinary.com/dupfwiwnp/image/upload/v1680424179/pngwing.com_ysnmnu.png"
                />
                {!isFetching && <Confetti width={370} height={320} />}
              </div>
              <p className="container-heading" style={{ color: "#0EBE04" }}>
                {t("SkuGenerate.buttons.modal.success.heading")}
              </p>
              <p className="conatiner-text">
                {t("SkuGenerate.buttons.modal.success.content")}
              </p>
              <InlineStack align="center">
                <Link onClick={() => navigate("/progress-page")}>
                  {t("SkuGenerate.buttons.modal.redirect")}
                </Link>
              </InlineStack>
              <div className="conatiner">
                <div style={{ padding: "20px" }}>
                  <ReactStars
                    count={5}
                    onChange={ratingChanged}
                    size={24}
                    activeColor="#ffd700"
                  />
                </div>
              </div>
              <p className="conatiner-text">
                {t("SkuGenerate.buttons.modal.closes")}
                {countDown}
                {t("SkuGenerate.buttons.modal.time")}
              </p>
            </Modal.Section>
          )}
        </>
      )}
    </Modal>
  );
}

export default JobAddedModal;
