import { EventTypeModel } from "../models/EventTypeModel";

export function emitDataHandler(type: EventTypeModel, data: any) {
    return JSON.stringify({ type, id: 0, data: JSON.stringify(data) });
}
