import { PlayerModel } from "./PlayerModel";

export type GameModel = {
    id: number;
    movePlayerIdTurn: string;
    firstPlayer: PlayerModel;
    secondPlayer: PlayerModel;
};
