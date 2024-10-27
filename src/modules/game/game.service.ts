import { BaseDataBase } from "../../db/base-db";
import { GameDb } from "../../db/game.db";
import { RoomModel } from "../room/models/RoomModel";
import { RoomDb } from "../../db/room.db";
import { getRandomNumber } from "../../utils/getRandomNumber";
import { UserModel } from "../user/models/UserModel";
import { UserDb } from "../../db/user.db";

import { GameModel } from "./models/GameModel";
import { FrontShipModel, ShipModel } from "./models/ShipModel";
import {
    EmptyGameFieldType,
    FieldType,
    GameFieldType,
    PlayerDataModel,
} from "./models/PlayerDataModel";

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

    public getCoordinatesAroundKilledShip(
        field: FieldType | undefined,
        x: number,
        y: number,
        direction: "vertical" | "horizontal",
        length: number,
    ): CoordsType[] {
        if (!field) {
            throw new Error("Something wrong with opponent field.");
        }

        let currentX = x;
        let currentY = y;

        const coordsList: CoordsType[] = [];

        let condition = true;
        let currentAlgorithmStep = AlgorithmStepEnum.FIRST;

        while (condition) {
            switch (currentAlgorithmStep) {
                case AlgorithmStepEnum.FIRST: {
                    currentY = currentY - 1;

                    if (currentY < 0) {
                        if (direction === "horizontal") {
                            currentX = currentX + length;
                        }

                        if (direction === "vertical") {
                            currentX += 1;
                        }

                        currentAlgorithmStep = AlgorithmStepEnum.THIRD;

                        break;
                    }

                    const position = field[currentY][currentX];

                    if (typeof position === "object") {
                        coordsList.push({ x: currentX, y: currentY });
                    }

                    currentAlgorithmStep = AlgorithmStepEnum.SECOND;

                    break;
                }

                case AlgorithmStepEnum.SECOND: {
                    currentX = currentX + 1;

                    if (currentX >= field.length) {
                        if (direction === "vertical") {
                            currentY = currentY + length + 1;
                        }

                        if (direction === "horizontal") {
                            currentY = currentY + 2;
                        }

                        currentAlgorithmStep = AlgorithmStepEnum.FOURTH;

                        break;
                    }

                    const position = field[currentY][currentX];

                    if (typeof position === "object") {
                        coordsList.push({ x: currentX, y: currentY });
                    }

                    if (direction === "horizontal") {
                        if (currentX > x + length - 1) {
                            currentAlgorithmStep = AlgorithmStepEnum.THIRD;
                        }
                    } else if (currentX > x) {
                        currentAlgorithmStep = AlgorithmStepEnum.THIRD;
                    }

                    break;
                }

                case AlgorithmStepEnum.THIRD: {
                    currentY = currentY + 1;

                    if (currentY >= field.length) {
                        if (direction === "vertical") {
                            currentX = currentX - 2;
                        }

                        if (direction === "horizontal") {
                            currentX = currentX - length - 1;
                        }

                        currentAlgorithmStep = AlgorithmStepEnum.FIFTH;

                        break;
                    }

                    const position = field[currentY][currentX];

                    if (typeof position === "object") {
                        coordsList.push({ x: currentX, y: currentY });
                    }

                    if (direction === "vertical") {
                        if (currentY > y + length - 1) {
                            currentAlgorithmStep = AlgorithmStepEnum.FOURTH;
                        }
                    } else if (currentY > y) {
                        currentAlgorithmStep = AlgorithmStepEnum.FOURTH;
                    }

                    break;
                }

                case AlgorithmStepEnum.FOURTH: {
                    currentX = currentX - 1;

                    if (currentY >= field.length) {
                        currentX -= 1;
                        currentAlgorithmStep = AlgorithmStepEnum.FIFTH;

                        break;
                    }

                    const position = field[currentY][currentX];

                    if (typeof position === "object") {
                        coordsList.push({ x: currentX, y: currentY });
                    }

                    if (currentX < x) {
                        currentAlgorithmStep = AlgorithmStepEnum.FIFTH;

                        break;
                    }

                    break;
                }

                case AlgorithmStepEnum.FIFTH: {
                    currentY = currentY - 1;

                    if (currentY < 0) {
                        condition = false;

                        break;
                    }

                    const position = field[currentY][currentX];

                    if (typeof position === "object") {
                        coordsList.push({ x: currentX, y: currentY });
                    }

                    if (currentY < y) {
                        condition = false;
                    }

                    break;
                }

                default: {
                    condition = false;
                }
            }
        }

        return coordsList;
    }

    public getGame(gameId: number): GameModel | undefined {
        return this.gameDb.get(gameId);
    }

    public removeGame(gameId: number): void {
        this.gameDb.remove(gameId);
    }

    public generatePlayerRandomAttackPosition(
        gameId: number,
        indexPlayer: string,
    ): CoordsType {
        const game = this.getGame(gameId);

        if (!game) {
            throw new Error("Something wrong with game");
        }

        const currentPlayer = this.getCurrentPlayerByPlayerId(
            game,
            indexPlayer,
        );

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

    private isPlayerAlreadyShootPosition(
        x: number,
        y: number,
        gameField: GameFieldType | null,
    ): boolean {
        return Boolean(
            gameField?.shootPositionSet.has(convertCoordinates(x, y)),
        );
    }

    public getCurrentPlayerByUserId(
        game: GameModel,
        socketId: number,
    ): PlayerDataModel {
        return game.firstPlayer.socketId === socketId
            ? game.firstPlayer
            : game.secondPlayer;
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

            const positionList = this.getCoordinatesAroundKilledShip(
                opponentGameField.field,
                ship.position.x,
                ship.position.y,
                direction,
                length,
            );

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
                    ? game.firstPlayer
                    : game.secondPlayer,
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

function convertCoordinates(x: number, y: number): string {
    return `${x}${y}`;
}

function generateMatrix(size: number): EmptyGameFieldType {
    const matrix: EmptyGameFieldType = [];

    for (let i = 0; i < size; i++) {
        matrix.push(Array(size).fill(null));
    }

    return matrix;
}

type CoordsType = {
    x: number;
    y: number;
};

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

enum AlgorithmStepEnum {
    FIRST = 1,
    SECOND = 2,
    THIRD = 3,
    FOURTH = 4,
    FIFTH = 5,
}
