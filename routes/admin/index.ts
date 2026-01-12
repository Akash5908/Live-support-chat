import express from "express";
import { ConversationModel } from "../../model/conversation";
import { UserModel } from "../../model/auth";
import { Role, Status } from "../../constants";
import { tokenValidator } from "../auth";

const router = express.Router();

router.get("/analytics", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Token is missing.",
    });
  }
  try {
    const decoded = tokenValidator(token as string);
    if (decoded.role !== Role.Admin) {
      return res.status(403).json({
        success: false,
        error: "Permission denied",
      });
    }
    const result = await UserModel.aggregate([
      {
        $match: {
          role: Role.Agent,
          supervisorId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$supervisorId",
          name: { $first: "$name" },
          agentCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "conversations",
          localField: "_id",
          foreignField: "supervisorId",
          as: "conversations",
        },
      },
      {
        $addFields: {
          conversationsHandled: { $size: "$conversations" },
        },
      },
      {
        $project: {
          supervisorId: "$_id",
          supervisorName: 1,
          agents: 1,
          conversationsHandled: 1,
        },
      },
    ]);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export { router as AdminRouter };
