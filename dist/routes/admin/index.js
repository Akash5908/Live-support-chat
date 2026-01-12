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
exports.AdminRouter = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../model/auth");
const constants_1 = require("../../constants");
const auth_2 = require("../auth");
const router = express_1.default.Router();
exports.AdminRouter = router;
router.get("/analytics", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    const token = authHeader === null || authHeader === void 0 ? void 0 : authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            error: "Token is missing.",
        });
    }
    try {
        const decoded = (0, auth_2.tokenValidator)(token);
        if (decoded.role !== constants_1.Role.Admin) {
            return res.status(403).json({
                success: false,
                error: "Permission denied",
            });
        }
        const result = yield auth_1.UserModel.aggregate([
            {
                $match: {
                    role: constants_1.Role.Agent,
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
}));
