import WebSocket, { Server as ServerType, WebSocketServer } from "ws";

import { BaseMessageModel } from "./models/BaseMessageModel";
import { EventEmitter } from "./utils/EventEmitter";

export class WSServer {
    public readonly server: ServerType;

    private readonly eventEmitter: EventEmitter;

    constructor(
        port: number | string,
        eventEmitter: EventEmitter,
        handler: HandlerType,
    ) {
        this.eventEmitter = eventEmitter;
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

            const socketId: number = new Date().getTime();
            const socketCallback = (data: any) => {
                console.log("emitter data!!!", data);
                socket.send(data);
            };

            this.eventEmitter.subscribe(socketId, socketCallback);

            socket.on("message", (data) => {
                try {
                    const message: BaseMessageModel<string> = JSON.parse(
                        data.toString("utf-8"),
                    );

                    if (message.data) {
                        message.data = JSON.parse(message.data);
                    }

                    handler(message, socketId);
                } catch (error) {
                    console.error(error);
                }
            });
        });
    }
}

type HandlerType = (data: BaseMessageModel<any>, socketId: number) => void;
