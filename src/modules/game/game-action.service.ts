import { emitDataHandler } from "../../utils/emitDataHandler";
import { FrontEventTypeModel } from "../../models/FrontEventTypeModel";
import { ServerEventModel } from "../../models/ServerEventModel";
import { EventEmitter } from "../../utils/EventEmitter";
import { WinnersService } from "../winners/winners.service";

import { PlayerDataModel } from "./models/PlayerDataModel";
import { GameModel } from "./models/GameModel";
import { AttackHandlerReturnDataType, GameService } from "./game.service";
import { GameFinishEmitDataType, PlayerAttackEmitDataType } from "./game.types";

export class GameActionService {
    private readonly eventEmitter: EventEmitter;
    private readonly gameService: GameService;
    private readonly winnerService: WinnersService | null = null;

    constructor(
        eventEmitter: EventEmitter,
        gameService: GameService,
        winnerService?: WinnersService,
    ) {
        this.eventEmitter = eventEmitter;
        this.gameService = gameService;
        this.winnerService = winnerService ? winnerService : null;
    }

    public attackHandler({
        attackResult,
        opponentPlayer,
        game,
        socketId,
        x,
        y,
    }: Omit<BaseActionPropsType, "positionList">): void {
        switch (attackResult.status) {
            case "invalid": {
                return;
            }

            case "finish": {
                this.finishActionHandler({
                    game,
                    socketId,
                    opponentPlayer,
                });

                break;
            }

            case "shot": {
                this.shotActionHandler({
                    x,
                    y,
                    game,
                    socketId,
                    opponentPlayer,
                });

                break;
            }

            case "miss": {
                this.missActionHandler({
                    x,
                    y,
                    game,
                    socketId,
                    opponentPlayer,
                });

                break;
            }

            case "killed": {
                this.killedActionHandler({
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
    }

    public finishActionHandler(props: FinishActionPropsType): void {
        const { game, opponentPlayer, socketId } = props;

        const winnerPlayer: PlayerDataModel =
            this.gameService.getCurrentPlayerByUserId(game, socketId);

        if (this.winnerService && !game.isSinglePlay) {
            this.winnerService.updateWinnersCount(winnerPlayer.socketId);
        }

        if (game.isSinglePlay) {
            this.eventEmitter.emit(
                game.firstPlayer.socketId,
                emitDataHandler<GameFinishEmitDataType>(
                    FrontEventTypeModel.GAME_FINISH,
                    { winPlayer: winnerPlayer.playerId },
                ),
            );
            this.eventEmitter.emit(
                ServerEventModel.SINGLE_PLAY_GAME_FINISH,
                game.secondPlayer.playerId,
            );

            this.gameService.removeRoom(game.firstPlayer.socketId);
            this.gameService.removeGame(game.id);
            this.eventEmitter.emit(ServerEventModel.ROOM_LIST_UPDATE);
        } else {
            this.eventEmitter.emit(
                socketId,
                emitDataHandler<GameFinishEmitDataType>(
                    FrontEventTypeModel.GAME_FINISH,
                    { winPlayer: winnerPlayer.playerId },
                ),
            );
            this.eventEmitter.emit(
                opponentPlayer.socketId,
                emitDataHandler<GameFinishEmitDataType>(
                    FrontEventTypeModel.GAME_FINISH,
                    { winPlayer: winnerPlayer.playerId },
                ),
            );

            this.eventEmitter.emit(ServerEventModel.WINNERS_UPDATE);

            this.gameService.removeRoom(game.firstPlayer.socketId);
            this.gameService.removeRoom(game.secondPlayer.socketId);
            this.gameService.removeGame(game.id);

            this.eventEmitter.emit(ServerEventModel.ROOM_LIST_UPDATE);
        }
    }

    public shotActionHandler(props: ShotActionPropsType): void {
        const { game, opponentPlayer, socketId, y, x } = props;

        const currentPlayer = this.gameService.getCurrentPlayerByUserId(
            game,
            socketId,
        );

        const data = emitDataHandler<PlayerAttackEmitDataType>(
            FrontEventTypeModel.PLAYER_ATTACK,
            {
                status: "shot",
                currentPlayer: currentPlayer.playerId,
                position: { x, y },
            },
        );

        this.eventEmitter.emit(socketId, data);
        this.eventEmitter.emit(opponentPlayer.socketId, data);
        this.eventEmitter.emit(ServerEventModel.PLAYER_TURN, game.id);
    }

    public missActionHandler(props: MissActionPropsType): void {
        const { game, opponentPlayer, socketId, y, x } = props;

        const currentPlayer = this.gameService.getCurrentPlayerByUserId(
            game,
            socketId,
        );

        const data = emitDataHandler<PlayerAttackEmitDataType>(
            FrontEventTypeModel.PLAYER_ATTACK,
            {
                status: "miss",
                currentPlayer: currentPlayer.playerId,
                position: { x, y },
            },
        );

        this.eventEmitter.emit(socketId, data);
        this.eventEmitter.emit(opponentPlayer.socketId, data);
        this.eventEmitter.emit(ServerEventModel.PLAYER_TURN, game.id);
    }

    public killedActionHandler(props: KilledActionPropsType): void {
        const { game, opponentPlayer, socketId, y, x, positionList } = props;

        const currentPlayer = this.gameService.getCurrentPlayerByUserId(
            game,
            socketId,
        );

        const data = emitDataHandler<PlayerAttackEmitDataType>(
            FrontEventTypeModel.PLAYER_ATTACK,
            {
                status: "killed",
                currentPlayer: currentPlayer.playerId,
                position: { x, y },
            },
        );

        this.eventEmitter.emit(socketId, data);
        this.eventEmitter.emit(opponentPlayer.socketId, data);

        positionList.forEach((position) => {
            const killedData = emitDataHandler(
                FrontEventTypeModel.PLAYER_ATTACK,
                {
                    status: "miss",
                    currentPlayer: currentPlayer.playerId,
                    position: { x: position.x, y: position.y },
                },
            );

            this.eventEmitter.emit(socketId, killedData);
            this.eventEmitter.emit(opponentPlayer.socketId, killedData);
        });

        this.eventEmitter.emit(ServerEventModel.PLAYER_TURN, game.id);
    }
}

type FinishActionPropsType = Pick<
    BaseActionPropsType,
    "game" | "opponentPlayer" | "socketId"
>;

type ShotActionPropsType = Pick<
    BaseActionPropsType,
    "game" | "opponentPlayer" | "socketId" | "x" | "y"
>;

type MissActionPropsType = ShotActionPropsType;

type KilledActionPropsType = Omit<BaseActionPropsType, "attackResult">;

type BaseActionPropsType = {
    game: GameModel;
    socketId: number;
    opponentPlayer: PlayerDataModel;
    positionList: { x: number; y: number }[];
    x: number;
    y: number;
    attackResult: AttackHandlerReturnDataType;
};
