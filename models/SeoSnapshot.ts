import mongoose, { Schema, model, models } from "mongoose";

const SeoSnapshotSchema = new Schema(
  {
    clientName: { type: String, required: true }, // e.g. "TnT Infrastructure"
    domain: { type: String, required: true },
    date: { type: Date, default: Date.now },
    
    // Core Vitals
    healthScore: { type: Number, required: true }, // 0-100
    organicTraffic: { type: Number, default: 0 },
    
    // Keyword Rankings (Array of objects)
    rankings: [
      {
        keyword: String,
        position: Number, // Current rank (e.g. 3)
        change: Number,   // +2 or -1
      },
    ],
  },
  { timestamps: true }
);

const SeoSnapshot = models.SeoSnapshot || model("SeoSnapshot", SeoSnapshotSchema);
export default SeoSnapshot;