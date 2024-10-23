import { BaseMessageModel } from "../models/BaseMessageModel";
import { EventEmitter } from "../utils/EventEmitter";

export interface ControllerModel {
    getEventHandlerMap: () => EventHandlerMapType;
}

export type ControllerClassModel = new (
    eventEmitter: EventEmitter,
) => ControllerModel;

export type EventHandlerMapType = Record<
    string,
    (data: BaseMessageModel<any>, id: number) => void
>;
