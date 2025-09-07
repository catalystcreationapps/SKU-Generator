import shopify from "../shopify.js";
import BillingDetailsModel from "../models/BillingDetailsModel.js";
import { checkForActiveChargesGraphqlForName } from "./billing-helpers.js";

const processProductCreation = async (shopDetails, payload, session) => {
  const billingDetails = await BillingDetailsModel.findOne({
    shopId: shopDetails.body.shop.id,
  });

  const monthlyResp = await checkForActiveChargesGraphqlForName(session);

  if (
    (monthlyResp &&
      ["Pro Monthly", "ProPlan For Smart SKU"].includes(monthlyResp.name) &&
      monthlyResp.status === "ACTIVE" &&
      billingDetails?.smartSKU?.autoSKU_on) ||
    shopDetails?.body?.shop?.myshopify_domain ===
      "fletcher-whyte-2916.myshopify.com"
  ) {
    const preferenceData = await getPreferenceData(billingDetails);

    let bodyToContinue = 0;

    if (preferenceData.bodyNumberType.bodyNumberType === "continue") {
      bodyToContinue = billingDetails.lastBodyNo
        ? billingDetails.lastBodyNo
        : 0;
    } else {
      bodyToContinue = preferenceData.basicRules.body;
    }

    const jobData = {
      session: session,
      body: {
        ...preferenceData.toObject(),
        products: [payload],
      },
      shopId: shopDetails.body.shop.id,
      bodyToContinue: bodyToContinue,
    };

    return jobData;
  }
};

const getPreferenceData = async (billingDetails) => {
  if (billingDetails?.appliedPreference) {
    const response = await BillingDetailsModel.findOne(
      { shopId: billingDetails.shopId },
      {
        skuPreference: {
          $elemMatch: { _id: billingDetails.appliedPreference },
        },
      }
    );
    return response.skuPreference[0];
  } else {
    return billingDetails.skuPreference[0];
  }
};

const incrementProductAddedInThisMonth = async (shopId) => {
  try {
    await BillingDetailsModel.updateOne(
      { shopId },
      { $inc: { addedInThisMonth: 1 } }
    );
    console.log("addedInThisMonth incremented successfully");
  } catch (err) {
    console.error("Error incrementing addedInThisMonth:", err);
  }
};

const decrementRemainingCredits = async (shopId, createdSku) => {
  try {
    await BillingDetailsModel.updateOne(
      { shopId },
      { $inc: { creditsRemaining: -createdSku } }
    );
    console.log("remainingCredits decremented successfully");
  } catch (err) {
    console.error("Error decrementing remainingCredits:", err);
  }
};

const incrementSkuCreatedInThisMonth = async (shopId, createdSku) => {
  try {
    await BillingDetailsModel.updateOne(
      { shopId },
      { $inc: { createdInThisMonth: createdSku } }
    );
    console.log("createdInThisMonth incremented successfully");
  } catch (err) {
    console.error("Error incrementing createdInThisMonth:", err);
  }
};

const updateBodyNumber = async (shopId, preferenceData, dataToSave) => {
  try {
    if (preferenceData?.bodyNumberType?.bodyNumberType === "continue") {
      await BillingDetailsModel.updateOne(
        { shopId },
        { $set: { lastBodyNo: dataToSave } }
      );
    } else {
      await BillingDetailsModel.updateOne(
        { "skuPreference._id": preferenceData._id },
        { $set: { "skuPreference.$.basicRules.body": dataToSave } }
      );
    }
    console.log("Body number updated successfully");
  } catch (err) {
    console.error("Error updating body number:", err);
  }
};

export {
  processProductCreation,
  incrementProductAddedInThisMonth,
  decrementRemainingCredits,
  incrementSkuCreatedInThisMonth,
  updateBodyNumber,
};
