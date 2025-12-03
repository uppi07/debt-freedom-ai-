import mongoose, { Schema } from "mongoose";

const DeletedClearedDebtSchema = new Schema({
  name: { type: String, required: true },
});

export default mongoose.models.DeletedClearedDebt ||
  mongoose.model("DeletedClearedDebt", DeletedClearedDebtSchema);
