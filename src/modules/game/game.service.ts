import { BaseDataBase } from "../../db/base-db";
import { GameDb } from "../../db/game.db";
import { RoomModel } from "../room/models/RoomModel";
import { RoomDb } from "../../db/room.db";
import { getRandomNumber } from "../../utils/getRandomNumber";
import { UserModel } from "../user/models/UserModel";
import { UserDb } from "../../db/user.db";
import { generateId } from "../../utils/generateId";

import { GameModel } from "./models/GameModel";
import { FrontShipModel, ShipModel } from "./models/ShipModel";
import {
    FieldType,
    GameFieldType,
    PlayerDataModel,
} from "./models/PlayerDataModel";
import { CoordsType } from "./game.types";
import { generateMatrix } from "./utils/generateMatrix";
import { convertCoordinates } from "./utils/convertCoordinates";
import { getBotShipList } from "./utils/getBotShipList";
import { getCoordinatesAroundKilledShip } from "./utils/getCoordinatesAroundKilledShip";

export class GameService {
    private readonly gameDb: BaseDataBase<GameModel> = GameDb;
    private readonly roomDb: BaseDataBase<RoomModel> = RoomDb;
    private readonly userDb: BaseDataBase<UserModel> = UserDb;

    public addGame(game: GameModel): GameModel {
        return this.gameDb.add(game, game.id);
    }

    public getPlayerBySocketId(socketId: number): UserModel {
        const user = this.userDb
            .getAll()
            .find((user) => user.socketId === socketId);

        if (!user) {
            throw new Error("Something wrong with socketId");
        }

        return user;
    }

    public removeRoom(socketId: number) {
        this.roomDb.remove(socketId);
    }

    public getGame(gameId: number): GameModel | undefined {
        return this.gameDb.get(gameId);
    }

    public removeGame(gameId: number): void {
        this.gameDb.remove(gameId);
    }

    public generatePlayerRandomAttackPosition(
        gameId: number,
        playerId: string,
    ): CoordsType {
        const game = this.getGame(gameId);

        if (!game) {
            throw new Error("Something wrong with game");
        }

        const currentPlayer = this.getCurrentPlayerByPlayerId(game, playerId);

        const coordinates: CoordsType = {
            x: getRandomNumber(0, 9),
            y: getRandomNumber(0, 9),
        };
        let isCoordsUnique = false;

        while (!isCoordsUnique) {
            const isPlayerAlreadyShootThisPosition: boolean =
                this.isPlayerAlreadyShootPosition(
                    coordinates.x,
                    coordinates.y,
                    currentPlayer.gameField,
                );

            if (!isPlayerAlreadyShootThisPosition) {
                isCoordsUnique = true;
            } else {
                coordinates.x = getRandomNumber(0, 9);
                coordinates.y = getRandomNumber(0, 9);
            }
        }

        return { x: coordinates.x, y: coordinates.y };
    }

    public getCurrentPlayerByUserId(
        game: GameModel,
        socketId: number,
    ): PlayerDataModel {
        return game.firstPlayer.socketId === socketId
            ? game.firstPlayer
            : game.secondPlayer;
    }

    public attackHandler(
        game: GameModel,
        socketId: number,
        playerId: string,
        x: number,
        y: number,
    ): AttackHandlerReturnDataType {
        const isInvalid = this.validatePlayerAction(game, socketId, x, y);

        if (isInvalid) {
            return {
                status: "invalid",
            };
        }

        const opponentPlayer: PlayerDataModel =
            this.getOpponentPlayerByPlayerId(game, playerId);
        const currentPlayer: PlayerDataModel = this.getCurrentPlayerByPlayerId(
            game,
            playerId,
        );

        const playerShootPositionSet: Set<string> | undefined =
            currentPlayer.gameField?.shootPositionSet;
        const opponentGameField: GameFieldType | null =
            opponentPlayer.gameField;

        if (!opponentGameField || !playerShootPositionSet) {
            throw new Error("Something wrong with opponent game field.");
        }

        const ship: ShipModel | null = this.playerShoot(
            opponentGameField,
            playerShootPositionSet,
            x,
            y,
        );

        if (!ship) {
            this.changePlayerMoveTurn(game, opponentPlayer.playerId);

            return {
                status: "miss",
            };
        }

        ship.length -= 1;
        opponentGameField.livesCount -= 1;

        if (!opponentGameField.livesCount) {
            return {
                status: "finish",
            };
        }

        if (!ship.length) {
            const direction = ship.direction ? "vertical" : "horizontal";
            const length = ship.initialLength;

            const positionList = getCoordinatesAroundKilledShip(
                opponentGameField.field,
                ship.position.x,
                ship.position.y,
                direction,
                length,
            );

            positionList.forEach((position) => {
                playerShootPositionSet.add(
                    convertCoordinates(position.x, position.y),
                );
            });

            return {
                positionList,
                status: "killed",
            };
        }

        return {
            status: "shot",
        };
    }

