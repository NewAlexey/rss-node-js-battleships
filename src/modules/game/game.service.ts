import { BaseDataBase } from "../../db/base-db";
import { GameDb } from "../../db/game.db";

import { GameModel } from "./models/GameModel";
import { ShipModel } from "./models/ShipModel";
import {
    EmptyGameFieldType,
    FieldType,
    GameFieldType,
    PlayerDataModel,
} from "./models/PlayerDataModel";

export class GameService {
    private readonly gameDb: BaseDataBase<GameModel> = GameDb;

    public addGame(game: GameModel): GameModel {
        return this.gameDb.add(game, game.id);
    }

    public getGame(gameId: number): GameModel | undefined {
        return this.gameDb.get(gameId);
    }

    public removeGame(gameId: number): void {
        this.gameDb.remove(gameId);
    }

    public getCurrentPlayerByUserId(
        game: GameModel,
        userId: number,
    ): PlayerDataModel {
        return game.firstPlayer.userId === userId
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
    ): void {
        //TODO this errors not catching... why??
        const currentPlayer = this.getCurrentPlayerByUserId(game, socketId);

        if (currentPlayer.playerId !== game.movePlayerIdTurn) {
            throw new Error("Invalid player move turn.");
        }

        const isPlayerAlreadyShootThisPosition: boolean | undefined =
            currentPlayer.gameField?.shootPositionSet.has(
                convertCoordinates(x, y),
            );

        if (isPlayerAlreadyShootThisPosition) {
            throw new Error("Invalid player shoot coordinates.");
        }
    }

    public attackHandler(
        game: GameModel,
        socketId: number,
        playerId: string,
        x: number,
        y: number,
    ): AttackHandlerReturnDataType {
        this.validatePlayerAction(game, socketId, x, y);

        const opponentPlayer: PlayerDataModel =
            this.getOpponentPlayerByPlayerId(game, playerId);

        const { gameField } = opponentPlayer;

        if (!gameField) {
            throw new Error("Something wrong with opponent game field.");
        }

        const ship = this.playerShoot(gameField, x, y);

        if (!ship) {
            this.changePlayerMoveTurn(game, opponentPlayer.playerId);

            return {
                status: "miss",
            };
        }

        ship.length -= 1;
        gameField.livesCount -= 1;

        if (!gameField.livesCount) {
            return {
                status: "finish",
            };
        }

        if (!ship.length) {
            return {
                status: "killed",
                positionList: [],
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
        shipList: ShipModel[],
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
        gameField: GameFieldType,
        x: number,
        y: number,
    ): ShipModel | null {
        this.savePlayerShootPosition(gameField.shootPositionSet, x, y);

        return gameField.field[y][x];
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
        shipList: ShipModel[],
    ): PlayerDataModel {
        return { ...playerData, isPlayerReady: true, shipList };
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

type MissDataType = {
    status: "miss";
};

type ShotDataType = {
    status: "shot";
};

type KillDataType = {
    status: "killed";
    positionList: {
        x: number;
        y: number;
    }[];
};

type FinishDataType = {
    status: "finish";
};

export type AttackHandlerReturnDataType =
    | MissDataType
    | ShotDataType
    | KillDataType
    | FinishDataType;
