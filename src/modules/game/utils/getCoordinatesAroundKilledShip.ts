import { CoordsType } from "../game.types";
import { FieldType } from "../models/PlayerDataModel";

export function getCoordinatesAroundKilledShip(
    field: FieldType | undefined,
    x: number,
    y: number,
    direction: "vertical" | "horizontal",
    length: number,
): CoordsType[] {
    if (!field) {
        throw new Error("Something wrong with opponent field.");
    }

    let currentX = x;
    let currentY = y;

    const coordsList: CoordsType[] = [];

    let condition = true;
    let currentAlgorithmStep = AlgorithmStepEnum.FIRST;

    while (condition) {
        switch (currentAlgorithmStep) {
            case AlgorithmStepEnum.FIRST: {
                currentY = currentY - 1;

                if (currentY < 0) {
                    if (direction === "horizontal") {
                        currentX = currentX + length;
                    }

                    if (direction === "vertical") {
                        currentX += 1;
                    }

                    currentAlgorithmStep = AlgorithmStepEnum.THIRD;

                    break;
                }

                coordsList.push({ x: currentX, y: currentY });

                currentAlgorithmStep = AlgorithmStepEnum.SECOND;

                break;
            }

            case AlgorithmStepEnum.SECOND: {
                currentX = currentX + 1;

                if (currentX >= field.length) {
                    if (direction === "vertical") {
                        currentY = currentY + length + 1;
                    }

                    if (direction === "horizontal") {
                        currentY = currentY + 2;
                    }

                    currentAlgorithmStep = AlgorithmStepEnum.FOURTH;

                    break;
                }

                coordsList.push({ x: currentX, y: currentY });

                if (direction === "horizontal") {
                    if (currentX > x + length - 1) {
                        currentAlgorithmStep = AlgorithmStepEnum.THIRD;
                    }
                } else if (currentX > x) {
                    currentAlgorithmStep = AlgorithmStepEnum.THIRD;
                }

                break;
            }

            case AlgorithmStepEnum.THIRD: {
                currentY = currentY + 1;

                if (currentY >= field.length) {
                    if (direction === "vertical") {
                        currentX = currentX - 2;
                    }

                    if (direction === "horizontal") {
                        currentX = currentX - length - 1;
                    }

                    currentAlgorithmStep = AlgorithmStepEnum.FIFTH;

                    break;
                }

                coordsList.push({ x: currentX, y: currentY });

                if (direction === "vertical") {
                    if (currentY > y + length - 1) {
                        currentAlgorithmStep = AlgorithmStepEnum.FOURTH;
                    }
                } else if (currentY > y) {
                    currentAlgorithmStep = AlgorithmStepEnum.FOURTH;
                }

                break;
            }

            case AlgorithmStepEnum.FOURTH: {
                currentX = currentX - 1;

                if (currentY >= field.length) {
                    currentX -= 1;
                    currentAlgorithmStep = AlgorithmStepEnum.FIFTH;

                    break;
                }

                coordsList.push({ x: currentX, y: currentY });

                if (currentX < x) {
                    currentAlgorithmStep = AlgorithmStepEnum.FIFTH;

                    break;
                }

                break;
            }

            case AlgorithmStepEnum.FIFTH: {
                currentY = currentY - 1;

                if (currentY < 0) {
                    condition = false;

                    break;
                }

                coordsList.push({ x: currentX, y: currentY });

                if (currentY < y) {
                    condition = false;
                }

                break;
            }

            default: {
                condition = false;
            }
        }
    }

    return coordsList;
}
//
// function checkPosition(
//     currentPosition: false | object,
//     coordsList: CoordsType[],
//     x: number,
//     y: number,
// ) {
//     if (typeof currentPosition === "object") {
//         coordsList.push({ x, y });
//     }
// }

enum AlgorithmStepEnum {
    FIRST = 1,
    SECOND = 2,
    THIRD = 3,
    FOURTH = 4,
    FIFTH = 5,
}
