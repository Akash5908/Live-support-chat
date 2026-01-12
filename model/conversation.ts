import mongoose, { Schema, Types } from "mongoose";
import { Status } from "../constants";

export const ConversationSchema = new Schema({
  candidateId: {
    type: Types.ObjectId,
    requred: true,
    ref: "Users",
  },
  agentId: {
    type: Types.ObjectId,
    default: null,
    ref: "Users",
  },
  supervisorId: {
    type: Types.ObjectId,
    required: true,
    ref: "Users",
  },
  status: {
    type: String,
    enum: Object.values(Status),
    default: Status.ASSIGNED,
    required: true,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

export const ConversationModel = mongoose.model(
  "Conversations",
  ConversationSchema
);
