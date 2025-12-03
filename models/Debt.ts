import mongoose from "mongoose";

const DebtSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  interest: { type: Number, required: true },
  minimumPayment: { type: Number, required: true },
  priority: { type: Number, default: 1 },
  paymentType: {
    type: String,
    enum: ["one-time", "recurring"],
    default: "recurring"
  },
  cleared: { type: Boolean, default: false },
  originalAmount: { type: Number, default: null },
  totalMonths: { type: Number, default: null },
  totalPaid: { type: Number, default: 0 },
  payoffDate: { type: Date, default: null },
  amountSaved: { type: Number, default: 0 },
});

export default mongoose.models.Debt ||
  mongoose.model("Debt", DebtSchema);
