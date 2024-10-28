import { FrontEventTypeModel } from "../models/FrontEventTypeModel";

export function emitDataHandler<D>(type: FrontEventTypeModel, data: D) {
    return JSON.stringify({ type, id: 0, data: JSON.stringify(data) });
}
