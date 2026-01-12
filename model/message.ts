import { Schema, Types } from "mongoose";
import { Role } from "../constants";

const MessageSchema = new Schema({
  candidateId: {
    type: Types.ObjectId,
    requred: true,
    ref: "Users",
  },
  conversationId: {
    type: Types.ObjectId,
    required: true,
    ref: "Conversations",
  },
  senderId: {
    type: Types.ObjectId,
    required: true,
    ref: "Users",
  },
  senderRole: {
    type: Object.values(Role),
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});
