import { WebSocket } from "ws";
import { ConversationModel } from "../model/conversation";
import { Role } from "../constants";

interface AuthWs extends WebSocket {
  userId: string;
  role: string;
  conversations: Set<string>;
}

interface eventProp {
  conversationId: string;
  content: string;
  role: string;
}

const conversations = new Map<string, Set<AuthWs>>(); // Creating global rooms
const messageArray: any[] = [];

export async function JOIN_CONVERSATION(authWs: AuthWs, data: eventProp) {
  const checkingAgent = await validAgent(authWs, data.conversationId);
  const checkingUser = await validUser(authWs, data.conversationId);
  if (!checkingAgent) {
    authWs.send(
      JSON.stringify({
        event: "ERROR",
        data: {
          message: "This conversaiton is not assinged to you.",
        },
      })
    );
    return authWs.close();
  }
  if (checkingUser) {
    authWs.send(
      JSON.stringify({
        event: "ERROR",
        data: {
          message: "Not allowed to access this conversation",
        },
      })
    );
    return authWs.close();
  }

  if (!conversations.has(data.conversationId)) {
    conversations.set(data.conversationId, new Set()); //Create a new room in the global conversations
  }
  conversations.get(data.conversationId)!.add(authWs); // ← CLIENT JOINS HERE
  authWs.conversations.add(data.conversationId);
  authWs.send(
    JSON.stringify({
      event: "JOINED_CONVERSATION",
      data: {
        conversationId: data.conversationId,
        status: "assigned",
      },
    })
  );
  messageArray
    .filter((e) => e.conversationId === data.conversationId)
    .forEach((message) => authWs.send(JSON.stringify(message)));
}

export function SEND_MESSAGE(authWs: AuthWs, data: eventProp) {
  if (!authWs.conversations.has(data.conversationId)) {
    authWs.send(
      JSON.stringify({
        event: "ERROR",
        data: {
          message: "You must join the conversation first",
        },
      })
    );
  }
  const room = conversations.get(data.conversationId);
  if (!room) return;
  messageArray.push({
    conversationId: data.conversationId,
    senderRole: data.role,
    content: data.content,
    from: authWs.userId,
    timestamp: Date.now(),
  });

  room.forEach((client) => {
    //  Check connection alive
    if (client.readyState === WebSocket.OPEN && client !== authWs) {
      client.send(
        JSON.stringify({
          type: "new-message",
          data: {
            senderId: authWs.userId,
            senderRole: authWs.role,
            content: data.content,
            createdAt: new Date().toISOString(),
          },
        })
      );
    }
  });
}

export function LEAVE_CONVERSATION(authWs: AuthWs, data: eventProp) {
  const room = conversations.get(data.conversationId);
  room?.delete(authWs);
  authWs.send(
    JSON.stringify({
      event: "LEFT_CONVERSATION",
      data: {
        conversationId: data.conversationId,
      },
    })
  );
}

export function CLOSE_CONVERSATION(authWs: AuthWs, data: eventProp) {
  if (authWs.role !== "agent") {
    return authWs.send(
      JSON.stringify({
        event: "ERROR",
        data: {
          message: "Forbidden for this role",
        },
      })
    );
  }
  if (!conversations.has(data.conversationId)) {
    return authWs.send(
      JSON.stringify({
        event: "ERROR",
        data: {
          message: "Conversation already closed",
        },
      })
    );
  }
  conversations.delete(data.conversationId);

  authWs.send(
    JSON.stringify({
      event: "CONVERSATION_CLOSED",
      data: {
        conversationId: data.conversationId,
      },
    })
  );
}

// Validations
async function validAgent(authWs: AuthWs, conversationId: string) {
  const conversation = await ConversationModel.findById(conversationId);
  if (String(conversation?.agentId) === authWs.userId) {
    return true;
  } else {
    return false;
  }
}

async function validUser(authWs: AuthWs, conversationId: string) {
  const conversation = await ConversationModel.findById(conversationId);
  if (String(conversation?.candidateId) === authWs.userId) {
    return true;
  } else {
    return false;
  }
}
