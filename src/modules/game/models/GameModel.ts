import { PlayerDataModel } from "./PlayerDataModel";

export type GameModel = {
    id: number;
    isSinglePlay: boolean;
    movePlayerIdTurn: string;
    firstPlayer: PlayerDataModel;
    secondPlayer: PlayerDataModel;
};
