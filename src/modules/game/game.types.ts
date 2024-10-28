import { FrontShipModel, ShipModel } from "./models/ShipModel";

export type StartGameEmitDataType = {
    ships: ShipModel[];
    currentPlayerIndex: string;
};

export type CreateGameEmitDataType = {
    idGame: string | number;
    idPlayer: string | number;
};

export type AddShipsEventData = {
    gameId: number;
    ships: FrontShipModel[];
    indexPlayer: string;
};

export type PlayerTurnEmitDataType = {
    currentPlayer: string;
};

export type CoordsType = {
    x: number;
    y: number;
};

export type PlayerAttackEventDataType = {
    x: number;
    y: number;
    gameId: number;
    indexPlayer: string;
};

export type PlayerRandomAttackEventDataType = Pick<
    PlayerAttackEventDataType,
    "indexPlayer" | "gameId"
>;

export type PlayerAttackEmitDataType = {
    position: {
        x: number;
        y: number;
    };
    currentPlayer: string;
    status: "miss" | "killed" | "shot";
};

export type GameFinishEmitDataType = {
    winPlayer: string;
};
