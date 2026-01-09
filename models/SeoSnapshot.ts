import mongoose, { Schema, model, models } from "mongoose";

const SeoSnapshotSchema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "SeoClient", required: true },
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ["AUDIT", "RANK_CHECK"], default: "AUDIT" },
    
    // 1. SCORING (The "Health" Score)
    overallScore: { type: Number, default: 0 },
    
    // 2. TECHNICAL AUDIT DATA (The missing piece)
    technicalAnalysis: {
      metaTitle: { value: String, status: String, length: Number },
      metaDescription: { value: String, status: String, length: Number },
      h1Count: { type: Number, default: 0 },
      h1Content: String,
      imageHealth: {
        total: Number,
        missingAlt: Number,
        score: Number
      },
      linkHealth: {
        internal: Number,
        external: Number,
        broken: Number
      },
      loadTime: Number, // In ms
    },

    // 3. KEYWORD DENSITY ANALYSIS
    keywordAnalysis: [
      {
        keyword: String,
        foundInTitle: Boolean,
        foundInH1: Boolean,
        foundInDesc: Boolean,
        countInBody: Number,
        score: Number
      }
    ],

    // 4. RANK TRACKING & COMPETITORS
    googleRankings: [
      {
        keyword: String,
        position: Number,
        urlFound: String,
      }
    ],
    competitorInsights: [
      {
        keyword: String,
        competitorDomain: String,
        position: Number
      }
    ]
  },
  { timestamps: true }
);

const SeoSnapshot = models.SeoSnapshot || model("SeoSnapshot", SeoSnapshotSchema);
export default SeoSnapshot;