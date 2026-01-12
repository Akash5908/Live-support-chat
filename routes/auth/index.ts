import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { signinValidator, signupValidator } from "../../validator/Auth";
import { UserModel } from "../../model/auth";
import { Role } from "../../constants";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET!;

router.post("/login", async (req, res) => {
  const { success, data } = signinValidator.safeParse(req.body);
  if (!success) {
    res.status(403).json("Invalid inputs");
    return;
  }

  try {
    const user = await UserModel.findOne({
      email: data.email,
    });

    const validUser = await bcrypt.compare(
      data.password,
      user?.password as string
    );
    if (validUser) {
      const token = jwt.sign(
        {
          userId: user?._id,
          role: user?.role,
        },
        JWT_SECRET
      );

      res.json({
        success: true,
        data: {
          token: token,
          user: {
            _id: user?._id,
            email: user?.email,
            name: user?.name,
          },
        },
      });
    } else {
      res.status(401).json({
        success: false,
        error: "Password is Inalid.",
      });
    }
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: "User not found",
    });
  }
});

router.post("/signup", async (req, res) => {
  const { success, data, error } = signupValidator.safeParse(req.body);
  const { supervisorId } = req.body;
  if (!success) {
    res.status(400).json("Invalid format schema");
    return;
  }
  if (data.role === Role.Agent) {
    const supervisorValid = await validSupervisor(supervisorId);
    if (!supervisorValid) {
      return res.status(404).json({
        success: false,
        error: "Supervisor not present with this Id!",
      });
    }
  }
  const hashedPassword = hashPassword(data.password);
  try {
    const user = await UserModel.create({
      email: data.email,
      name: data.name,
      password: hashedPassword,
      role: data.role,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user?.id,
        email: user?.email,
        name: user?.name,
        role: user?.role,
      },
    });
  } catch (error: any) {
    res.status(409).json({
      success: false,
      error: "Email already exists",
    });
  }
});

router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  const checkToken = /^[a-zA-Z0-9]+$/;

  if (!token || !checkToken.test(token)) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized, token missing or invalid",
    });
  }
  try {
    const decoded = tokenValidator(token as string);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized, token missing or invalid",
      });
    }
    const user = await UserModel.findOne({
      _id: decoded.userId,
      role: decoded.role,
    });

    res.status(200).json({
      success: true,
      data: {
        _id: user?._id,
        email: user?.email,
        name: user?.name,
        role: user?.role,
      },
    });
  } catch (error) {
    res.status(403).json({
      success: false,
      error: "Unauthorized, token missing or invalid",
    });
  }
});

export default router;

// func to hash a password
const hashPassword = (password: string): string => {
  const saltRounds = 10;

  // Technique 1 (generate a salt and hash on separate function calls):
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(password, salt);
  return hash;
};

// Checking for valid token
export function tokenValidator(token: string) {
  const decodedToken = jwt.verify(token, JWT_SECRET) as {
    userId: string;
    role: string;
  };
  const result = decodedToken;
  return result;
}

// Checking for valid SupervisorID
export async function validSupervisor(supervisorId: string) {
  const supervisor = await UserModel.findOne({
    _id: supervisorId,
  });
  if (!supervisor) {
    return false;
  } else {
    return supervisor;
  }
}
