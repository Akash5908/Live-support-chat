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
exports.wss = void 0;
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = __importDefault(require("./routes/auth"));
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const service_1 = require("./routes/service");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cors_1 = __importDefault(require("cors"));
const websockets_1 = require("./handlers/websockets");
const websockets_2 = require("./handlers/websockets");
const admin_1 = require("./routes/admin");
const JWT_SECRET = process.env.JWT_SECRET;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Defining WS server
const server = http_1.default.createServer(app);
exports.wss = new ws_1.WebSocketServer({ server });
exports.wss.on("connection", (ws, req) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.url)
        return;
    const authWs = ws; // Cast after auth
    authWs.conversations = new Set();
    const url = new URL(req.url, "http:localhost");
    const token = url.searchParams.get("token");
    if (!token) {
        authWs.send(JSON.stringify({
            event: "ERROR",
            data: {
                message: "Token is missing.",
            },
        }));
        return authWs.close();
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        authWs.userId = decoded.userId;
        authWs.role = decoded.role;
        console.log(ws);
    }
    catch (error) {
        authWs.send(JSON.stringify({
            event: "ERROR",
            data: {
                message: "Unauthorized or invalid token",
            },
        }));
        return authWs.close();
    }
    ws.on("message", (event) => {
        const data = JSON.parse(event.toString());
        dispatchEvent(authWs, data);
    });
}));
const uri = process.env.MONGODB_URI;
mongoose_1.default.connect(uri);
app.use("/auth", auth_1.default);
app.use("/", service_1.ServiceRouter);
app.use("/admin", admin_1.AdminRouter);
//START HTTP+WS SERVER
server.listen(3000, () => {
    console.log("Server + WebSocket running on http://localhost:3000");
});
function dispatchEvent(authWs, data) {
    switch (data.event) {
        case "JOIN_CONVERSATION":
            return (0, websockets_1.JOIN_CONVERSATION)(authWs, data);
        case "SEND_MESSAGE":
            return (0, websockets_2.SEND_MESSAGE)(authWs, data);
        case "LEAVE_CONVERSATION":
            return (0, websockets_1.LEAVE_CONVERSATION)(authWs, data);
        case "CLOSE_CONVERSATION":
            return (0, websockets_1.CLOSE_CONVERSATION)(authWs, data);
        default:
            // Send unknown event error
            authWs.send(JSON.stringify({
                event: "ERROR",
                data: {
                    message: `Unknown event: ${data.event}`,
                },
            }));
            authWs.close();
            return;
    }
}
