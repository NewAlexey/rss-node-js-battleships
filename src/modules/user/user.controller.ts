import { BaseMessageModel } from "../../models/BaseMessageModel";
import { ControllerModel, EventHandlerMapType } from "../ControllerModel";
import { FrontEventTypeModel } from "../../models/FrontEventTypeModel";
import { EventEmitter } from "../../utils/EventEmitter";
import { emitDataHandler } from "../../utils/emitDataHandler";
import { ServerEventModel } from "../../models/ServerEventModel";

import { UserService } from "./user.service";

export class UserController implements ControllerModel {
    private readonly registrationService: UserService = new UserService();
    private readonly eventEmitter: EventEmitter;

    private readonly eventHandlerMap: EventHandlerMapType = {
        [FrontEventTypeModel.REGISTRATION]: (
            data: BaseMessageModel<any>,
            socketId: number,
        ) => this.loginOrCreateUserHandler(data, socketId),
    };

    constructor(eventEmitter: EventEmitter) {
        this.eventEmitter = eventEmitter;
        this.subscribeOnEvent();
    }

    public getEventHandlerMap(): EventHandlerMapType {
        return this.eventHandlerMap;
    }

    private subscribeOnEvent() {
        this.updateWinnerHandler();
    }

    private updateWinnerHandler(): void {
        this.eventEmitter.subscribe(ServerEventModel.WINNERS_UPDATE, () => {
            const userList = this.registrationService.getAll();

            const winnersDataType = userList.map<WinnersUpdateEmitDataType>(
                (user) => ({ wins: user.winsCount, name: user.name }),
            );

            userList.forEach((user) => {
                const data = emitDataHandler<WinnersUpdateEmitDataType[]>(
                    FrontEventTypeModel.WINNERS_UPDATE,
                    winnersDataType,
                );

                this.eventEmitter.emit(user.id, data);
            });
        });
    }

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

            const data = emitDataHandler<LoginEmitDataType>(
                FrontEventTypeModel.REGISTRATION,
                {
                    name: createdUser.name,
                    index: createdUser.id,
                    error: false,
                    errorText: "",
                },
            );

            this.eventEmitter.emit(socketId, data);
            this.eventEmitter.emit(ServerEventModel.ROOM_LIST_UPDATE);
            this.eventEmitter.emit(ServerEventModel.WINNERS_UPDATE);
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

type LoginEmitDataType = {
    name: string;
    index: number;
    error: boolean;
    errorText: string;
};

type WinnersUpdateEmitDataType = {
    name: string;
    wins: number;
};
