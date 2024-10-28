import { RoomService } from "../room/room.service";
import { RoomModel } from "../room/models/RoomModel";
import { generateId } from "../../utils/generateId";
import { GameModel } from "../game/models/GameModel";
import { CoordsType } from "../game/game.types";
import { AttackHandlerReturnDataType, GameService } from "../game/game.service";
import { PlayerDataModel } from "../game/models/PlayerDataModel";

export class BotService {
    private readonly roomService: RoomService = new RoomService();
    private readonly gameService: GameService;

    constructor(gameService: GameService) {
        this.gameService = gameService;
    }

    public createRoom(socketId: number): RoomModel {
        return this.roomService.createRoom(socketId);
    }

    public getBotOpponentPlayer(game: GameModel): PlayerDataModel {
        return game.firstPlayer;
    }

    public botAttackHandler(
        game: GameModel,
        socketId: number,
        playerId: string,
        x: number,
        y: number,
    ): AttackHandlerReturnDataType {
        return this.gameService.attackHandler(game, socketId, playerId, x, y);
    }

    public addBotToRoom(roomId: number): {
        gameRoom: RoomModel;
        botId: number;
    } {
        const botId = generateId();

        return {
            gameRoom: this.roomService.addUserToRoom(botId, roomId),
            botId: botId,
        };
    }

    public generateBotAttack(gameId: number): {
        game: GameModel;
        coords: CoordsType;
        playerId: string;
        botId: number;
    } {
        const game = this.gameService.getGame(gameId);

        if (!game) {
            throw new Error("Something wrong with game");
        }

        return {
            game,
            botId: game.secondPlayer.socketId,
            coords: this.gameService.generatePlayerRandomAttackPosition(
                gameId,
                game.secondPlayer.playerId,
            ),
            playerId: game.secondPlayer.playerId,
        };
    }

    public isBotTurn(
        gameId: number,
        currentPlayer: string,
    ): { game: GameModel; isBotTurn: boolean } {
        const game = this.gameService.getGame(gameId);

        if (!game) {
            throw new Error("Something wrong with game.");
        }

        return {
            game,
            isBotTurn: currentPlayer === game.secondPlayer.playerId,
        };
    }
}
