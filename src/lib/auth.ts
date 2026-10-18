import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "ater_kompany_super_secret_2026";
const JWT_EXPIRES = "7d";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}
export function signToken(payload: JWTPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}
export async function getAuthFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ater_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}
export function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
export function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
export function generateReferenceId() {
  return "ATK" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}
