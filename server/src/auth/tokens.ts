import * as config from "config";
import { Response } from "express";
import { getClientByIdentifier, Client } from "persistence";
import { ensureCacheConnected, JWT_REDIS } from "persistence";
import { clientSchema } from "schemas";

export const TOKEN_KEY = "token";

export async function createToken(
  label: string,
  values: Record<string, unknown> = {},
  expiresIn: number
) {
  ensureCacheConnected();

  const token = await JWT_REDIS!.sign(
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
  ensureCacheConnected();
  return JWT_REDIS!.verify(tokenString, config.JWT_SECRET);
}

export function decodeToken(tokenString: string) {
  ensureCacheConnected();
  return JWT_REDIS!.decode(tokenString);
}

export function destroyToken(label: string) {
  ensureCacheConnected();
  return JWT_REDIS!.destroy(label);
}

export async function assignToken(res: Response, client: Client) {
  const token = await createToken(
    `Tokens/Access/${client.username}`,
    client,
    config.JWT_ACCESS_EXPIRATON_TIME_SECONDS
  );

  res.cookie(TOKEN_KEY, token, { httpOnly: true, sameSite: "strict" });

  if (process.env.NODE_ENV === "test") {
    return token;
  }
}

export async function revokeToken(res: Response, client: Client) {
  await destroyToken(`Tokens/Access/${client.username}`);
  return res.clearCookie(TOKEN_KEY);
}

export async function validateToken(tokenString: string) {
  try {
    if (!tokenString) {
      return null;
    }

    await verifyToken(tokenString);

    const client = await clientSchema.validate(await decodeToken(tokenString));
    const actualClient = await getClientByIdentifier(client.id);

    if (
      !actualClient ||
      client.username !== actualClient.username ||
      client.permissionLevel !== actualClient.permissionLevel
    ) {
      return null;
    }

    return actualClient;
  } catch (error) {
    return null;
  }
}
