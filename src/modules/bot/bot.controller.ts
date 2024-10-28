import { ControllerModel, EventHandlerMapType } from "../ControllerModel";
import { EventEmitter } from "../../utils/EventEmitter";
import { FrontEventTypeModel } from "../../models/FrontEventTypeModel";
import { BaseMessageModel } from "../../models/BaseMessageModel";
import { ServerEventModel } from "../../models/ServerEventModel";
import { PlayerTurnEmitDataType } from "../game/game.types";
import { PlayerDataModel } from "../game/models/PlayerDataModel";
import { GameActionService } from "../game/game-action.service";
import { GameService } from "../game/game.service";

import { BotService } from "./bot.service";

export class BotController implements ControllerModel {
    private readonly eventEmitter: EventEmitter;
    private readonly gameService: GameService;
    private readonly botService: BotService;
    private readonly actionService: GameActionService;

    private readonly BOT_DESTROY_DELAY_MIN = 1000 * 60 * 30;
    private readonly BOT_ATTACK_DELAY_SEC =
        Number(process.env.BOT_ATTACK_DELAY_MS) || 1500;

    private readonly eventHandlerMap: EventHandlerMapType = {
        [FrontEventTypeModel.SINGLE_PLAY]: (
            data: BaseMessageModel<string>,
            socketId: number,
        ) => this.singlePlayHandler(socketId),
        [FrontEventTypeModel.PLAYER_TURN]: (
            data: BaseMessageModel<PlayerTurnEmitDataType>,
            botId: number,
        ) => this.gameTurnHandler(data.data, botId),
    };

    constructor(eventEmitter: EventEmitter) {
        this.eventEmitter = eventEmitter;
        this.subscribeOnEvent();
        this.gameService = new GameService();
        this.botService = new BotService(this.gameService);
        this.actionService = new GameActionService(
            eventEmitter,
            this.gameService,
        );
    }

    public getEventHandlerMap(): EventHandlerMapType {
        return this.eventHandlerMap;
    }

    private subscribeOnEvent() {
        this.botAttackHandler();
        this.unsubscribeHandler();
    }

    private unsubscribeHandler() {
        const callback = (botId: number) =>
            this.eventEmitter.removeEvent(botId);

        this.eventEmitter.subscribe(
            ServerEventModel.SINGLE_PLAY_GAME_FINISH,
            callback,
        );
    }

    private gameTurnHandler(data: PlayerTurnEmitDataType, botId: number): void {
        const { currentPlayer } = data;

        const { game, isBotTurn } = this.botService.isBotTurn(
            botId,
            currentPlayer,
        );

        if (!isBotTurn) {
            return;
        }

        this.eventEmitter.emit(
            ServerEventModel.SINGLE_PLAY_BOT_ATTACK,
            game.id,
        );
    }

    private botAttackHandler(): void {
        this.eventEmitter.subscribe(
            ServerEventModel.SINGLE_PLAY_BOT_ATTACK,
            (gameId: number) => {
                setTimeout(() => {
                    const { coords, playerId, game, botId } =
                        this.botService.generateBotAttack(gameId);

                    const { x, y } = coords;

                    const attackResult = this.botService.botAttackHandler(
                        game,
                        botId,
                        playerId,
                        coords.x,
                        coords.y,
                    );

                    const opponentPlayer: PlayerDataModel =
                        this.botService.getBotOpponentPlayer(game);
                    this.actionService.attackHandler({
                        y,
                        x,
                        game,
                        attackResult,
                        opponentPlayer,
                        socketId: botId,
                    });
                }, this.BOT_ATTACK_DELAY_SEC);
            },
        );
    }

    private registerDestroyBotHandler(botId: number): void {
        setTimeout(() => {
            this.eventEmitter.removeEvent(botId);
        }, this.BOT_DESTROY_DELAY_MIN);
    }

    private singlePlayHandler(socketId: number): void {
        const room = this.botService.createRoom(socketId);
        const { gameRoom, botId } = this.botService.addBotToRoom(room.id);

        this.registerDestroyBotHandler(botId);

        this.eventEmitter.subscribe(botId, (data: Buffer) =>
            this.botEventHandler(data, botId),
        );

        this.eventEmitter.emit(
            ServerEventModel.SINGLE_PLAY_GAME_CREATE,
            gameRoom.socketIdList,
        );
    }

    private botEventHandler(data: Buffer, botId: number): void {
        const message: BaseMessageModel<string> = JSON.parse(
            data.toString("utf-8"),
        );

        if (message.data) {
            message.data = JSON.parse(message.data);
        }

        const handler = this.eventHandlerMap[message.type];

        if (!handler) {
            return;
        }

        handler(message, botId);
    }
}
