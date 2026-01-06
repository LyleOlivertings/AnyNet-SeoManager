import mongoose, { Schema, model, models } from "mongoose";

const SeoSnapshotSchema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "SeoClient", required: true },
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ["AUDIT", "RANK_CHECK"], default: "AUDIT" },
    
    // 1. Technical Audit Score (0-100)
    overallScore: { type: Number, default: 0 },
    
    // 2. Google Keyword Rankings
    googleRankings: [
      {
        keyword: String,
        position: Number, // e.g. 4 (Rank #4)
        prevPosition: Number, // For quick comparison
        urlFound: String,
      }
    ]
  },
  { timestamps: true }
);

const SeoSnapshot = models.SeoSnapshot || model("SeoSnapshot", SeoSnapshotSchema);
export default SeoSnapshot;