import { BaseMessageModel } from "../../models/BaseMessageModel";
import { ControllerModel, EventHandlerMapType } from "../ControllerModel";
import { FrontEventTypeModel } from "../../models/FrontEventTypeModel";
import { EventEmitter } from "../../utils/EventEmitter";
import { emitDataHandler } from "../../utils/emitDataHandler";
import { ServerEventModel } from "../../models/ServerEventModel";

import { UserService } from "./user.service";
import { UserModel } from "./models/UserModel";

export class UserController implements ControllerModel {
    private readonly userService: UserService = new UserService();
    private readonly eventEmitter: EventEmitter;

    private readonly eventHandlerMap: EventHandlerMapType = {
        [FrontEventTypeModel.REGISTRATION]: (
            data: BaseMessageModel<LoginOrCreateDataType>,
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
        this.disconnectUserHandler();
    }

    private disconnectUserHandler() {
        this.eventEmitter.subscribe(
            ServerEventModel.USER_DISCONNECT,
            (socketId: number) => {
                const user: UserModel | undefined =
                    this.userService.getUserBySocketId(socketId);

                if (!user) {
                    return;
                }

                user.socketId = null;

                this.eventEmitter.emit(ServerEventModel.ROOM_LIST_UPDATE);
            },
        );
    }

    private updateWinnerHandler(): void {
        this.eventEmitter.subscribe(ServerEventModel.WINNERS_UPDATE, () => {
            const userList = this.userService.getAllWinners();

            const winnersDataType = userList.map<WinnersUpdateEmitDataType>(
                (user) => ({ wins: user.winsCount, name: user.name }),
            );

            userList.forEach((user) => {
                if (!user.socketId) {
                    return;
                }

                const data = emitDataHandler<WinnersUpdateEmitDataType[]>(
                    FrontEventTypeModel.WINNERS_UPDATE,
                    winnersDataType,
                );

                this.eventEmitter.emit(user.socketId, data);
            });
        });
    }

    private loginOrCreateUserHandler(
        message: BaseMessageModel<LoginOrCreateDataType>,
        socketId: number,
    ): void {
        const user: UserModel | undefined = this.userService.getUser(
            message.data.name,
        );

        if (!user) {
            this.registerUserHandler(message.data, socketId);

            return;
        }

        const isPasswordMatches = this.userService.isPasswordMatches(
            message.data.name,
            message.data.password,
        );

        if (!isPasswordMatches) {
            this.passwordNotMatchHandler(socketId);

            return;
        }

        if (user.socketId) {
            this.userAlreadyLoginHandler(socketId);
        } else {
            this.loginUserHandler(user.name, socketId);
        }
    }

    private userAlreadyLoginHandler(socketId: number): void {
        const data = emitDataHandler<LoginEmitDataType>(
            FrontEventTypeModel.REGISTRATION,
            {
                name: "",
                index: 0,
                error: true,
                errorText: "User already authorized.",
            },
        );

        this.eventEmitter.emit(socketId, data);
    }

    private loginUserHandler(userName: string, socketId: number): void {
        const data = emitDataHandler<LoginEmitDataType>(
            FrontEventTypeModel.REGISTRATION,
            {
                name: userName,
                index: socketId,
                error: false,
                errorText: "",
            },
        );

        this.userService.loginUser(userName, socketId);
        this.eventEmitter.emit(socketId, data);
        this.eventEmitter.emit(ServerEventModel.ROOM_LIST_UPDATE);
        this.eventEmitter.emit(ServerEventModel.WINNERS_UPDATE);
    }

    private passwordNotMatchHandler(socketId: number): void {
        const data = emitDataHandler<LoginEmitDataType>(
            FrontEventTypeModel.REGISTRATION,
            {
                name: "",
                index: 0,
                error: true,
                errorText: "Check authorized data.",
            },
        );

        this.eventEmitter.emit(socketId, data);
    }

    private registerUserHandler(
        data: LoginOrCreateDataType,
        socketId: number,
    ): void {
        const createdUser = this.userService.registerUser(data, socketId);

        const emitData = emitDataHandler<LoginEmitDataType>(
            FrontEventTypeModel.REGISTRATION,
            {
                name: createdUser.name,
                index: socketId,
                error: false,
                errorText: "",
            },
        );

        this.eventEmitter.emit(socketId, emitData);
        this.eventEmitter.emit(ServerEventModel.ROOM_LIST_UPDATE);
        this.eventEmitter.emit(ServerEventModel.WINNERS_UPDATE);
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
