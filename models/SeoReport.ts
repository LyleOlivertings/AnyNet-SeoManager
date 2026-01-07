import mongoose, { Schema, model, models } from "mongoose";

const SeoReportSchema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "SeoClient", required: true },
    title: { type: String, default: "Monthly SEO Report" },
    dateGenerated: { type: Date, default: Date.now },
    range: { type: String, default: "30 Days" },
    
    // The Data
    data: { type: Object, required: true }, 
    
    // 🧠 The AI Brief (New Field)
    aiSummary: { type: String, default: "" }, 

    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const SeoReport = models.SeoReport || model("SeoReport", SeoReportSchema);
export default SeoReport;