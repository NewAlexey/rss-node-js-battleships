import { BaseDataBase } from "../../db/base-db";
import { GameDb } from "../../db/game.db";

import { GameModel } from "./models/GameModel";
import { ShipModel } from "./models/ShipModel";
import {
    EmptyGameFieldType,
    FieldType,
    PlayerModel,
} from "./models/PlayerModel";

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

    public getOpponentPlayer(game: GameModel, playerId: string): PlayerModel {
        const opponentPlayer: PlayerModel =
            game.secondPlayer.playerId === playerId
                ? game.firstPlayer
                : game.secondPlayer;

        if (!opponentPlayer) {
            throw new Error("Something wrong with opponent player.");
        }

        return opponentPlayer;
    }

    public attackHandler(
        game: GameModel,
        playerId: string,
        x: number,
        y: number,
    ): AttackHandlerReturnDataType {
        const opponentPlayer: PlayerModel = this.getOpponentPlayer(
            game,
            playerId,
        );

        const { gameField } = opponentPlayer;

        if (!gameField) {
            throw new Error("Something wrong with opponent game field.");
        }

        const ship = gameField.field[y][x];

        if (!ship) {
            return {
                status: "miss",
                position: {
                    x,
                    y,
                },
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
            position: { x, y },
        };
    }

    public getPlayer(gameId: number, playerId?: string): PlayerModel {
        const game = this.gameDb.get(gameId);

        if (!game) {
            throw new Error("Something wrong with game.");
        }

        if (playerId) {
            return game.firstPlayer.playerId === playerId
                ? game.firstPlayer
                : game.secondPlayer;
        }

        const { movePlayerIdTurn } = game;

        return game.firstPlayer.playerId === movePlayerIdTurn
            ? game.firstPlayer
            : game.secondPlayer;
    }

    public addShipsToUser(
        gameId: number,
        playerId: string,
        shipList: ShipModel[],
    ): GameModel | undefined {
        const game = this.gameDb.get(gameId);

        if (!game) {
            throw new Error("Problem with game.");
        }

        const firstPlayerData = game.firstPlayer;
        const secondPlayerData = game.secondPlayer;

        let updatedGame: GameModel;

        if (playerId === firstPlayerData.playerId) {
            const filledPlayerShips: PlayerModel = this.setPlayerShipList(
                firstPlayerData,
                shipList,
            );
            updatedGame = {
                ...game,
                firstPlayer: filledPlayerShips,
            };
        } else if (playerId === secondPlayerData.playerId) {
            const filledPlayerShips: PlayerModel = this.setPlayerShipList(
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

    private setPlayerShipList(
        playerData: PlayerModel,
        shipList: ShipModel[],
    ): PlayerModel {
        return { ...playerData, isPlayerReady: true, shipList };
    }

    private createPlayerGameField(player: PlayerModel): PlayerModel {
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
            field: gameField,
        };

        return player;
    }
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
    position: {
        x: number;
        y: number;
    };
};

type ShotDataType = {
    status: "shot";
    position: {
        x: number;
        y: number;
    };
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

type AttackHandlerReturnDataType =
    | MissDataType
    | ShotDataType
    | KillDataType
    | FinishDataType;
