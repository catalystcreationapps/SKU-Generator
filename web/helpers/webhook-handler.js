import shopify from "../shopify.js";
import crypto from "crypto";
import BillingDetailsModel from "../models/BillingDetailsModel.js";

// Creating new webhook for product creation.
export async function createNewWebhook(session) {
  const callbackURL = `${process.env.HOST}/api/webhook/handle`;
  const webhook = new shopify.api.rest.Webhook({ session: session });
  webhook.address = callbackURL;
  webhook.topic = "products/create";
  await webhook.save({
    update: true,
  });
  const client = new shopify.api.clients.Rest({ session });
  const response = await client.get({ path: "shop" });
  updateShopEmailByShopId(response.body.shop.id, response.body.shop.email);
  return webhook.id;
}

// Creating new webhook for app onetime purchase update.
export async function createWebhookOnetimePurchase(session) {
  const callbackURL = `${process.env.HOST}/api/webhook/handle`;
  const webhook = new shopify.api.rest.Webhook({ session: session });
  webhook.address = callbackURL;
  webhook.topic = "app_subscriptions/update";
  await webhook.save({
    update: true,
  });
  const client = new shopify.api.clients.Rest({ session });
  const response = await client.get({ path: "shop" });
  // updateShopEmailByShopId(response.body.shop.id, response.body.shop.email);
  return webhook.id;
}

// Verify incoming webhook.
export function verifyWebhook(payload, hmac) {
  try {
    const message = payload.toString();
    const genHash = crypto
      .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
      .update(message, "utf8")
      .digest("base64");
    return genHash === hmac;
  } catch (err) {
    console.log("Verify error", err);
  }
}

// Handling string number
export function incrementBodyString(bodyString) {
  const numericPart = bodyString.match(/\d+/)[0];
  let incrementedNumber = parseInt(numericPart, 10) + 1;
  const maxBodyNumber = Math.pow(10, numericPart.length) - 1;
  if (incrementedNumber > maxBodyNumber) {
    incrementedNumber = 1; // Reset to 1 if it exceeds the maximum value
  }
  const paddedNumber = String(incrementedNumber).padStart(
    numericPart.length,
    "0"
  );
  return bodyString.replace(/\d+/, paddedNumber);
}

async function updateShopEmailByShopId(shopId, shopEmail) {
  try {
    const filter = { shopId };
    const update = { $set: { shopEmail } };
    const updateResult = await BillingDetailsModel.updateOne(filter, update);
  } catch (error) {
    console.error("Error updating document:", error);
  }
}
