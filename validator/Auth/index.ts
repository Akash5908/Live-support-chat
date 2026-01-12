import z from "zod";
import { Role } from "../../constants";

export const signinValidator = z.object({
  email: z.email("Please enter a valid email"),
  password: z.string(),
});

export const signupValidator = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(3),
    name: z.string().min(3),
    role: z.enum(Object.values(Role)),
    supervisorId: z
      .string()
      .regex(
        /^[a-zA-Z0-9]+$/,
        "Supervisor ID must contain only letters and numbers (no dashes)"
      )
      .optional(),
  })
  .refine((data) => {
    if (data.role === Role.Agent) {
      return !!data.supervisorId;
    } else {
      return true;
    }
  });
