"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateConversationSchema = exports.CreateConversationSchema = void 0;
const mongoose_1 = require("mongoose");
const zod_1 = __importDefault(require("zod"));
const constants_1 = require("../../constants");
const objectIdSchema = zod_1.default.string().refine((id) => mongoose_1.Types.ObjectId.isValid(id));
exports.CreateConversationSchema = zod_1.default.object({
    supervisorId: objectIdSchema,
    candidateId: zod_1.default.string(),
    role: zod_1.default.enum([constants_1.Role.Candidate]).or(zod_1.default.literal("candidate")),
});
exports.UpdateConversationSchema = zod_1.default.object({
    agentId: zod_1.default.string(),
    supervisorId: objectIdSchema,
    conversationId: zod_1.default.string(),
    role: zod_1.default.enum([constants_1.Role.Supervisor]).or(zod_1.default.literal("supervisor")),
});
