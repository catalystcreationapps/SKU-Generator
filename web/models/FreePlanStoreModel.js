import mongoose from "mongoose";
const FreePlanStoreSchema = new mongoose.Schema(
  {
    shopId: {
      type: Number,
    },
    shopName: {
      type: String,
      required: true,
    },
    shopEmail: {
      type: String,
    },
    businessName: {
      type: String,
    },
    devStore: {
      type: Boolean,
      default: false,
    },
    otherUsedApps: {
      type: String,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    productCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const FreePlanStoreModel = mongoose.model("FreePlanStore", FreePlanStoreSchema);
export default FreePlanStoreModel;
