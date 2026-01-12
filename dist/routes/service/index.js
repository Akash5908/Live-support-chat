"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRouter = void 0;
exports.validAgent = validAgent;
exports.validConversation = validConversation;
const mongoose_1 = require("mongoose");
const express_1 = __importDefault(require("express"));
const Service_1 = require("../../validator/Service");
const conversation_1 = require("../../model/conversation");
const constants_1 = require("../../constants");
const auth_1 = require("../../model/auth");
const auth_2 = require("../auth");
const router = express_1.default.Router();
exports.ServiceRouter = router;
// Creating conversations route
router.post("/conversations", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    const token = authHeader === null || authHeader === void 0 ? void 0 : authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            error: "Token is missing.",
        });
    }
    const users = (0, auth_2.tokenValidator)(token);
    if (users.role !== constants_1.Role.Candidate) {
        return res
            .status(403)
            .json({ success: false, error: "Forbidden, insufficient permissions" });
    }
    const { success, data } = Service_1.CreateConversationSchema.safeParse(req.body);
    if (!success) {
        return res.status(400).json({
            success: false,
            error: "Invalid request schema",
        });
    }
    const existingConversation = yield conversation_1.ConversationModel.find({
        candidateId: data.candidateId,
        status: { $in: [constants_1.Status.ASSIGNED, constants_1.Status.OPEN] },
    });
    if (existingConversation) {
        return res.status(409).json({
            success: false,
            error: "Candidate already has an active conversation",
        });
    }
    // Check for valid supervisorId
    const isSupervisorValid = yield (0, auth_2.validSupervisor)(data.supervisorId);
    if (!isSupervisorValid) {
        return res.status(404).json({
            success: false,
            error: "Supervisor is not found!",
        });
    }
    else if (isSupervisorValid.role !== constants_1.Role.Supervisor) {
        return res.status(400).json({
            success: false,
            error: "Invalid supervisorId",
        });
    }
    try {
        const conversation = yield conversation_1.ConversationModel.create({
            candidateId: new mongoose_1.Types.ObjectId(data.candidateId),
            supervisorId: new mongoose_1.Types.ObjectId(data.supervisorId),
        });
        res.status(201).json({
            success: true,
            data: {
                _id: conversation._id,
                status: conversation.status,
                supervisorId: conversation.supervisorId,
            },
        });
    }
    catch (error) {
        res.status(403).json({
            data: {
                success: false,
                error: "Forbidden, insufficient permissions",
            },
        });
    }
}));
router.post("/conversations/:id/assign", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const conversationId = req.params.id;
    const { agentId, supervisorId, role } = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader === null || authHeader === void 0 ? void 0 : authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            error: "Token is missing.",
        });
    }
    const { success, data } = Service_1.UpdateConversationSchema.safeParse({
        agentId: agentId,
        supervisorId: supervisorId,
        role: role,
        conversationId: conversationId,
    });
    if (!success) {
        return res.status(400).json({
            success: false,
            error: "Invalid request schema",
        });
    }
    const user = (0, auth_2.tokenValidator)(token);
    if (user.role !== constants_1.Role.Supervisor) {
        return res.status(403).json({
            success: false,
            error: "Permission denied",
        });
    }
    const agent = yield auth_1.UserModel.findById(agentId);
    if ((agent === null || agent === void 0 ? void 0 : agent.supervisorId) === supervisorId) {
        return res.status(403).json({
            success: false,
            error: "Agent doesn’t belong to you",
        });
    }
    const isValidAgent = yield validAgent(data.agentId, data.supervisorId);
    if (!isValidAgent) {
        return res.status(403).json({
            success: false,
            error: "Agent doesn't belong to you",
        });
    }
    const isValidConversation = yield validConversation(data.conversationId, data.supervisorId);
    if (!isValidConversation) {
        return res.status(403).json({
            success: false,
            error: "Conversation doesn't belong to you",
        });
    }
    try {
        const conversation = yield conversation_1.ConversationModel.findById(conversationId);
        if (!conversation)
            return null;
        if ((conversation === null || conversation === void 0 ? void 0 : conversation.status) === constants_1.Status.ASSIGNED) {
            return res.status(403).json({
                success: false,
                error: "Cannot assign agent. Already assigned to other agent.",
            });
        }
        // updating the conversation after checking all requirements
        conversation.agentId = agentId;
        conversation.status = constants_1.Status.ASSIGNED;
        yield conversation.save();
        res.status(200).json({
            success: true,
            data: {
                conversationId: conversationId,
                agentId: data.agentId,
                supervisorId: data.supervisorId,
            },
        });
    }
    catch (error) {
        res.status(404).json({
            success: false,
            error: "Cannot find the conversation",
        });
    }
}));
router.post("/conversations/:id/close", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const conversationId = req.params.id;
    const authHeader = req.headers.authorization;
    const token = authHeader === null || authHeader === void 0 ? void 0 : authHeader.split(" ")[1];
    try {
        const decoded = (0, auth_2.tokenValidator)(token);
        if (decoded.role !== constants_1.Role.Admin) {
            return res
                .status(403)
                .json({ success: false, error: "Permission denied." });
        }
        const conversation = yield conversation_1.ConversationModel.findById(conversationId);
        if (!conversation) {
            return res
                .status(404)
                .json({ success: false, error: "Conversation not found." });
        }
        if (conversation.status === constants_1.Status.CLOSED) {
            return res
                .status(400)
                .json({ success: false, error: "Conversation already closed." });
        }
        conversation.status = constants_1.Status.CLOSED;
        yield conversation.save();
        res.status(200).json({
            success: true,
            data: { conversationId, status: "Closed" },
        });
    }
    catch (error) {
        // Now try-catch only handles REAL errors (token, DB, etc.)
        res.status(500).json({ success: false, error: "Server error." });
    }
}));
// Check if the agent is valid
function validAgent(agentId, supervisorId) {
    return __awaiter(this, void 0, void 0, function* () {
        const agent = yield auth_1.UserModel.find({
            _id: agentId,
            supervisorId: supervisorId,
        });
        if (agent) {
            return true;
        }
        else {
            return false;
        }
    });
}
// Checking for a valid conversation
function validConversation(conversationId, supervisorId) {
    return __awaiter(this, void 0, void 0, function* () {
        const conversaiton = yield conversation_1.ConversationModel.find({
            _id: conversationId,
            supervisorId: supervisorId,
        });
        if (conversaiton) {
            return true;
        }
        else {
            return false;
        }
    });
}
