import mongoose from "mongoose";
const BillingDetailsSchema = new mongoose.Schema(
  {
    shopId: {
      type: Number,
      required: true,
    },
    shopName: {
      type: String,
      required: true,
    },
    charge_id: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    charge_name: {
      type: String,
      required: true,
    },
    createdAt: {
      type: String,
      default: null,
    },
    shopEmail: {
      type: String,
    },
    price: {
      type: Object,
      required: true,
    },
    addedInThisMonth: {
      type: Number,
    },
    createdInThisMonth: {
      type: Number,
    },
    lastBodyNo: {
      type: String,
    },
    creditsRemaining: {
      type: Number,
      default: 0,
    },
    hasReviewed: {
      type: Boolean,
      default: false,
    },
    extraCreditRemainigs: {
      type: Number,
      default: 50,
    },
    skuPreference: [
      {
        basicRules: {
          type: Object,
        },
        separator: {
          type: String,
        },
        productOption: {
          type: String,
        },
        applyToEmpty: {
          type: Boolean,
        },
        delimeters: {
          type: String,
        },
        delimetersPosition: {
          type: Boolean,
        },
        selected: {
          type: Number,
        },
        selectedType: {
          type: Number,
        },
        removeSpace: {
          type: Boolean,
        },
        makeAllCapital: {
          type: Boolean,
        },
        incaseOfDuplicate: {
          type: String,
        },
        layoutOrder: {
          type: Array,
        },
        productVariant: {
          type: Boolean,
        },
        bodyNumberType: {
          type: Object,
        },
        conditions: {
          type: Array,
        },
        productTitleInclude: {
          type: Boolean,
        },
      },
    ],
    smartSKU: {
      autoSKU_on: {
        type: Boolean,
        default: false,
      },
      charge_id: {
        type: String,
      },
      status: {
        type: String,
      },
      charge_name: {
        type: String,
      },
      createdAt: {
        type: String,
      },
      currentPeriodEnd: {
        type: String,
      },
    },
    appliedPreference: {
      type: String,
    },
  },
  { timestamps: true }
);

const BillingDetailsModel = mongoose.model(
  "BillingDetails",
  BillingDetailsSchema
);
export default BillingDetailsModel;
