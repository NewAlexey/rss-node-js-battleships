import { BaseDataBase } from "../../db/base-db";
import { GameModel, PlayerModel, ShipModel } from "../../models/GameModel";
import { GameDb } from "../../db/game.db";

export class GameService {
    private readonly gameDb: BaseDataBase<GameModel> = GameDb;

    public addGame(game: GameModel): GameModel {
        return this.gameDb.add(game, game.id);
    }

    public getGame(gameId: number): GameModel | undefined {
        return this.gameDb.get(gameId);
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
            const filledPlayerShips: PlayerModel = fillPlayerShipList(
                firstPlayerData,
                shipList,
            );
            updatedGame = {
                ...game,
                firstPlayer: filledPlayerShips,
            };
        } else if (playerId === secondPlayerData.playerId) {
            const filledPlayerShips: PlayerModel = fillPlayerShipList(
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
}

function fillPlayerShipList(
    playerData: PlayerModel,
    shipList: ShipModel[],
): PlayerModel {
    return { ...playerData, isPlayerReady: true, shipList };
}
