import mongoose, { ObjectId, Types } from "mongoose";
import express, { Router } from "express";
import {
  CreateConversationSchema,
  UpdateConversationSchema,
} from "../../validator/Service";
import { ConversationModel } from "../../model/conversation";
import { Role, Status } from "../../constants";
import { UserModel } from "../../model/auth";
import { tokenValidator, validSupervisor } from "../auth";

const router = express.Router();

// Creating conversations route
router.post("/conversations", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Token is missing.",
    });
  }
  const users = tokenValidator(token as string);
  if (users.role !== Role.Candidate) {
    return res
      .status(403)
      .json({ success: false, error: "Forbidden, insufficient permissions" });
  }
  const { success, data } = CreateConversationSchema.safeParse(req.body);
  if (!success) {
    return res.status(400).json({
      success: false,
      error: "Invalid request schema",
    });
  }
  const existingConversation = await ConversationModel.find({
    candidateId: data.candidateId,
    status: { $in: [Status.ASSIGNED, Status.OPEN] },
  });
  if (existingConversation) {
    return res.status(409).json({
      success: false,
      error: "Candidate already has an active conversation",
    });
  }

  // Check for valid supervisorId
  const isSupervisorValid = await validSupervisor(data.supervisorId);
  if (!isSupervisorValid) {
    return res.status(404).json({
      success: false,
      error: "Supervisor is not found!",
    });
  } else if (isSupervisorValid.role !== Role.Supervisor) {
    return res.status(400).json({
      success: false,
      error: "Invalid supervisorId",
    });
  }
  try {
    const conversation = await ConversationModel.create({
      candidateId: new Types.ObjectId(data.candidateId),
      supervisorId: new Types.ObjectId(data.supervisorId),
    });
    res.status(201).json({
      success: true,
      data: {
        _id: conversation._id,
        status: conversation.status,
        supervisorId: conversation.supervisorId,
      },
    });
  } catch (error) {
    res.status(403).json({
      data: {
        success: false,
        error: "Forbidden, insufficient permissions",
      },
    });
  }
});

router.post("/conversations/:id/assign", async (req, res) => {
  const conversationId = req.params.id;
  const { agentId, supervisorId, role } = req.body;
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Token is missing.",
    });
  }

  const { success, data } = UpdateConversationSchema.safeParse({
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
  const user = tokenValidator(token as string);
  if (user.role !== Role.Supervisor) {
    return res.status(403).json({
      success: false,
      error: "Permission denied",
    });
  }

  const agent = await UserModel.findById(agentId);
  if (agent?.supervisorId === supervisorId) {
    return res.status(403).json({
      success: false,
      error: "Agent doesn’t belong to you",
    });
  }
  const isValidAgent = await validAgent(data.agentId, data.supervisorId);
  if (!isValidAgent) {
    return res.status(403).json({
      success: false,
      error: "Agent doesn't belong to you",
    });
  }

  const isValidConversation = await validConversation(
    data.conversationId,
    data.supervisorId
  );
  if (!isValidConversation) {
    return res.status(403).json({
      success: false,
      error: "Conversation doesn't belong to you",
    });
  }
  try {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) return null;
    if (conversation?.status === Status.ASSIGNED) {
      return res.status(403).json({
        success: false,
        error: "Cannot assign agent. Already assigned to other agent.",
      });
    }
    // updating the conversation after checking all requirements
    conversation.agentId = agentId;
    conversation.status = Status.ASSIGNED;
    await conversation.save();

    res.status(200).json({
      success: true,
      data: {
        conversationId: conversationId,
        agentId: data.agentId,
        supervisorId: data.supervisorId,
      },
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: "Cannot find the conversation",
    });
  }
});

router.post("/conversations/:id/close", async (req, res) => {
  const conversationId = req.params.id;
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  try {
    const decoded = tokenValidator(token as string);
    if (decoded.role !== Role.Admin) {
      return res
        .status(403)
        .json({ success: false, error: "Permission denied." });
    }

    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, error: "Conversation not found." });
    }

    if (conversation.status === Status.CLOSED) {
      return res
        .status(400)
        .json({ success: false, error: "Conversation already closed." });
    }

    conversation.status = Status.CLOSED;
    await conversation.save();

    res.status(200).json({
      success: true,
      data: { conversationId, status: "Closed" },
    });
  } catch (error) {
    // Now try-catch only handles REAL errors (token, DB, etc.)
    res.status(500).json({ success: false, error: "Server error." });
  }
});

export { router as ServiceRouter };

// Check if the agent is valid
export async function validAgent(agentId: string, supervisorId: string) {
  const agent = await UserModel.find({
    _id: agentId,
    supervisorId: supervisorId,
  });
  if (agent) {
    return true;
  } else {
    return false;
  }
}

// Checking for a valid conversation
export async function validConversation(
  conversationId: string,
  supervisorId: string
) {
  const conversaiton = await ConversationModel.find({
    _id: conversationId,
    supervisorId: supervisorId,
  });

  if (conversaiton) {
    return true;
  } else {
    return false;
  }
}
