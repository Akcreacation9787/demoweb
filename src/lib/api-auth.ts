import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get("ater_token")?.value || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return verifyToken(token);
}
