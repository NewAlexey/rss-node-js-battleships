import { EventEmitter } from "../../utils/EventEmitter";
import { FrontEventTypeModel } from "../../models/FrontEventTypeModel";
import { emitDataHandler } from "../../utils/emitDataHandler";
import { ControllerModel, EventHandlerMapType } from "../ControllerModel";
import { BaseMessageModel } from "../../models/BaseMessageModel";
import { ServerEventModel } from "../../models/ServerEventModel";
import { WinnersService } from "../winners/winners.service";

import { AttackHandlerReturnDataType, GameService } from "./game.service";
import { GameModel } from "./models/GameModel";
import { GameActionService } from "./game-action.service";
import {
    AddShipsEventData,
    CreateGameEmitDataType,
    PlayerAttackEventDataType,
    PlayerRandomAttackEventDataType,
    PlayerTurnEmitDataType,
    StartGameEmitDataType,
} from "./game.types";

export class GameController implements ControllerModel {
    private readonly gameService: GameService = new GameService();
    private readonly winnerService: WinnersService = new WinnersService();
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
        [FrontEventTypeModel.PLAYER_RANDOM_ATTACK]: (
            data: BaseMessageModel<PlayerRandomAttackEventDataType>,
            socketId: number,
        ) => this.playerRandomAttackHandler(data.data, socketId),
    };

    constructor(eventEmitter: EventEmitter) {
        this.eventEmitter = eventEmitter;
        this.actionService = new GameActionService(
            eventEmitter,
            this.gameService,
            this.winnerService,
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
        this.createSinglePlayGameHandler();
    }

    private playerRandomAttackHandler(
        { gameId, indexPlayer }: PlayerRandomAttackEventDataType,
        socketId: number,
    ): void {
        const { x, y } = this.gameService.generatePlayerRandomAttackPosition(
            gameId,
            indexPlayer,
        );

        this.playerAttackHandler({ gameId, x, indexPlayer, y }, socketId);
    }

    private playerAttackHandler(
        { gameId, y, x, indexPlayer }: PlayerAttackEventDataType,
        socketId: number,
    ) {
        const game = this.gameService.getGame(gameId);

        if (!game) {
            throw new Error("Something wrong with game.");
        }

        const attackResult: AttackHandlerReturnDataType =
            this.gameService.attackHandler(game, socketId, indexPlayer, x, y);

        const opponentPlayer = this.gameService.getOpponentPlayerByPlayerId(
            game,
            indexPlayer,
        );

        this.actionService.attackHandler({
            attackResult,
            opponentPlayer,
            game,
            socketId,
            x,
            y,
        });
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

        if (!isPlayersReady) {
            return;
        }

        this.eventEmitter.emit(ServerEventModel.GAME_START, game.id);
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

                this.eventEmitter.emit(nextMovePlayer.socketId, data);
                this.eventEmitter.emit(waitMovePlayer.socketId, data);
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

                this.eventEmitter.emit(firstPlayer.socketId, firstPlayerData);
                this.eventEmitter.emit(secondPlayer.socketId, secondPlayerData);
                this.eventEmitter.emit(ServerEventModel.PLAYER_TURN, gameId);
            },
        );
    }

    private createSinglePlayGameHandler(): void {
        this.eventEmitter.subscribe(
            ServerEventModel.SINGLE_PLAY_GAME_CREATE,
            (usersSocketId: number[]) => {
                const { createdGame, playerData } =
                    this.gameService.createSinglePlayGameHandler(usersSocketId);

                this.eventEmitter.emit(
                    playerData.socketId,
                    emitDataHandler<CreateGameEmitDataType>(
                        FrontEventTypeModel.GAME_CREATE,
                        {
                            idGame: createdGame.id,
                            idPlayer: playerData.playerId,
                        },
                    ),
                );
            },
        );
    }

    private createGameHandler(): void {
        this.eventEmitter.subscribe(
            ServerEventModel.GAME_CREATE,
            (usersSocketId: number[]) => {
                const { createdGame, firstPlayer, secondPlayer } =
                    this.gameService.createGameHandler(usersSocketId);

                this.eventEmitter.emit(
                    firstPlayer.socketId,
                    emitDataHandler<CreateGameEmitDataType>(
                        FrontEventTypeModel.GAME_CREATE,
                        {
                            idGame: createdGame.id,
                            idPlayer: firstPlayer.playerId,
                        },
                    ),
                );
                this.eventEmitter.emit(
                    secondPlayer.socketId,
                    emitDataHandler<CreateGameEmitDataType>(
                        FrontEventTypeModel.GAME_CREATE,
                        {
                            idGame: createdGame.id,
                            idPlayer: secondPlayer.playerId,
                        },
                    ),
                );
            },
        );
    }
}
