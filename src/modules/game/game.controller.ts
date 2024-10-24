import { EventEmitter } from "../../utils/EventEmitter";
import { FrontEventTypeModel } from "../../models/FrontEventTypeModel";
import { generateId } from "../../utils/generateId";
import { emitDataHandler } from "../../utils/emitDataHandler";
import { ControllerModel, EventHandlerMapType } from "../ControllerModel";
import { BaseMessageModel } from "../../models/BaseMessageModel";
import { ServerEventModel } from "../../models/ServerEventModel";

import { GameService } from "./game.service";
import { GameModel } from "./models/GameModel";
import { ShipModel } from "./models/ShipModel";

export class GameController implements ControllerModel {
    private readonly gameService: GameService = new GameService();
    private readonly eventEmitter: EventEmitter;

    private readonly eventHandlerMap: EventHandlerMapType = {
        [FrontEventTypeModel.SHIPS_ADD]: (
            data: BaseMessageModel<AddShipsEventData>,
        ) => this.addShipsHandler(data.data),
        [FrontEventTypeModel.PLAYER_ATTACK]: (
            data: BaseMessageModel<PlayerAttackEventDataType>,
            socketId: number,
        ) => this.playerAttackHandler(data.data, socketId),
    };

    constructor(eventEmitter: EventEmitter) {
        this.eventEmitter = eventEmitter;
        this.subscribeOnEvent();
    }

    public getEventHandlerMap(): EventHandlerMapType {
        return this.eventHandlerMap;
    }

    private subscribeOnEvent() {
        this.createGameHandler();
        this.startGameHandler();
        this.playerTurnHandler();
    }

    private playerAttackHandler(
        { gameId, y, x, indexPlayer }: PlayerAttackEventDataType,
        socketId: number,
    ) {
        const game = this.gameService.getGame(gameId);

        if (!game) {
            throw new Error("Something wrong with game.");
        }

        const attackResult = this.gameService.attackHandler(
            game,
            indexPlayer,
            x,
            y,
        );

        const opponentPlayer = this.gameService.getOpponentPlayer(
            game,
            indexPlayer,
        );

        switch (attackResult.status) {
            case "finish": {
                const winnerPlayer =
                    game.firstPlayer.userId === socketId
                        ? game.firstPlayer
                        : game.secondPlayer;

                this.eventEmitter.emit(
                    socketId,
                    emitDataHandler<GameFinishEmitDataType>(
                        FrontEventTypeModel.GAME_FINISH,
                        { winPlayer: winnerPlayer.playerId },
                    ),
                );
                this.eventEmitter.emit(
                    opponentPlayer.userId,
                    emitDataHandler<GameFinishEmitDataType>(
                        FrontEventTypeModel.GAME_FINISH,
                        { winPlayer: winnerPlayer.playerId },
                    ),
                );
                this.gameService.removeGame(gameId);
            }
        }
    }

    private addShipsHandler(data: AddShipsEventData): void {
        const game: GameModel | undefined = this.gameService.addShipsToUser(
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
            this.eventEmitter.emit(ServerEventModel.GAME_START, game.id);
        }
    }

    private playerTurnHandler() {
        this.eventEmitter.subscribe(
            ServerEventModel.PLAYER_TURN,
            (gameId: number, playerId?: string) => {
                console.log("turn handler!!");
                console.log("gameId~~", gameId);
                console.log("playerId~~", playerId);

                const currentPlayerMove = this.gameService.getPlayer(
                    gameId,
                    playerId,
                );

                const data = emitDataHandler<PlayerTurnEmitDataType>(
                    FrontEventTypeModel.PLAYER_TURN,
                    { currentPlayer: currentPlayerMove.playerId },
                );

                this.eventEmitter.emit(currentPlayerMove.userId, data);
            },
        );
    }

    private startGameHandler() {
        this.eventEmitter.subscribe(
            ServerEventModel.GAME_START,
            (gameId: number) => {
                const game = this.gameService.getGame(gameId);

                if (!game) {
                    return;
                }

                const { firstPlayer, secondPlayer } =
                    this.gameService.createPlayersGameFields(game);

                const firstPlayerData = emitDataHandler<StartGameEmitDataType>(
                    FrontEventTypeModel.GAME_START,
                    {
                        ships: firstPlayer.shipList,
                        currentPlayerIndex: firstPlayer.playerId,
                    },
                );

                const secondPlayerData = emitDataHandler<StartGameEmitDataType>(
                    FrontEventTypeModel.GAME_START,
                    {
                        ships: secondPlayer.shipList,
                        currentPlayerIndex: secondPlayer.playerId,
                    },
                );

                this.eventEmitter.emit(firstPlayer.userId, firstPlayerData);
                this.eventEmitter.emit(secondPlayer.userId, secondPlayerData);
                this.eventEmitter.emit(ServerEventModel.PLAYER_TURN, gameId);
            },
        );
    }

    private createGameHandler(): void {
        this.eventEmitter.subscribe(
            ServerEventModel.GAME_CREATE,
            (userIdList: number[]) => {
                const [firstUserId, secondUserId] = userIdList;

                const gameId: number = generateId();

                const firstPlayerId: string = `${gameId}_${firstUserId}`;
                const secondPlayerId: string = `${gameId}_${secondUserId}`;

                const game: GameModel = {
                    id: gameId,
                    movePlayerIdTurn: firstPlayerId,
                    firstPlayer: {
                        isPlayerReady: false,
                        playerId: firstPlayerId,
                        userId: firstUserId,
                        shipList: [],
                        gameField: null,
                    },
                    secondPlayer: {
                        isPlayerReady: false,
                        playerId: secondPlayerId,
                        userId: secondUserId,
                        shipList: [],
                        gameField: null,
                    },
                };

                const createdGame: GameModel = this.gameService.addGame(game);

                const firstPlayerData = {
                    idGame: createdGame.id,
                    idPlayer: firstPlayerId,
                };
                const secondPlayerData = {
                    idGame: createdGame.id,
                    idPlayer: secondPlayerId,
                };

                this.eventEmitter.emit(
                    firstUserId,
                    emitDataHandler<CreateGameEmitDataType>(
                        FrontEventTypeModel.GAME_CREATE,
                        firstPlayerData,
                    ),
                );
                this.eventEmitter.emit(
                    secondUserId,
                    emitDataHandler<CreateGameEmitDataType>(
                        FrontEventTypeModel.GAME_CREATE,
                        secondPlayerData,
                    ),
                );
            },
        );
    }
}

type StartGameEmitDataType = {
    ships: ShipModel[];
    currentPlayerIndex: string;
};

export type CreateGameEmitDataType = {
    idGame: string | number;
    idPlayer: string | number;
};

export type AddShipsEventData = {
    gameId: number;
    ships: ShipModel[];
    indexPlayer: string;
};

export type PlayerTurnEmitDataType = {
    currentPlayer: string;
};

export type PlayerAttackEventDataType = {
    x: number;
    y: number;
    gameId: number;
    indexPlayer: string;
};

export type PlayerAttackEmitDataType = {
    position: {
        x: number;
        y: number;
    };
    currentPlayer: string;
    status: "miss" | "killed" | "shot";
};

export type GameFinishEmitDataType = {
    winPlayer: string;
};
