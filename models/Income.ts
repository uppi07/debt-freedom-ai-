import mongoose from "mongoose";

const IncomeSchema = new mongoose.Schema(
  {
    source: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Income ||
  mongoose.model("Income", IncomeSchema);
