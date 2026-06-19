import { createHmac } from "node:crypto";

export function signCsrf(value: string) {
  const secret = process.env.SESSION_SECRET ?? "development-secret";
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function verifyCsrf(value: string, signature: string) {
  return signCsrf(value) === signature;
}
