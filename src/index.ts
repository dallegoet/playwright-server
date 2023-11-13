import playwright from "playwright-extra";
import initStealth from "puppeteer-extra-plugin-stealth";
import winston, { createLogger, transports } from "winston";
import config from "./config";
import Server from "./Server";
import path from "path";

const stealth = initStealth();

const logger = createLogger({
  level: config.LOG_LEVEL,
  format: winston.format.json(),
  transports: [new transports.Console()],
  defaultMeta: { service: "playwright-server" },
});

const browserType = config.BROWSER;

const healthcheck = async (wsEndpoint: string) => {
  try {
    const browser = await playwright[browserType].connect(wsEndpoint, {
      headers: {
        ...(config.ACCESS_TOKEN ? { authorization: `Bearer ${config.ACCESS_TOKEN}` } : {}),
      },
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.close();
    await context.close();
    await browser.close();
  } catch (e) {
    logger.error(`server healthcheck failed`, { e });
    process.exit(1);
  }
};

const handleSignals = (server: Server) => {
  const sigs = ["SIGINT", "SIGTERM", "SIGQUIT"];
  sigs.forEach((sig) => {
    process.on(sig, () => {
      logger.debug(`${sig} signal received.`);
      try {
        server.close(() => {
          logger.info("server stopped");
          process.exit(0);
        });
      } catch (e) {
        logger.error("an error occured while shutting down server", { err: e });
        process.exit(1);
      }
    });
  });
};

(async (): Promise<void> => {
  const iStillDontCareAboutCookies = path.join(__dirname, "..", "extensions", "i-still-dont-care-about-cookies");
  const ublock = path.join(__dirname, "..", "extensions", "ublock");

  playwright[browserType].use(stealth);
  const browserServer = await playwright[browserType].launchServer({
    ignoreDefaultArgs: ["--disable-extensions", "--enable-automation"],
    args: [`--load-extension=${ublock},${iStillDontCareAboutCookies}`],
  });
  const wsEndpoint = browserServer.wsEndpoint();
  logger.info(`${browserType} server listening on ${wsEndpoint}`);
  healthcheck(wsEndpoint);

  const server = new Server({ logger, wsEndpoint, port: config.PORT, accessToken: config.ACCESS_TOKEN });
  server.listen();
  healthcheck(`ws://localhost:${config.PORT}`);
  handleSignals(server);
})();
