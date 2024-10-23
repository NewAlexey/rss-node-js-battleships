import { BaseDataBase } from "../../db/base-db";
import { GameModel } from "../../models/GameModel";
import { GameDb } from "../../db/game.db";

export class GameService {
    private readonly gameDb: BaseDataBase<GameModel> = GameDb;

    public addGame(game: GameModel): GameModel {
        return this.gameDb.add(game, game.id);
    }
}
