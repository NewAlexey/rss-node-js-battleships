import { EventEmitter } from "../../utils/EventEmitter";
import {
    FrontEventTypeModel,
    ServerEventModel,
} from "../../models/FrontEventTypeModel";
import { generateId } from "../../utils/generateId";
import { GameModel, ShipModel } from "../../models/GameModel";
import { emitDataHandler } from "../../utils/emitDataHandler";
import { ControllerModel, EventHandlerMapType } from "../ControllerModel";
import { BaseMessageModel } from "../../models/BaseMessageModel";

import { GameService } from "./game.service";

export class GameController implements ControllerModel {
    private readonly gameService: GameService = new GameService();
    private readonly eventEmitter: EventEmitter;

    private readonly eventHandlerMap: EventHandlerMapType = {
        [FrontEventTypeModel.SHIPS_ADD]: (
            data: BaseMessageModel<AddShipsEventData>,
        ) => this.addShipsHandler(data.data),
    };

    constructor(eventEmitter: EventEmitter) {
        this.eventEmitter = eventEmitter;
        this.subscribeOnEvent();
    }

    public getEventHandlerMap(): EventHandlerMapType {
        return this.eventHandlerMap;
    }

    private addShipsHandler(data: AddShipsEventData): void {
        const game = this.gameService.addShipsToUser(
            data.gameId,
            data.indexPlayer,
            data.ships,
        );

        if (!game) {
            throw new Error("Something wrong with game.");
        }

        const isPlayersReady =
            game.firstPlayer.isPlayerReady && game.secondPlayer.isPlayerReady;

        if (isPlayersReady) {
            this.eventEmitter.emit(ServerEventModel.GAME_START, game);
        }
    }

    private subscribeOnEvent() {
        this.createGameHandler();
        this.startGameHandler();
    }

    private startGameHandler() {
        this.eventEmitter.subscribe(
            ServerEventModel.GAME_START,
            (game: GameModel) => {
                const { firstPlayer, secondPlayer } = game;

                const firstPlayerData = emitDataHandler(
                    FrontEventTypeModel.GAME_START,
                    {
                        ships: firstPlayer.shipList,
                        currentPlayerIndex: firstPlayer.playerId,
                    },
                );

                const secondPlayerData = emitDataHandler(
                    FrontEventTypeModel.GAME_START,
                    {
                        ships: secondPlayer.shipList,
                        currentPlayerIndex: secondPlayer.playerId,
                    },
                );

                this.eventEmitter.emit(firstPlayer.userId, firstPlayerData);
                this.eventEmitter.emit(secondPlayer.userId, secondPlayerData);
            },
        );
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
                        isPlayerReady: false,
                        playerId: firstPlayerId,
                        userId: firstUserId,
                        shipList: [],
                    },
                    secondPlayer: {
                        isPlayerReady: false,
                        playerId: secondPlayerId,
                        userId: secondUserId,
                        shipList: [],
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
                        FrontEventTypeModel.GAME_CREATE,
                        firstPlayerData,
                    ),
                );
                this.eventEmitter.emit(
                    secondUserId,
                    emitDataHandler(
                        FrontEventTypeModel.GAME_CREATE,
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

export type AddShipsEventData = {
    gameId: number;
    ships: ShipModel[];
    indexPlayer: string;
};
