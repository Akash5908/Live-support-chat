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
exports.tokenValidator = tokenValidator;
exports.validSupervisor = validSupervisor;
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const Auth_1 = require("../../validator/Auth");
const auth_1 = require("../../model/auth");
const constants_1 = require("../../constants");
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET;
router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { success, data } = Auth_1.signinValidator.safeParse(req.body);
    if (!success) {
        res.status(403).json("Invalid inputs");
        return;
    }
    try {
        const user = yield auth_1.UserModel.findOne({
            email: data.email,
        });
        const validUser = yield bcrypt_1.default.compare(data.password, user === null || user === void 0 ? void 0 : user.password);
        if (validUser) {
            const token = jsonwebtoken_1.default.sign({
                userId: user === null || user === void 0 ? void 0 : user._id,
                role: user === null || user === void 0 ? void 0 : user.role,
            }, JWT_SECRET);
            res.json({
                success: true,
                data: {
                    token: token,
                    user: {
                        _id: user === null || user === void 0 ? void 0 : user._id,
                        email: user === null || user === void 0 ? void 0 : user.email,
                        name: user === null || user === void 0 ? void 0 : user.name,
                    },
                },
            });
        }
        else {
            res.status(401).json({
                success: false,
                error: "Password is Inalid.",
            });
        }
    }
    catch (error) {
        res.status(404).json({
            success: false,
            error: "User not found",
        });
    }
}));
router.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { success, data, error } = Auth_1.signupValidator.safeParse(req.body);
    const { supervisorId } = req.body;
    if (!success) {
        res.status(400).json("Invalid format schema");
        return;
    }
    if (data.role === constants_1.Role.Agent) {
        const supervisorValid = yield validSupervisor(supervisorId);
        if (!supervisorValid) {
            return res.status(404).json({
                success: false,
                error: "Supervisor not present with this Id!",
            });
        }
    }
    const hashedPassword = hashPassword(data.password);
    try {
        const user = yield auth_1.UserModel.create({
            email: data.email,
            name: data.name,
            password: hashedPassword,
            role: data.role,
        });
        res.status(201).json({
            success: true,
            data: {
                _id: user === null || user === void 0 ? void 0 : user.id,
                email: user === null || user === void 0 ? void 0 : user.email,
                name: user === null || user === void 0 ? void 0 : user.name,
                role: user === null || user === void 0 ? void 0 : user.role,
            },
        });
    }
    catch (error) {
        res.status(409).json({
            success: false,
            error: "Email already exists",
        });
    }
}));
router.get("/me", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    const token = authHeader === null || authHeader === void 0 ? void 0 : authHeader.split(" ")[1];
    const checkToken = /^[a-zA-Z0-9]+$/;
    if (!token || !checkToken.test(token)) {
        return res.status(401).json({
            success: false,
            error: "Unauthorized, token missing or invalid",
        });
    }
    try {
        const decoded = tokenValidator(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized, token missing or invalid",
            });
        }
        const user = yield auth_1.UserModel.findOne({
            _id: decoded.userId,
            role: decoded.role,
        });
        res.status(200).json({
            success: true,
            data: {
                _id: user === null || user === void 0 ? void 0 : user._id,
                email: user === null || user === void 0 ? void 0 : user.email,
                name: user === null || user === void 0 ? void 0 : user.name,
                role: user === null || user === void 0 ? void 0 : user.role,
            },
        });
    }
    catch (error) {
        res.status(403).json({
            success: false,
            error: "Unauthorized, token missing or invalid",
        });
    }
}));
exports.default = router;
// func to hash a password
const hashPassword = (password) => {
    const saltRounds = 10;
    // Technique 1 (generate a salt and hash on separate function calls):
    const salt = bcrypt_1.default.genSaltSync(saltRounds);
    const hash = bcrypt_1.default.hashSync(password, salt);
    return hash;
};
// Checking for valid token
function tokenValidator(token) {
    const decodedToken = jsonwebtoken_1.default.verify(token, JWT_SECRET);
    const result = decodedToken;
    return result;
}
// Checking for valid SupervisorID
function validSupervisor(supervisorId) {
    return __awaiter(this, void 0, void 0, function* () {
        const supervisor = yield auth_1.UserModel.findOne({
            _id: supervisorId,
        });
        if (!supervisor) {
            return false;
        }
        else {
            return supervisor;
        }
    });
}
