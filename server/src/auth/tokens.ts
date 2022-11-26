import * as config from "config";
import { Response } from "express";
import { SafeClient } from "models";
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

export async function assignToken(res: Response, client: SafeClient) {
  const token = await createToken(
    `Tokens/Access/${client.username}`,
    client,
    config.JWT_ACCESS_EXPIRATON_TIME_SECONDS
  );

  return res.cookie("token", token, { httpOnly: true, sameSite: "strict" });
}

export async function revokeToken(res: Response, client: SafeClient) {
  await destroyToken(`Tokens/Access/${client.username}`);
  return res.clearCookie("token");
}
