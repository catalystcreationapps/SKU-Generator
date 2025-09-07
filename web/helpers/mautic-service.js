import axios from "axios";
import "dotenv/config";

export default async function mauticService(
  shop_owner,
  email,
  myshopify_domain,
  plan_display_name,
  country_name,
  address1,
  address2,
  zip,
  city,
  currency,
  plan_status
) {

  const auth = {
    username: "approbot",
    password: "{J$zv.7sDD{ZRp6",
  };

  const contact = {
    firstname: shop_owner,
    email: email,
    shop: myshopify_domain,
    plan: plan_display_name,
    country: country_name,
    address1: address1,
    address2: address2,
    zip: zip,
    city: city,
    lifetime_plan: plan_status,
    currency: currency,
    app: "Final SKU",
    overwriteWithBlank: true,
  };

  await axios
    .post("https://campaigns.appsfinal.com/api/contacts/new", contact, {
      auth: auth,
    })
    .then((resp) => {
      console.log(resp, "success");
    })
    .catch((resp) => {
      console.log("error", resp.response.data);
    });
}
