import { EventEmitter } from "../../utils/EventEmitter";
import { FrontEventTypeModel } from "../../models/FrontEventTypeModel";
import { generateId } from "../../utils/generateId";
import { emitDataHandler } from "../../utils/emitDataHandler";
import { ControllerModel, EventHandlerMapType } from "../ControllerModel";
import { BaseMessageModel } from "../../models/BaseMessageModel";
import { ServerEventModel } from "../../models/ServerEventModel";

import { AttackHandlerReturnDataType, GameService } from "./game.service";
import { GameModel } from "./models/GameModel";
import { ShipModel } from "./models/ShipModel";
import { GameActionService } from "./game-action.service";

export class GameController implements ControllerModel {
    private readonly gameService: GameService = new GameService();
    private readonly eventEmitter: EventEmitter;

    private readonly actionService: GameActionService;

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
        this.actionService = new GameActionService(
            eventEmitter,
            this.gameService,
        );
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
        try {
            const game = this.gameService.getGame(gameId);

            if (!game) {
                throw new Error("Something wrong with game.");
            }

            const attackResult: AttackHandlerReturnDataType =
                this.gameService.attackHandler(
                    game,
                    socketId,
                    indexPlayer,
                    x,
                    y,
                );

            const opponentPlayer = this.gameService.getOpponentPlayerByPlayerId(
                game,
                indexPlayer,
            );

            switch (attackResult.status) {
                case "finish": {
                    this.actionService.finishActionHandler({
                        game,
                        socketId,
                        opponentPlayer,
                    });

                    break;
                }

                case "shot": {
                    this.actionService.shotActionHandler({
                        x,
                        y,
                        game,
                        socketId,
                        opponentPlayer,
                    });

                    break;
                }

                case "miss": {
                    this.actionService.missActionHandler({
                        x,
                        y,
                        game,
                        socketId,
                        opponentPlayer,
                    });

                    break;
                }

                case "killed": {
                    this.actionService.killedActionHandler({
                        x,
                        y,
                        game,
                        socketId,
                        opponentPlayer,
                        positionList: attackResult.positionList,
                    });

                    break;
                }
            }
        } catch (error) {
            console.error(error);
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

    private playerTurnHandler(): void {
        this.eventEmitter.subscribe(
            ServerEventModel.PLAYER_TURN,
            (gameId: number) => {
                const game: GameModel | undefined =
                    this.gameService.getGame(gameId);

                if (!game) {
                    throw new Error("Something wrong with game");
                }

                const { nextMovePlayer, waitMovePlayer } =
                    this.gameService.getNextMovePlayers(game);

                const data = emitDataHandler<PlayerTurnEmitDataType>(
                    FrontEventTypeModel.PLAYER_TURN,
                    { currentPlayer: nextMovePlayer.playerId },
                );

                this.eventEmitter.emit(nextMovePlayer.userId, data);
                this.eventEmitter.emit(waitMovePlayer.userId, data);
            },
        );
    }

    private startGameHandler(): void {
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
