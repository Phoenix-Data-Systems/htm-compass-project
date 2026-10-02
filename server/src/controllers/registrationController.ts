import type { Request, Response } from "express";
import { z } from "zod";
import { registerOrganization } from "../services/registrationService.js";

const registrationSchema = z.object({
  organization: z.string().trim().min(1).max(100),
  contactName: z.string().trim().min(1).max(200),
  contactJobTitle: z.string().trim().min(1).max(200),
  contactPhone: z.string().trim().min(1).max(50),
  contactEmail: z.string().trim().email().max(320),
  numberOfFacilities: z.number().int().positive()
});

export async function createOrganizationRegistration(
  req: Request,
  res: Response
): Promise<void> {
  const parsedBody = registrationSchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({
      status: "error",
      message: "Invalid organization registration data",
      errors: parsedBody.error.flatten().fieldErrors
    });
    return;
  }

  try {
    const registration = await registerOrganization(parsedBody.data);

    res.status(201).json({
      status: "ok",
      registration
    });
  } catch (error) {
    console.error("Organization registration failed:", error);

    res.status(500).json({
      status: "error",
      message: "Unable to register organization"
    });
  }
}
