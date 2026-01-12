"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const constants_1 = require("../constants");
const MessageSchema = new mongoose_1.Schema({
    candidateId: {
        type: mongoose_1.Types.ObjectId,
        requred: true,
        ref: "Users",
    },
    conversationId: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "Conversations",
    },
    senderId: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "Users",
    },
    senderRole: {
        type: Object.values(constants_1.Role),
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
