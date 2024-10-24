import { ShipModel } from "./ShipModel";

export type PlayerDataModel = {
    isPlayerReady: boolean;
    playerId: string;
    userId: number;
    shipList: ShipModel[];
    gameField: GameFieldType | null;
};

export type GameFieldType = {
    shootPositionSet: Set<string>;
    field: FieldType;
    livesCount: number;
};

export type EmptyGameFieldType = null[][];
export type FieldType = (null | ShipModel)[][];
