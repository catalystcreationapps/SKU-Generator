import nodemailer from "nodemailer";
import BillingDetailsModel from "../models/BillingDetailsModel.js";
import FreePlanStoreModel from "../models/FreePlanStoreModel.js";
import axios from "axios";

let transporter = nodemailer.createTransport({
  port: 465,
  host: "email-smtp.us-east-2.amazonaws.com",
  secure: true,
  auth: {
    user: "AKIA42BQ4A757JBVDXEF",
    pass: "BP0PQqFHe+LodJEO/3F4X6sY355teYV8I7d98EfvpYQX",
  },
  debug: true,
});

export async function sendReportsToUsers() {
  try {
    const usersAggregation = BillingDetailsModel.aggregate([
      {
        $match: {
          status: "ACTIVE",
        },
      },
      {
        $project: {
          shopId: 1,
          shopEmail: 1,
          addedInThisWeek: 1,
          "smartSKU.status": 1,
        },
      },
    ]);

    const users = await usersAggregation.exec();

    // return;
    for (const user of users) {
      let emailContent = "";

      if (user?.smartSKU?.status === "ACTIVE") {
        emailContent = `<head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Weekly Report</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse;">
            <tr>
                <td bgcolor="#ffffff" style="padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td align="center" bgcolor="#4caf50" style="padding: 20px; border-top-left-radius: 10px; border-top-right-radius: 10px;">
                                <h1 style="color: #ffffff; font-family: 'Arial Black', sans-serif; font-size: 28px;">Weekly Report</h1>
                            </td>
                        </tr>
                        <tr>
                            <td bgcolor="#ffffff" style="padding: 20px;">
                                <p style="font-size: 16px;">Hello there,</p>
                                <p style="font-size: 16px;">We hope you're doing well. Here's your weekly report for the products added in the past week:</p>
                                <table border="0" cellpadding="5" cellspacing="0" width="100%" style="background-color: #f9f9f9; border-left: 4px solid #4caf50;">
                                    <tr>
                                        <td style="font-weight: bold; font-size: 16px;">Total Products Added:</td>
                                        <td style="font-size: 16px;">${user.addedInThisWeek}</td>
                                    </tr>
                                    <tr>
                                        <td style="font-weight: bold; font-size: 16px;">Total SKUs Created:</td>
                                        <td style="font-size: 16px;">${user.addedInThisWeek}</td>
                                    </tr>
                                </table>
                                <p style="font-size: 16px;">If you have any questions or need further assistance, please feel free to contact us.</p>
                            </td>
                        </tr>
                        <tr>
                            <td bgcolor="#4caf50" style="padding: 20px; text-align: center; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;">
                                <p style="color: #ffffff; font-size: 16px;">Thank you for using our SKU Generation App.</p>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 20px;">
                                <p style="font-size: 14px; color: #999;">Crafted with care by <strong style="color: #4caf50;">Final Apps</strong> - Your Partner in Digital Solutions</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>`;
      } else {
        emailContent = `<head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Weekly Report</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: 'Helvetica Neue', Arial, sans-serif;
                background-color: #f4f4f4;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                border-radius: 10px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                background-color: #ffffff;
            }
            .header {
                padding: 20px;
                text-align: center;
                border-top-left-radius: 10px;
                border-top-right-radius: 10px;
                background-color: #4caf50;
            }
            .header h1 {
                color: #ffffff;
                font-family: 'Arial Black', sans-serif;
                font-size: 28px;
            }
            .content {
                padding: 20px;
            }
            .content p {
                font-size: 16px;
                line-height: 1.5;
                margin-bottom: 20px;
            }
            .highlight-box {
                background-color: #f9f9f9;
                border-left: 4px solid #4caf50;
                padding: 10px;
                margin-bottom: 20px;
            }
            .highlight-box strong {
                font-weight: bold;
                font-size: 16px;
            }
            .footer {
                padding: 20px;
                text-align: center;
                border-bottom-left-radius: 10px;
                border-bottom-right-radius: 10px;
                background-color: #4caf50;
            }
            .footer p {
                color: #ffffff;
                font-size: 16px;
            }
            .signature {
                padding: 20px;
                text-align: center;
            }
            .signature p {
                font-size: 14px;
                color: #999;
                margin: 0;
            }
            .signature strong {
                color: #4caf50;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Weekly Report</h1>
            </div>
            <div class="content">
                <p>Hello there,</p>
                <p>We hope you're doing well. Here's your weekly report for the products added in the past week:</p>
                <div class="highlight-box">
                    <strong>Total Products Added:</strong>
                    <span>${user.addedInThisWeek}</span>
                </div>
              <p>If you're subscribed to our <span style="font-weight:bold;" >PRO MONTHLY</span> plan, you'll be glad to know that SKUs are being automatically generated for your newly added products. This seamless process saves you time and effort, ensuring your products are ready for use.</p>
                <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
            </div>
            <div class="footer">
                <p>Thank you for using our SKU Generation App.</p>
            </div>
            <div class="signature">
                <p>Crafted with care by <strong>Final Apps</strong> - Your Partner in Digital Solutions</p>
            </div>
        </div>
    </body>`;
      }
      const mailOptions = {
        from: "support@appsfinal.com",
        // to: user.shopEmail, // Use the email from the user object
        to: "sahad@appsfinal.com",
        subject: "SKU Weekly Report",
        html: emailContent,
      };

      await transporter.sendMail(mailOptions);

      // Reset addedInThisWeek to 0 for the user
      await BillingDetailsModel.updateOne(
        { shopId: user.shopId },
        { $set: { addedInThisWeek: 0 } }
      );
    }
  } catch (error) {
    console.log(error);
  }
}

