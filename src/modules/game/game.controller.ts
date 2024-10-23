import { EventEmitter } from "../../utils/EventEmitter";
import { EventTypeModel, ServerEventModel } from "../../models/EventTypeModel";
import { generateId } from "../../utils/generateId";
import { GameModel } from "../../models/GameModel";
import { emitDataHandler } from "../../utils/emitDataHandler";
import { ControllerModel, EventHandlerMapType } from "../ControllerModel";

import { GameService } from "./game.service";

export class GameController implements ControllerModel {
    private readonly gameService: GameService = new GameService();
    private readonly eventEmitter: EventEmitter;

    private readonly eventHandlerMap: EventHandlerMapType = {};

    constructor(eventEmitter: EventEmitter) {
        this.eventEmitter = eventEmitter;
        this.subscribeOnEvent();
    }

    public getEventHandlerMap(): EventHandlerMapType {
        return this.eventHandlerMap;
    }

    private subscribeOnEvent() {
        this.createGameHandler();
    }

    private createGameHandler() {
        this.eventEmitter.subscribe(
            ServerEventModel.GAME_CREATE,
            (userIdList: number[]) => {
                const [firstUserId, secondUserId] = userIdList;

                const gameId: number = generateId();

                const firstPlayerId: string = `${gameId}_${firstUserId}`;
                const secondPlayerId: string = `${gameId}_${secondUserId}`;

                const game: GameModel = {
                    id: gameId,
                    firstPlayer: {
                        playerId: firstPlayerId,
                        userId: firstUserId,
                    },
                    secondPlayer: {
                        playerId: secondPlayerId,
                        userId: secondUserId,
                    },
                };

                const createdGame: GameModel = this.gameService.addGame(game);

                const firstPlayerData: CreateGameEmitDataType = {
                    idGame: createdGame.id,
                    idPlayer: firstPlayerId,
                };
                const secondPlayerData: CreateGameEmitDataType = {
                    idGame: createdGame.id,
                    idPlayer: secondPlayerId,
                };

                this.eventEmitter.emit(
                    firstUserId,
                    emitDataHandler(
                        EventTypeModel.GAME_CREATE,
                        firstPlayerData,
                    ),
                );
                this.eventEmitter.emit(
                    secondUserId,
                    emitDataHandler(
                        EventTypeModel.GAME_CREATE,
                        secondPlayerData,
                    ),
                );
            },
        );
    }
}

type CreateGameEmitDataType = {
    idGame: string | number;
    idPlayer: string | number;
};
