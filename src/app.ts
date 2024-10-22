import { Server as ServerType } from "ws";

import { WSServer } from "./ws-server";
import { BaseMessageModel } from "./models/BaseMessageModel";
import { ControllerModel } from "./modules/ControllerModel";

export class App {
    private readonly server: ServerType;

    private eventTypeMap: Map<string, (data: BaseMessageModel<any>) => void> =
        new Map();

    constructor(port: number | string, services: ControllerModel[]) {
        this.addServiceEventTypeHandlers(services);
        this.server = new WSServer(port, (data) =>
            this.addMessageHandler(data),
        ).server;
    }

    private addServiceEventTypeHandlers(services: ControllerModel[]) {
        services.forEach((service) => {
            const serviceEventType = service.getEventHandlerMap();

            Object.entries(serviceEventType).forEach(([event, handler]) => {
                this.eventTypeMap.set(event, handler);
            });
        });
    }

    private addMessageHandler(data: BaseMessageModel<any>) {
        const serviceHandler = this.eventTypeMap.get(data.type);

        if (!serviceHandler) {
            console.error("Bad event type");

            return;
        }

        serviceHandler(data);
    }
}