export async function sendReportToFreeUsers() {
  try {
    const usersAggregation = FreePlanStoreModel.aggregate([
      {
        $project: {
          shopId: 1,
          shopEmail: 1,
        },
      },
      {
        $lookup: {
          from: "billingdetails",
          localField: "shopEmail",
          foreignField: "shopEmail",
          as: "billingDetails",
        },
      },
      {
        $match: {
          billingDetails: {
            $size: 0,
          },
        },
      },
      {
        $project: {
          shopId: 1,
          shopEmail: 1,
        },
      },
    ]);

    const users = await usersAggregation.exec();

    for (const user of users) {
      const mailOptions = {
        from: "support@appsfinal.com",
        // to: user.shopEmail, // Use the email from the user object
        to: "sahad@appsfinal.com",
        subject: "SKU Weekly Report",
        html: `<head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Weekly Report</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: 'Helvetica Neue', Arial, sans-serif;
                background-color: #f4f4f4;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                border-radius: 10px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                background-color: #ffffff;
            }
            .header {
                padding: 20px;
                text-align: center;
                border-top-left-radius: 10px;
                border-top-right-radius: 10px;
                background-color: #4caf50;
            }
            .header h1 {
                color: #ffffff;
                font-family: 'Arial Black', sans-serif;
                font-size: 28px;
            }
            .content {
                padding: 20px;
            }
            .content p {
                font-size: 16px;
                line-height: 1.5;
                margin-bottom: 20px;
            }
            .highlight-box {
                background-color: #f9f9f9;
                border-left: 4px solid #4caf50;
                padding: 10px;
                margin-bottom: 20px;
            }
            .highlight-box strong {
                font-weight: bold;
                font-size: 16px;
            }
            .footer {
                padding: 20px;
                text-align: center;
                border-bottom-left-radius: 10px;
                border-bottom-right-radius: 10px;
                background-color: #4caf50;
            }
            .footer p {
                color: #ffffff;
                font-size: 16px;
            }
           .upgrade-btn {
  				display: block;
        	margin: 0 auto;
 				  padding: 10px 20px;
  				background-color: #4caf50;
  				color: #ffffff;
  				border: none;
  				border-radius: 6px;
  				font-size: 16px;
  				cursor: pointer;
  				transition: all 0.3s ease-in-out;
			}
			.upgrade-btn:hover {
  				background-color: #43a047;
			}

            .signature {
                padding: 20px;
                text-align: center;
            }
            .signature p {
                font-size: 14px;
                color: #999;
                margin: 0;
            }
            .signature strong {
                color: #4caf50;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Weekly Report</h1>
            </div>
            <div class="content">
                <p>Hello there,</p>
                <p>We hope you're doing well. Here's your weekly report for the products added in the past week:</p>
                <div class="highlight-box">
                    <strong>Total Products Added:</strong>
                  <span style="float: right;">X <span style="font-size: 14px; color: #999;">(Upgrade plan to show exact number)</span></span>
                </div>
              <p>Upgrade to our <strong>Lifetime Plan</strong> and enjoy a host of exclusive benefits:</p>
<ul>
  <li><span style="font-weight:bold;" >Unlimited SKU Generation:</span><span style="font-size: 16px;" >Say goodbye to limitations! Add as many SKUs as you need.</span></li>
  <li><span style="font-weight:bold;" >Priority Customer Support:</span><span style="font-size: 16px;" >Our dedicated support team is here to assist you with top priority.</span></li>
  <li><span style="font-weight:bold;" >Future-Proof Savings:</span><span style="font-size: 16px;" >Secure access to all upcoming features and enhancements, no additional costs.</span></li>
</ul>
<p>Embrace the unlimited potential and experience a seamless product management journey.</p>
                <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
            </div>
            <div class="footer">
                <p>Thank you for using our SKU Generation App.</p>
            </div>
            <div class="signature">
                <p>Crafted with care by <strong>Final Apps</strong> - Your Partner in Digital Solutions</p>
            </div>
        </div>
    </body>`,
      };

      await transporter.sendMail(mailOptions);
    }
  } catch (err) {
    console.log("Error:", err);
  }
}

