import mongoose from "mongoose";
import { Schema, Types } from "mongoose";
import { Role } from "../constants";

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: Object.values(Role),
    required: true,
  },
  supervisorId: {
    type: Types.ObjectId,
    required: false,
    default: null,
  },
});

export const UserModel = mongoose.model("Users", userSchema);