    public getNextMovePlayers(game: GameModel): {
        nextMovePlayer: PlayerDataModel;
        waitMovePlayer: PlayerDataModel;
    } {
        const currentMovePlayerId = game.movePlayerIdTurn;

        const currentPlayer = this.getCurrentPlayerByPlayerId(
            game,
            currentMovePlayerId,
        );

        return {
            nextMovePlayer: currentPlayer,
            waitMovePlayer:
                game.movePlayerIdTurn === game.firstPlayer.playerId
                    ? game.secondPlayer
                    : game.firstPlayer,
        };
    }

    public addShipsToUser(
        gameId: number,
        playerId: string,
        shipList: FrontShipModel[],
    ): GameModel | undefined {
        const game = this.gameDb.get(gameId);

        if (!game) {
            throw new Error("Something wrong with game.");
        }

        const firstPlayerData = game.firstPlayer;
        const secondPlayerData = game.secondPlayer;

        let updatedGame: GameModel;

        if (playerId === firstPlayerData.playerId) {
            const filledPlayerShips: PlayerDataModel = this.setPlayerShipList(
                firstPlayerData,
                shipList,
            );
            updatedGame = {
                ...game,
                firstPlayer: filledPlayerShips,
            };
        } else if (playerId === secondPlayerData.playerId) {
            const filledPlayerShips: PlayerDataModel = this.setPlayerShipList(
                secondPlayerData,
                shipList,
            );
            updatedGame = {
                ...game,
                secondPlayer: filledPlayerShips,
            };
        } else {
            throw new Error("Something wrong with players data.");
        }

        this.gameDb.save(updatedGame);

        return this.gameDb.get(gameId);
    }

    public createPlayersGameFields(game: GameModel): GameModel {
        const { firstPlayer, secondPlayer } = game;

        const firstPlayerWithField = this.createPlayerGameField(firstPlayer);
        const secondPlayerWithField = this.createPlayerGameField(secondPlayer);

        return {
            ...game,
            firstPlayer: firstPlayerWithField,
            secondPlayer: secondPlayerWithField,
        };
    }

    public getCurrentPlayerByPlayerId(
        game: GameModel,
        playerId: string,
    ): PlayerDataModel {
        return game.firstPlayer.playerId === playerId
            ? game.firstPlayer
            : game.secondPlayer;
    }

    public getOpponentPlayerByPlayerId(
        game: GameModel,
        playerId: string,
    ): PlayerDataModel {
        const opponentPlayer: PlayerDataModel =
            game.secondPlayer.playerId === playerId
                ? game.firstPlayer
                : game.secondPlayer;

        if (!opponentPlayer) {
            throw new Error("Something wrong with opponent player.");
        }

        return opponentPlayer;
    }

    private isPlayerAlreadyShootPosition(
        x: number,
        y: number,
        gameField: GameFieldType | null,
    ): boolean {
        return Boolean(
            gameField?.shootPositionSet.has(convertCoordinates(x, y)),
        );
    }

    private validatePlayerAction(
        game: GameModel,
        socketId: number,
        x: number,
        y: number,
    ): boolean {
        const currentPlayer = this.getCurrentPlayerByUserId(game, socketId);

        if (currentPlayer.playerId !== game.movePlayerIdTurn) {
            return true;
        }

        return this.isPlayerAlreadyShootPosition(x, y, currentPlayer.gameField);
    }

    public createSinglePlayGameHandler(
        usersSocketId: number[],
    ): CreateSinglePlayGameReturnDataType {
        const [firstUserSocketId, botId] = usersSocketId;
        const firstUser = this.getPlayerBySocketId(firstUserSocketId);

        const gameId = botId;

        const firstPlayerId = `${gameId}_${firstUserSocketId}`;
        const botPlayerId = `${gameId}_${botId}`;

        const game: GameModel = {
            id: gameId,
            isSinglePlay: true,
            movePlayerIdTurn: firstPlayerId,
            firstPlayer: this.createPlayer(
                firstPlayerId,
                firstUser.name,
                firstUserSocketId,
            ),
            secondPlayer: this.createBotPlayer(botPlayerId, botId),
        };

        const createdGame: GameModel = this.addGame(game);

        return { createdGame, playerData: game.firstPlayer };
    }

