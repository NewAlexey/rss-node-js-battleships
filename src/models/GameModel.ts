export type GameModel = {
    id: number;
    firstPlayer: {
        playerId: string;
        userId: number;
    };
    secondPlayer: {
        playerId: string;
        userId: number;
    };
};
