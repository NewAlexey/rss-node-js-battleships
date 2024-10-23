import { FrontEventTypeModel } from "../models/FrontEventTypeModel";

export function emitDataHandler(type: FrontEventTypeModel, data: any) {
    return JSON.stringify({ type, id: 0, data: JSON.stringify(data) });
}
