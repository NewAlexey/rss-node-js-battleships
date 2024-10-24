import { emitDataHandler } from "../../utils/emitDataHandler";
import { FrontEventTypeModel } from "../../models/FrontEventTypeModel";
import { ServerEventModel } from "../../models/ServerEventModel";
import { EventEmitter } from "../../utils/EventEmitter";

import { PlayerDataModel } from "./models/PlayerDataModel";
import { GameModel } from "./models/GameModel";
import {
    GameFinishEmitDataType,
    PlayerAttackEmitDataType,
} from "./game.controller";
import { GameService } from "./game.service";

export class GameActionService {
    private readonly eventEmitter: EventEmitter;
    private readonly gameService: GameService;

    constructor(eventEmitter: EventEmitter, gameService: GameService) {
        this.eventEmitter = eventEmitter;
        this.gameService = gameService;
    }

    public finishActionHandler(props: FinishActionPropsType): void {
        const { game, opponentPlayer, socketId } = props;

        const winnerPlayer = this.gameService.getCurrentPlayerByUserId(
            game,
            socketId,
        );

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
        this.gameService.removeGame(game.id);
        //TODO remove early created room
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
        this.eventEmitter.emit(opponentPlayer.userId, data);
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
        this.eventEmitter.emit(opponentPlayer.userId, data);
        this.eventEmitter.emit(ServerEventModel.PLAYER_TURN, game.id);
    }

    public killedActionHandler(props: BaseActionPropsType): void {
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
        this.eventEmitter.emit(opponentPlayer.userId, data);

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
            this.eventEmitter.emit(opponentPlayer.userId, killedData);
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

type BaseActionPropsType = {
    game: GameModel;
    socketId: number;
    opponentPlayer: PlayerDataModel;
    positionList: { x: number; y: number }[];
    x: number;
    y: number;
};
