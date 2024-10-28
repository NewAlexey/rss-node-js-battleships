import { EmptyGameFieldType } from "../models/PlayerDataModel";

export function generateMatrix(size: number): EmptyGameFieldType {
    const matrix: EmptyGameFieldType = [];

    for (let i = 0; i < size; i++) {
        matrix.push(Array(size).fill(null));
    }

    return matrix;
}