export async function sendWeekly() {
  try {
    const auth = {
      username: "felix",
      password: "campaigns123",
    };

    await fetchAllContacts();

    // Function to fetch contacts using pagination
    async function fetchAllContacts(page = 1) {
      try {
        await axios
          .get(
            "https://campaigns.appsfinal.com/api/contacts?where%5B0%5D%5Bcol%5D=app&where%5B0%5D%5Bexpr%5D=in&where%5B0%5D%5Bval%5D=Final%20SKU",
            {
              auth: auth,
              params: {
                start: (page - 1) * 30,
                maxResults: 30,
              },
            }
          )
          .then(async (response) => {
            if (response.status === 200) {
              const contacts = response.data.contacts;

              if (Object.keys(contacts).length > 0) {
                // Process the contacts on this page
                await processContacts(contacts);
                // Fetch the next page of contacts
                await fetchAllContacts(page + 1);
              }
            } else {
              console.error(
                `Failed to fetch contacts from Mautic: ${response.status}`
              );
            }
          })
          .catch((resp) => {
            console.log("error", resp.response.data);
          });
      } catch (error) {
        console.error(
          `Error while fetching contacts from Mautic: ${error.message}`
        );
      }
    }

    async function processContacts(contacts) {
      Object.keys(contacts).forEach((contactId) => {
        const contact = contacts[contactId];
        const contactShop = contact.fields.all.shop;
        //Check if the email exists in the MongoDB collection
        try {
          BillingDetailsModel.findOne({ shopName: contactShop }).then(
            (result) => {
              if (result) {
                // Update the "lifetime plan, Auto SKU monathly, Producte added, SKU created" field in Mautic
                const updateData = {
                  lifetime_plan: result.status === "ACTIVE" ? "Yes" : "No",
                  auto_sku_monthly:
                    result.smartSKU.status === "ACTIVE" ? "Yes" : "No",
                  sku_created: result.createdInThisWeek
                    ? result.createdInThisWeek
                    : 0,
                  product_added: result.addedInThisWeek
                    ? result.addedInThisWeek
                    : 0,
                };
                try {
                  axios
                    .patch(
                      `https://campaigns.appsfinal.com/api/contacts/${contact.id}/edit`,
                      updateData,
                      {
                        auth: auth,
                      }
                    )
                    .then(async (response) => {
                      if (response.status === 200) {
                        // Reset addedInThisWeek to 0 for the user
                        await BillingDetailsModel.updateOne(
                          { shopId: result.shopId },
                          { $set: { addedInThisWeek: 0, createdInThisWeek: 0 } }
                        );
                      } else {
                        console.error(
                          `Failed to update contact ${contact.id}: ${response.status}`
                        );
                      }
                    })
                    .catch((error) => {
                      console.error(
                        `Error while updating contact in Mautic: ${error.message}`
                      );
                    });
                } catch (err) {
                  console.log(err);
                }
              } else {
                const updateData = {
                  lifetime_plan: "No",
                  auto_sku_monthly: "No",
                  sku_created: 0,
                  product_added: 0,
                };

                try {
                  axios
                    .patch(
                      `https://campaigns.appsfinal.com/api/contacts/${contact.id}/edit`,
                      updateData,
                      {
                        auth: auth,
                      }
                    )
                    .then((response) => {
                      if (response.status === 200) {
                        console.log(
                          `Updated contact ${contact.id} with lifetime plan 'Yes'`
                        );
                      } else {
                        console.error(
                          `Failed to update contact ${contact.id}: ${response.status}`
                        );
                      }
                    })
                    .catch((error) => {
                      console.error(
                        `Error while updating contact in Mautic: ${error.message}`
                      );
                    });
                } catch (err) {
                  console.log(err);
                }
              }
            }
          );
        } catch (err) {
          console.log("Whats error", err);
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
}
