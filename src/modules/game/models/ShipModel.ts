export type PositionType = { x: number; y: number };

export type ShipModel = {
    position: PositionType;
    direction: boolean;
    length: number;
    initialLength: number;
    type: "small" | "medium" | "large" | "huge";
};

export type FrontShipModel = Omit<ShipModel, "initialLength">;
