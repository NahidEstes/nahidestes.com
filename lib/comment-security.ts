import { createHmac } from "node:crypto";

function secret() {
  return process.env.COMMENT_IP_HASH_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
}

function digest(value: string) {
  const key = secret();
  return key ? createHmac("sha256", key).update(value).digest("hex") : undefined;
}

export function requestIpHash(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip")?.trim();
  return address ? digest(`ip:${address}`) : undefined;
}

export function privateIdentifier(value: string) {
  return digest(`identifier:${value}`) || "unconfigured";
}
