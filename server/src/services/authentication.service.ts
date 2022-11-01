import { scrypt, randomBytes } from "crypto";
import { ChatsinoLogger } from "logging";
import { Client, ClientRepository } from "repositories";
import { now } from "helpers";
import * as config from "config";
import { CacheService } from "./cache.service";

export interface AuthenticatedClient extends Omit<Client, "hash" | "salt"> {
  connectedAt: number;
}

export class AuthenticationService {
  public static instance = new AuthenticationService();

  private logger = new ChatsinoLogger(this.constructor.name);
  private clientRepository = ClientRepository.instance;
  private cacheService = CacheService.instance;

  public async signup(
    username: string,
    password: string
  ): Promise<AuthenticatedClient> {
    try {
      this.logger.info(
        { client: username },
        "A client is attempting to sign up."
      );

      if (password.length < config.MINIMUM_PASSWORD_SIZE) {
        throw new Error(
          `Passwords must be a minimum of ${config.MINIMUM_PASSWORD_SIZE} characters.`
        );
      }

      const salt = randomBytes(config.SALT_SIZE).toString("hex");
      const hash = await this.generateHash(password, salt);

      await this.clientRepository.createClient(username, hash, salt);

      const client = await this.clientRepository.getClientByUsername(username);

      if (client) {
        return this.createAuthenticatedClient(client);
      } else {
        throw new Error(
          `Could not find new client with username of ${username}.`
        );
      }
    } catch (error) {
      this.logger.error(
        { client: username, error: (error as Error).message },
        "A client was unable to sign up."
      );

      throw error;
    }
  }

  public async signin(
    username: string,
    password: string
  ): Promise<AuthenticatedClient> {
    try {
      this.logger.info(
        { client: username },
        "A client is attempting to sign in."
      );

      const client = await this.clientRepository.getClientByUsername(username);

      if (client) {
        const hash = await this.generateHash(password, client.salt);

        if (client.hash === hash) {
          const authenticatedClient = await this.createAuthenticatedClient(
            client
          );

          this.logger.info(
            { client: username },
            "A client successfully signed in."
          );

          return authenticatedClient;
        } else {
          throw new Error(`client provided an invalid password.`);
        }
      } else {
        throw new Error(`client with username of ${username} was not found.`);
      }
    } catch (error) {
      this.logger.error(
        { client: username, error: (error as Error).message },
        "A client was unable to sign in."
      );

      throw error;
    }
  }

  public async signout(username: string) {
    try {
      this.logger.info(
        { client: username },
        "A client is attempting to sign out."
      );

      await this.destroyClientAccessToken(username);
      await this.destroyClientRefreshToken(username);

      this.logger.info(
        { client: username },
        "A client successfully signed out."
      );
    } catch (error) {
      this.logger.error(
        { client: username, error: (error as Error).message },
        "A client was unable to sign out."
      );

      throw error;
    }
  }

  public async validateToken(token: string) {
    try {
      await this.cacheService.verifyToken(token);
      return true;
    } catch {
      return false;
    }
  }

  public async refreshToken(token: string) {
    const refreshTokenIsValid = await this.validateToken(token);

    if (refreshTokenIsValid) {
      return {
        access: await this.createClientAccessToken(""),
        refresh: await this.createClientRefreshToken(""),
      };
    } else {
      throw new Error("Refresh token is not valid.");
    }
  }

  private generateHash(input: string, salt: string): Promise<string> {
    return new Promise((resolve, reject) =>
      scrypt(input, salt, config.HASH_SIZE, (err, hash) =>
        err ? reject(err) : resolve(hash.toString("hex"))
      )
    );
  }

  private async createAuthenticatedClient(client: Client) {
    return {
      id: client.id,
      username: client.username,
      connectedAt: now(),
    };
  }

  // Access Tokens
  private formatClientAccessLabel(username: string) {
    return `${username}/Access`;
  }

  public createClientAccessToken(username: string) {
    return this.cacheService.createToken(
      this.formatClientAccessLabel(username),
      {
        username,
        kind: "access",
      },
      config.JWT_ACCESS_EXPIRATON_TIME
    );
  }

  public destroyClientAccessToken(username: string) {
    return this.cacheService.destroyToken(
      this.formatClientAccessLabel(username)
    );
  }

  // Refresh Tokens
  private formatClientRefreshLabel(username: string) {
    return `${username}/Refresh`;
  }

  public createClientRefreshToken(username: string) {
    return this.cacheService.createToken(
      this.formatClientRefreshLabel(username),
      {
        username,
        kind: "refresh",
      },
      config.JWT_REFRESH_EXPIRATION_TIME
    );
  }

  public destroyClientRefreshToken(username: string) {
    return this.cacheService.destroyToken(
      this.formatClientRefreshLabel(username)
    );
  }
}
