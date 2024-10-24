export type PositionType = { x: number; y: number };

export type ShipModel = {
    position: PositionType;
    direction: boolean;
    length: number;
    type: "small" | "medium" | "large" | "huge";
};
