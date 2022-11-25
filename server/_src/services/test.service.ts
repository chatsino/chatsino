import { ChatsinoLogger } from "../__src/logging";
import { AuthenticationService } from "./authentication.service";

const USERNAME = "user7";
const PASSWORD = "password";

export class TestService {
  private logger = new ChatsinoLogger(this.constructor.name);
  private authorizationService = new AuthenticationService();

  public async createFirstUser() {
    try {
      this.logger.info("Creating first user.");

      await this.authorizationService.signup(USERNAME, PASSWORD);

      this.logger.info("Created first user.");
    } catch {}
  }

  public async signinFirstUser() {
    try {
      this.logger.info("Signing in first user.");

      await this.authorizationService.signin(USERNAME, PASSWORD);

      this.logger.info("Signed in first user.");
    } catch {}
  }
}
