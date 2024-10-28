import { ShipModel } from "./ShipModel";

export type PlayerDataModel = {
    isPlayerReady: boolean;
    playerId: string;
    name: string;
    socketId: number;
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
