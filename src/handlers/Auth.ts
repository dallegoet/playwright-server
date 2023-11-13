import { ClientRequest, IncomingMessage } from "http";
import { ServerOptions } from "http-proxy";
import { Socket } from "net";
import { Logger } from "winston";

class AuthHandler {
  private logger: Logger;
  private accessToken?: string;

  constructor(logger: Logger, accessToken?: string) {
    this.logger = logger;
    this.accessToken = accessToken;
  }

  public authReqWs = (proxyReq: ClientRequest, req: IncomingMessage, socket: Socket, options: ServerOptions): void => {
    if (!this.accessToken) {
      return;
    }

    const authorizationHeader = req.headers["authorization"];

    if (!authorizationHeader) {
      this.logger.error(`No authorization header from ${socket.remoteAddress}`);
      this.disconnect(socket, proxyReq);
      return;
    }

    const [, accessToken] = (authorizationHeader as string).split("Bearer ");

    if (accessToken !== this.accessToken) {
      this.logger.error(`Invalid access token from ${socket.remoteAddress} (valid is ${this.accessToken}))`);
      this.disconnect(socket, proxyReq);
      return;
    }
  };

  private disconnect = (socket: Socket, proxyReq: ClientRequest) => {
    proxyReq.end();
    socket.end();
  };
}

export default AuthHandler;
