import { Server as ServerType } from "ws";

import { WSServer } from "./ws-server";
import { BaseMessageModel } from "./models/BaseMessageModel";
import { ControllerClassModel } from "./modules/ControllerModel";
import { EventEmitter } from "./utils/EventEmitter";

export class App {
    private readonly server: ServerType;

    private readonly appEventEmitter = new EventEmitter();

    private eventTypeMap: Map<
        string,
        (data: BaseMessageModel<any>, socketId: number) => void
    > = new Map();

    constructor(port: number | string, services: ControllerClassModel[]) {
        this.addServiceEventTypeHandlers(services);
        this.server = new WSServer(
            port,
            this.appEventEmitter,
            (data, socketId) => this.addMessageHandler(data, socketId),
        ).server;
    }

    private addServiceEventTypeHandlers(services: ControllerClassModel[]) {
        services.forEach((Service) => {
            const serviceInstance = new Service(this.appEventEmitter);
            const serviceEventType = serviceInstance.getEventHandlerMap();

            Object.entries(serviceEventType).forEach(([event, handler]) => {
                this.eventTypeMap.set(event, handler);
            });
        });
    }

    private addMessageHandler(data: BaseMessageModel<any>, socketId: number) {
        const serviceHandler = this.eventTypeMap.get(data.type);

        if (!serviceHandler) {
            console.log("data~~", data);
            console.error("Bad event type");

            return;
        }

        serviceHandler(data, socketId);
    }
}
