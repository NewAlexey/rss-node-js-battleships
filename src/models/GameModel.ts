export type GameModel = {
    id: number;
    firstPlayer: PlayerModel;
    secondPlayer: PlayerModel;
};

export type PlayerModel = {
    isPlayerReady: boolean;
    playerId: string;
    userId: number;
    shipList: ShipModel[];
};

export type ShipModel = {
    position: { x: number; y: number };
    direction: boolean;
    length: number;
    type: "small" | "medium" | "large" | "huge";
};
