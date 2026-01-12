import { Types } from "mongoose";
import z from "zod";
import { Role, Status } from "../../constants";

const objectIdSchema = z.string().refine((id) => Types.ObjectId.isValid(id));

export const CreateConversationSchema = z.object({
  supervisorId: objectIdSchema,
  candidateId: z.string(),
  role: z.enum([Role.Candidate]).or(z.literal("candidate")),
});

export const UpdateConversationSchema = z.object({
  agentId: z.string(),
  supervisorId: objectIdSchema,
  conversationId: z.string(),
  role: z.enum([Role.Supervisor]).or(z.literal("supervisor")),
});
