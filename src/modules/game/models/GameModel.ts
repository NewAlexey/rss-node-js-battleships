import { PlayerDataModel } from "./PlayerDataModel";

export type GameModel = {
    id: number;
    movePlayerIdTurn: string;
    firstPlayer: PlayerDataModel;
    secondPlayer: PlayerDataModel;
};
