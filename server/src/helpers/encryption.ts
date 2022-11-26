import * as config from "config";
import crypto from "crypto";

const algorithm = "aes-256-cbc";
const key = config.TICKET_SECRET;
const iv = crypto.randomBytes(16);

export function encrypt(text: string) {
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);

  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return { iv: iv.toString("hex"), encryptedData: encrypted.toString("hex") };
}

export function decrypt(text: { iv: string; encryptedData: string }) {
  const iv = Buffer.from(text.iv, "hex");
  const encryptedText = Buffer.from(text.encryptedData, "hex");
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);

  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

export async function generatePasswordSaltHash(input: string) {
  const salt = crypto.randomBytes(config.PASSWORD_SALT_SIZE).toString("hex");
  const hash: string = await new Promise((resolve, reject) =>
    crypto.scrypt(input, salt, config.PASSWORD_HASH_SIZE, (err, hash) =>
      err ? reject(err) : resolve(hash.toString("hex"))
    )
  );

  return { salt, hash };
}
