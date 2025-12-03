import { NextResponse } from "next/server";
import { generateKeyPair, SignJWT, jwtVerify } from "jose";
import { webcrypto } from "crypto";

const subtle = webcrypto.subtle;

type KeyPair = { publicKey: CryptoKey; privateKey: CryptoKey };

let keypairPromise: Promise<KeyPair> | null = null;

function normalizeKey(input?: string) {
  if (!input) return null;
  const trimmed = input.trim();
  if (trimmed.includes("BEGIN")) {
    return Buffer.from(
      trimmed
        .replace(/-----BEGIN [^-]+-----/g, "")
        .replace(/-----END [^-]+-----/g, "")
        .replace(/\s+/g, ""),
      "base64"
    );
  }
  return Buffer.from(trimmed, "base64");
}

async function loadKeys(): Promise<KeyPair> {
  if (keypairPromise) return keypairPromise;
  keypairPromise = (async () => {
    const envPriv = normalizeKey(process.env.JWT_ES256_PRIVATE || process.env.JWT_ES256_PRIVATE_PEM);
    const envPub = normalizeKey(process.env.JWT_ES256_PUBLIC || process.env.JWT_ES256_PUBLIC_PEM);
    if (envPriv && envPub) {
      try {
        const privateKey = await subtle.importKey(
          "pkcs8",
          envPriv,
          { name: "ECDSA", namedCurve: "P-256" },
          true,
          ["sign"]
        );
        const publicKey = await subtle.importKey(
          "spki",
          envPub,
          { name: "ECDSA", namedCurve: "P-256" },
          true,
          ["verify"]
        );
        return { publicKey, privateKey };
      } catch (err) {
        console.error("Failed to import ES256 keys from env, falling back to generated keys:", err);
      }
    }
    return await generateKeyPair("ES256");
  })();
  return keypairPromise;
}

export async function signToken(payload: Record<string, unknown>) {
  const { privateKey } = await loadKeys();
  const exp = Math.floor(Date.now() / 1000) + 15 * 60; // 15 minutes
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "ES256" })
    .setExpirationTime(exp)
    .sign(privateKey);
}

export async function verifyToken(token: string) {
  const { publicKey } = await loadKeys();
  const { payload } = await jwtVerify(token, publicKey, { algorithms: ["ES256"] });
  return payload;
}

export function setAuthCookies(token: string, res: NextResponse) {
  res.cookies.set("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 15,
  });
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.delete("accessToken");
}
