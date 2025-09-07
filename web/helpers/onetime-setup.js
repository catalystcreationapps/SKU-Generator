import shopify from "../shopify.js";
import mauticService from "./mautic-service.js";
import BillingDetailsModel from "../models/BillingDetailsModel.js";

export default async function onetimeSetup(session) {
  try {
    let plan_status = false;
    const client = new shopify.api.clients.Rest({
      session,
    });
    const response = await client.get({ path: "shop" });
    const resp = await BillingDetailsModel.findOne({
      shopId: response.body.shop.id,
    });

    if (resp && resp.status){
      if(resp.status === "ACTIVE"){
        plan_status = true;
      }else{
        plan_status = false;
      }
    }else{
      plan_status = false;
    }

    await mauticService(
      response.body.shop.shop_owner,
      response.body.shop.email,
      response.body.shop.myshopify_domain,
      response.body.shop.plan_display_name,
      response.body.shop.country_name,
      response.body.shop.address1,
      response.body.shop.address2,
      response.body.shop.zip,
      response.body.shop.city,
      response.body.shop.currency,
      plan_status
    );
  } catch (error) {
    console.log(error);
  }
}
