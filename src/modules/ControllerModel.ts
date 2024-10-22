import { BaseMessageModel } from "../models/BaseMessageModel";

export interface ControllerModel {
    getEventHandlerMap: () => EventHandlerMapType;
}

export type EventHandlerMapType = Record<
    string,
    (data: BaseMessageModel<any>) => void
>;
