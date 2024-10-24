import { ShipModel } from "./ShipModel";

export type PlayerModel = {
    isPlayerReady: boolean;
    playerId: string;
    userId: number;
    shipList: ShipModel[];
    gameField: GameFieldType | null;
};

export type GameFieldType = {
    field: FieldType;
    livesCount: number;
};

export type EmptyGameFieldType = null[][];
export type FieldType = (null | ShipModel)[][];
