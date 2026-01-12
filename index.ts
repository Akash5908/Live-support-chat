import express from "express";
import mongoose from "mongoose";
import authRouter from "./routes/auth";
import http from "http";
import { WebSocket, WebSocketServer } from "ws";
import { ServiceRouter } from "./routes/service";
import jwt from "jsonwebtoken";
import { ConversationModel } from "./model/conversation";
import { Status } from "./constants";
import { timeStamp } from "console";
import cors from "cors";

import {
  CLOSE_CONVERSATION,
  JOIN_CONVERSATION,
  LEAVE_CONVERSATION,
} from "./handlers/websockets";
import { SEND_MESSAGE } from "./handlers/websockets";
import { AdminRouter } from "./routes/admin";

const JWT_SECRET = process.env.JWT_SECRET!;
const app = express();
app.use(express.json());
app.use(cors());
interface AuthWs extends WebSocket {
  userId: string;
  role: string;
  conversations: Set<string>;
}

// Defining WS server
const server = http.createServer(app);
export const wss = new WebSocketServer({ server });
wss.on("connection", async (ws: AuthWs, req) => {
  if (!req.url) return;

  const authWs = ws as AuthWs; // Cast after auth
  authWs.conversations = new Set<string>();

  const url = new URL(req.url, "http:localhost");
  const token = url.searchParams.get("token");

  if (!token) {
    authWs.send(
      JSON.stringify({
        event: "ERROR",
        data: {
          message: "Token is missing.",
        },
      })
    );
    return authWs.close();
  }

  try {
    const decoded = jwt.verify(token as string, JWT_SECRET) as {
      userId: string;
      role: string;
    };
    authWs.userId = decoded.userId;
    authWs.role = decoded.role;
    console.log(ws);
  } catch (error) {
    authWs.send(
      JSON.stringify({
        event: "ERROR",
        data: {
          message: "Unauthorized or invalid token",
        },
      })
    );
    return authWs.close();
  }

  ws.on("message", (event) => {
    const data = JSON.parse(event.toString());
    dispatchEvent(authWs, data);
  });
});

const uri = process.env.MONGODB_URI!;
mongoose.connect(uri);

app.use("/auth", authRouter);
app.use("/", ServiceRouter);
app.use("/admin", AdminRouter);

//START HTTP+WS SERVER
server.listen(3000, () => {
  console.log("Server + WebSocket running on http://localhost:3000");
});

function dispatchEvent(authWs: AuthWs, data: any) {
  switch (data.event) {
    case "JOIN_CONVERSATION":
      return JOIN_CONVERSATION(authWs, data);
    case "SEND_MESSAGE":
      return SEND_MESSAGE(authWs, data);
    case "LEAVE_CONVERSATION":
      return LEAVE_CONVERSATION(authWs, data);
    case "CLOSE_CONVERSATION":
      return CLOSE_CONVERSATION(authWs, data);
    default:
      // Send unknown event error
      authWs.send(
        JSON.stringify({
          event: "ERROR",
          data: {
            message: `Unknown event: ${data.event}`,
          },
        })
      );
      authWs.close();
      return;
  }
}
