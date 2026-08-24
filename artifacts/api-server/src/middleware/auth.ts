import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const TOKEN_TTL_SECONDS = 60 * 60 * 12;

type AdminTokenPayload = { sub: string; role: "admin"; exp: number };

function secret() {
  return process.env.ADMIN_JWT_SECRET || "home-goods-hub-development-secret";
}

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decode<T>(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

function signature(input: string) {
  return crypto.createHmac("sha256", secret()).update(input).digest("base64url");
}

export function createAdminToken(email: string) {
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({ sub: email, role: "admin", exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS });
  return `${header}.${payload}.${signature(`${header}.${payload}`)}`;
}

export function getAdminEmailFromRequest(req: Request) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length);
  const [header, payload, tokenSignature] = token.split(".");
  if (!header || !payload || !tokenSignature) return null;
  const expected = signature(`${header}.${payload}`);
  const validSignature = tokenSignature.length === expected.length && crypto.timingSafeEqual(Buffer.from(tokenSignature), Buffer.from(expected));
  if (!validSignature) return null;
  try {
    const claims = decode<AdminTokenPayload>(payload);
    if (claims.role !== "admin" || claims.exp < Math.floor(Date.now() / 1000)) return null;
    return claims.sub;
  } catch {
    return null;
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const email = getAdminEmailFromRequest(req);
  if (!email) return res.status(401).json({ error: "Admin authentication required" });
  res.locals.adminEmail = email;
  return next();
}

function scrypt(password: string, salt: string) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export function verifyAdminPassword(password: string) {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  const configuredHash = process.env.ADMIN_PASSWORD_HASH;
  if (configuredHash) {
    const [salt, hash] = configuredHash.split(":");
    if (!salt || !hash) return false;
    const actual = scrypt(password, salt);
    return actual.length === hash.length && crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(hash));
  }
  if (!configuredPassword) return false;
  const salt = process.env.ADMIN_PASSWORD_SALT || "home-goods-hub-admin";
  const actual = scrypt(password, salt);
  const expected = scrypt(configuredPassword, salt);
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}
