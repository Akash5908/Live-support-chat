"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signupValidator = exports.signinValidator = void 0;
const zod_1 = __importDefault(require("zod"));
const constants_1 = require("../constants");
exports.signinValidator = zod_1.default.object({
    email: zod_1.default.email("Please enter a valid email"),
    password: zod_1.default.string(),
});
exports.signupValidator = zod_1.default.object({
    email: zod_1.default.string().email("Enter a valid email"),
    password: zod_1.default.string().min(3).max(8),
    name: zod_1.default.string().min(3),
    role: zod_1.default.enum(Object.values(constants_1.Role)),
});
