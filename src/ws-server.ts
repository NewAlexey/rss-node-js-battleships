import WebSocket, { Server as ServerType, WebSocketServer } from "ws";

import { BaseMessageModel } from "./models/BaseMessageModel";

export class WSServer {
    public readonly server: ServerType;

    constructor(port: number | string, handler: HandlerType) {
        this.server = new WebSocketServer({ port: Number(port) });
        this.init(handler);
        console.log("ws created!");
    }

    private init(handler: HandlerType) {
        this.errorHandler();
        this.connectionHandler(handler);
    }

    private errorHandler() {
        this.server.on("error", (error) => console.error(error));
    }

    private connectionHandler(handler: HandlerType) {
        this.server.on("connection", (socket: WebSocket) => {
            console.log("New socket connected!");

            socket.on("message", (data) => {
                try {
                    const message: BaseMessageModel<string> = JSON.parse(
                        data.toString("utf-8"),
                    );
                    message.data = JSON.parse(message.data);
                    handler(message);
                } catch (error) {
                    console.error(error);
                }
            });
        });
    }
}

type HandlerType = (data: BaseMessageModel<any>) => void;
