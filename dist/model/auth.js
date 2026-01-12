"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongoose_2 = require("mongoose");
const constants_1 = require("../constants");
const userSchema = new mongoose_2.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: Object.values(constants_1.Role),
        required: true,
    },
    supervisorId: {
        type: mongoose_2.Types.ObjectId,
        required: false,
        default: null,
    },
});
exports.UserModel = mongoose_1.default.model("Users", userSchema);
