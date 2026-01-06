import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { 
      type: String, 
      required: [true, "Please provide a name"],
    },
    email: { 
      type: String, 
      required: [true, "Please provide an email"], 
      unique: true,
    },
    password: { 
      type: String, 
      required: [true, "Please provide a password"], 
      select: false, // Security: Never return password by default
    },
    position: { 
      type: String, 
      default: "Team Member", // e.g. "Lead Dev", "Project Manager"
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    }
  },
  { timestamps: true }
);

const User = models.User || model("User", UserSchema);
export default User;