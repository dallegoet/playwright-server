import { Server as BaseServer, createServer } from "http";
import { Logger } from "winston";
import httpServer, { createProxyServer } from "http-proxy";
import LogHandler from "./handlers/Logger";
import config from "./config";
import AuthHandler from "./handlers/Auth";

class Server {
  private port: number;
  private wsEndpoint: string;
  private server: BaseServer;
  private proxy: httpServer;
  private logger: Logger;

  constructor(config: { port: number; logger: Logger; wsEndpoint: string; accessToken?: string }) {
    const { port, logger, wsEndpoint } = config;

    this.logger = logger;
    this.port = port;
    this.wsEndpoint = wsEndpoint;

    this.proxy = createProxyServer();

    this.server = createServer((req, res) => {
      // fake 500
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.write("Internal Server Error");
      res.end();
    });

    this.handlers();
  }

  private handlers() {
    this.server.on("upgrade", (req, socket, head) => {
      this.proxy.ws(req, socket, head, { target: this.wsEndpoint, ws: true, ignorePath: true });
    });

    this.proxy.on("proxyReqWs", new AuthHandler(this.logger, config.ACCESS_TOKEN).authReqWs);

    this.proxy.on("proxyReqWs", new LogHandler(this.logger).logReqWs);
  }

  public listen(): void {
    this.logger.info(`websocket proxy listening on ws://0.0.0.0:${this.port}`);
    this.server.listen(this.port);
  }

  public close(callback?: (err?: Error) => void) {
    return this.server.close(callback);
  }
}

export default Server;
