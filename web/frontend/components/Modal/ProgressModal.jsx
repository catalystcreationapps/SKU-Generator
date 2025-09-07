import React, { useCallback, useState, useEffect } from "react";
import { Button, Modal } from "@shopify/polaris";
import "./ProgressModal.css";
import Confetti from "react-confetti";
// import ConfettiExplosion from "react-confetti-explosion";
import ReactStars from "react-rating-stars-component";
import { ProgressBar } from "@shopify/polaris";
import { useTranslation } from "react-i18next";

function ProgressModal({
  active,
  setActive,
  progressValue,
  queuePosition,
  setProgressValue,
  isFetching,
  fetchError,
  errorMessage,
}) {
  const [countDown, setCountdown] = useState(10);
  const { t } = useTranslation();

  // useEffect(() => {
  //   if (isFetching) {
  //     setEstimatedCounter(estimatedTime);
  //     let percentage = 100 / estimatedTime;
  //     setProgressValue(percentage);
  //     const intervalId = setInterval(() => {
  //       setEstimatedCounter((prevCountdown) =>
  //         prevCountdown != 0 ? prevCountdown - 1 : 0
  //       );
  //       setProgressValue((prevValue) => prevValue + percentage);
  //     }, 1000);
  //     return () => clearInterval(intervalId);
  //   }
  // }, [estimatedTime]);

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
        " https://apps.shopify.com/sku-code-generator#modal-show=WriteReviewModal"
      );
    } else {
      window.open(
        "https://docs.google.com/forms/d/e/1FAIpQLSc-vO4AvGY47hdp4C8hXhVa89W6_PXxkmTgImbTjMmSid5bvQ/viewform"
      );
    }
  };

  const reset = () => {
    setActive(false);
    setProgressValue(0);
  };

  return (
    <>
      <div style={{ height: "130px" }}>
        <style>{`.Polaris-Modal-CloseButton { display: none; }`}</style>
        <Modal open={active} size="small">
          {isFetching ? (
            <Modal.Section>
              <p className="conatiner-text">{t("Modal.cardTitle")}</p>
              <div className="conatiner">
                <ProgressBar animated progress={progressValue} />
                <p className="conatiner-text-small">
                  {/* {t("Modal.counterLine")}{progressValue.toFixed(2)}{t("Modal.time")} */}
                  {queuePosition !== 0 && (
                    <p>{`You are currently in the queue at position ${queuePosition}. Please wait while we process your request.`}</p>
                  )}
                  <br />
                  {progressValue.toFixed(2)}% Completed
                </p>
              </div>
            </Modal.Section>
          ) : (
            <>
              {fetchError ? (
                errorMessage ? (
                  <Modal.Section>
                    <p
                      className="container-heading"
                      style={{ color: "#f11111" }}
                    >
                      {t("Modal.error.heading")}
                    </p>
                    <p className="conatiner-text">
                      {t(errorMessage)}
                      <p style={{ fontSize: "12px" }}>
                        Having issues?{" "}
                        <a
                          href="https://appsfinal.freshdesk.com/support/tickets/new"
                          target="_blank"
                        >
                          Raise a ticket
                        </a>{" "}
                        to report problems. Our support team will promptly
                        assist you
                      </p>
                    </p>
                  </Modal.Section>
                ) : (
                  <Modal.Section>
                    <p
                      className="container-heading"
                      style={{ color: "#f11111" }}
                    >
                      {t("Modal.error.heading")}
                    </p>
                    <p className="conatiner-text">
                      {t("Modal.error.message")}
                      <p style={{ fontSize: "12px" }}>
                        Having issues?{" "}
                        <a
                          href="https://appsfinal.freshdesk.com/support/tickets/new"
                          target="_blank"
                        >
                          Raise a ticket
                        </a>{" "}
                        to report problems. Our support team will promptly
                        assist you
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
                    {!isFetching && <Confetti width={360} height={320} />}
                  </div>
                  <p className="container-heading" style={{ color: "#0EBE04" }}>
                    {t("Modal.success.heading")}
                  </p>
                  <p className="conatiner-text">
                    {t("Modal.success.message")}
                    {t("Modal.success.suffixLine")}
                  </p>
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
                    {t("Modal.closes")}
                    {countDown}
                    {t("Modal.time")}
                  </p>
                </Modal.Section>
              )}
            </>
          )}
        </Modal>
      </div>
    </>
  );
}

export default ProgressModal;
