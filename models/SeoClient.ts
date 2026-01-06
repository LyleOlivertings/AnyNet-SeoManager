import mongoose, { Schema, model, models } from "mongoose";

const SeoClientSchema = new Schema(
  {
    name: { type: String, required: true }, // e.g. "TnT Infrastructure"
    url: { type: String, required: true },  // e.g. "https://www.tnt-infra.co.za"
    keywords: [{ type: String }],           // e.g. ["CCTV Cape Town", "Fiber Installers"]
    competitors: [{ type: String }],        // e.g. ["competitor1.co.za"]
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const SeoClient = models.SeoClient || model("SeoClient", SeoClientSchema);
export default SeoClient;