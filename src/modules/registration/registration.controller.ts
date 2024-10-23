import { BaseMessageModel } from "../../models/BaseMessageModel";
import { ControllerModel, EventHandlerMapType } from "../ControllerModel";
import { EventTypeModel, ServerEventModel } from "../../models/EventTypeModel";
import { EventEmitter } from "../../utils/EventEmitter";
import { emitDataHandler } from "../../utils/emitDataHandler";

import { RegistrationService } from "./registration.service";

export class RegistrationController implements ControllerModel {
    private readonly registrationService: RegistrationService =
        new RegistrationService();
    private readonly eventEmitter: EventEmitter;

    constructor(eventEmitter: EventEmitter) {
        this.eventEmitter = eventEmitter;
    }

    public getEventHandlerMap(): EventHandlerMapType {
        return this.eventHandlerMap;
    }

    private readonly eventHandlerMap: EventHandlerMapType = {
        [EventTypeModel.REGISTRATION]: (
            data: BaseMessageModel<any>,
            socketId: number,
        ) => this.loginOrCreateUserHandler(data, socketId),
    };

    private loginOrCreateUserHandler(
        message: BaseMessageModel<LoginOrCreateDataType>,
        socketId: number,
    ): void {
        const isUserExist = this.registrationService.isUserExist(
            message.data.name,
        );

        if (!isUserExist) {
            const createdUser = this.registrationService.registerUser(
                message.data,
                socketId,
            );

            const data = emitDataHandler(EventTypeModel.REGISTRATION, {
                name: createdUser.name,
                index: createdUser.id,
                error: false,
                errorText: "",
            });

            this.eventEmitter.emit(socketId, data);
            this.eventEmitter.emit(ServerEventModel.ROOM_LIST_UPDATE, socketId);
        } else {
            const isPasswordMatches =
                this.registrationService.isPasswordMatches(
                    message.data.name,
                    message.data.password,
                );

            if (!isPasswordMatches) {
                //TODO emit wrong user data!
            } else {
                //TODO emit wrong user data!
            }
        }
    }
}

type LoginOrCreateDataType = {
    name: string;
    password: string;
};
