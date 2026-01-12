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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JOIN_CONVERSATION = JOIN_CONVERSATION;
exports.SEND_MESSAGE = SEND_MESSAGE;
exports.LEAVE_CONVERSATION = LEAVE_CONVERSATION;
exports.CLOSE_CONVERSATION = CLOSE_CONVERSATION;
const ws_1 = require("ws");
const conversation_1 = require("../model/conversation");
const conversations = new Map(); // Creating global rooms
const messageArray = [];
function JOIN_CONVERSATION(authWs, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const checkingAgent = yield validAgent(authWs, data.conversationId);
        const checkingUser = yield validUser(authWs, data.conversationId);
        if (!checkingAgent) {
            authWs.send(JSON.stringify({
                event: "ERROR",
                data: {
                    message: "This conversaiton is not assinged to you.",
                },
            }));
            return authWs.close();
        }
        if (checkingUser) {
            authWs.send(JSON.stringify({
                event: "ERROR",
                data: {
                    message: "Not allowed to access this conversation",
                },
            }));
            return authWs.close();
        }
        if (!conversations.has(data.conversationId)) {
            conversations.set(data.conversationId, new Set()); //Create a new room in the global conversations
        }
        conversations.get(data.conversationId).add(authWs); // ← CLIENT JOINS HERE
        authWs.conversations.add(data.conversationId);
        authWs.send(JSON.stringify({
            event: "JOINED_CONVERSATION",
            data: {
                conversationId: data.conversationId,
                status: "assigned",
            },
        }));
        messageArray
            .filter((e) => e.conversationId === data.conversationId)
            .forEach((message) => authWs.send(JSON.stringify(message)));
    });
}
function SEND_MESSAGE(authWs, data) {
    if (!authWs.conversations.has(data.conversationId)) {
        authWs.send(JSON.stringify({
            event: "ERROR",
            data: {
                message: "You must join the conversation first",
            },
        }));
    }
    const room = conversations.get(data.conversationId);
    if (!room)
        return;
    messageArray.push({
        conversationId: data.conversationId,
        senderRole: data.role,
        content: data.content,
        from: authWs.userId,
        timestamp: Date.now(),
    });
    room.forEach((client) => {
        //  Check connection alive
        if (client.readyState === ws_1.WebSocket.OPEN && client !== authWs) {
            client.send(JSON.stringify({
                type: "new-message",
                data: {
                    senderId: authWs.userId,
                    senderRole: authWs.role,
                    content: data.content,
                    createdAt: new Date().toISOString(),
                },
            }));
        }
    });
}
function LEAVE_CONVERSATION(authWs, data) {
    const room = conversations.get(data.conversationId);
    room === null || room === void 0 ? void 0 : room.delete(authWs);
    authWs.send(JSON.stringify({
        event: "LEFT_CONVERSATION",
        data: {
            conversationId: data.conversationId,
        },
    }));
}
function CLOSE_CONVERSATION(authWs, data) {
    if (authWs.role !== "agent") {
        return authWs.send(JSON.stringify({
            event: "ERROR",
            data: {
                message: "Forbidden for this role",
            },
        }));
    }
    if (!conversations.has(data.conversationId)) {
        return authWs.send(JSON.stringify({
            event: "ERROR",
            data: {
                message: "Conversation already closed",
            },
        }));
    }
    conversations.delete(data.conversationId);
    authWs.send(JSON.stringify({
        event: "CONVERSATION_CLOSED",
        data: {
            conversationId: data.conversationId,
        },
    }));
}
// Validations
function validAgent(authWs, conversationId) {
    return __awaiter(this, void 0, void 0, function* () {
        const conversation = yield conversation_1.ConversationModel.findById(conversationId);
        if (String(conversation === null || conversation === void 0 ? void 0 : conversation.agentId) === authWs.userId) {
            return true;
        }
        else {
            return false;
        }
    });
}
function validUser(authWs, conversationId) {
    return __awaiter(this, void 0, void 0, function* () {
        const conversation = yield conversation_1.ConversationModel.findById(conversationId);
        if (String(conversation === null || conversation === void 0 ? void 0 : conversation.candidateId) === authWs.userId) {
            return true;
        }
        else {
            return false;
        }
    });
}