    public createGameHandler(
        usersSocketId: number[],
    ): CreateGameReturnDataType {
        const [firstUserSocketId, secondUserSocketId] = usersSocketId;
        const firstUser = this.getPlayerBySocketId(firstUserSocketId);
        const secondUser = this.getPlayerBySocketId(secondUserSocketId);

        const gameId: number = generateId();

        const firstPlayerId = `${gameId}_${firstUserSocketId}`;
        const secondPlayerId = `${gameId}_${secondUserSocketId}`;

        const game: GameModel = {
            id: gameId,
            isSinglePlay: false,
            movePlayerIdTurn: firstPlayerId,
            firstPlayer: this.createPlayer(
                firstPlayerId,
                firstUser.name,
                firstUserSocketId,
            ),
            secondPlayer: this.createPlayer(
                secondPlayerId,
                secondUser.name,
                secondUserSocketId,
            ),
        };

        const createdGame: GameModel = this.addGame(game);

        return {
            createdGame,
            firstPlayer: createdGame.firstPlayer,
            secondPlayer: createdGame.secondPlayer,
        };
    }

    private createBotPlayer(
        botPlayerId: string,
        botId: number,
    ): PlayerDataModel {
        return {
            isPlayerReady: true,
            playerId: botPlayerId,
            name: "Bot Player",
            socketId: botId,
            shipList: getBotShipList(),
            gameField: null,
        };
    }

    private createPlayer(
        playerId: string,
        name: string,
        socketId: number,
    ): PlayerDataModel {
        return {
            name,
            playerId,
            socketId,
            isPlayerReady: false,
            shipList: [],
            gameField: null,
        };
    }

    private playerShoot(
        opponentGameField: GameFieldType,
        playerShootSet: Set<string>,
        x: number,
        y: number,
    ): ShipModel | null {
        this.savePlayerShootPosition(playerShootSet, x, y);

        return opponentGameField.field[y][x];
    }

    private savePlayerShootPosition(
        playerPositionSet: Set<string>,
        x: number,
        y: number,
    ): void {
        playerPositionSet.add(convertCoordinates(x, y));
    }

    private changePlayerMoveTurn(game: GameModel, playerId: string): void {
        game.movePlayerIdTurn = playerId;
    }

    private setPlayerShipList(
        playerData: PlayerDataModel,
        shipList: FrontShipModel[],
    ): PlayerDataModel {
        return {
            ...playerData,
            isPlayerReady: true,
            shipList: shipList.map((ship) => ({
                ...ship,
                initialLength: ship.length,
            })),
        };
    }

    private createPlayerGameField(player: PlayerDataModel): PlayerDataModel {
        const gameField: FieldType = generateMatrix(10);

        let livesCount = 0;

        player.shipList.forEach((ship) => {
            const { x, y } = ship.position;
            let horizontalShift = x;
            let verticalShift = y;

            livesCount += ship.length;

            for (let i = 0; i < ship.length; i++) {
                gameField[verticalShift][horizontalShift] = ship;

                if (ship.direction) {
                    verticalShift += 1;
                } else {
                    horizontalShift += 1;
                }
            }
        });

        player.gameField = {
            livesCount,
            shootPositionSet: new Set(),
            field: gameField,
        };

        return player;
    }
}

type MissDataType = {
    status: "miss";
};

type ShotDataType = {
    status: "shot";
};

type KillDataType = {
    status: "killed";
    positionList: CoordsType[];
};

type FinishDataType = {
    status: "finish";
};

type InvalidDataType = {
    status: "invalid";
};

export type AttackHandlerReturnDataType =
    | MissDataType
    | ShotDataType
    | KillDataType
    | InvalidDataType
    | FinishDataType;

type CreateGameReturnDataType = {
    createdGame: GameModel;
    firstPlayer: PlayerDataModel;
    secondPlayer: PlayerDataModel;
};

type CreateSinglePlayGameReturnDataType = {
    createdGame: GameModel;
    playerData: PlayerDataModel;
};
