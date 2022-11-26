import * as config from "config";
import { ensureRedisInitialized, jwtRedis } from "persistence";

export async function createToken(
  label: string,
  values: Record<string, unknown> = {},
  expiresIn: number
) {
  ensureRedisInitialized();

  const token = await jwtRedis!.sign(
    {
      jti: label,
      ...values,
    },
    config.JWT_SECRET,
    { expiresIn }
  );

  return token;
}

export function verifyToken(tokenString: string) {
  ensureRedisInitialized();
  return jwtRedis!.verify(tokenString, config.JWT_SECRET);
}

export function decodeToken(tokenString: string) {
  ensureRedisInitialized();
  return jwtRedis!.decode(tokenString);
}

export function destroyToken(label: string) {
  ensureRedisInitialized();
  return jwtRedis!.destroy(label);
}

export async function validateToken(tokenString: string) {
  return false;
}
