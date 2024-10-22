import { EventTypeModel } from "./EventTypeModel";

export type BaseMessageModel<D> = {
    type: EventTypeModel;
    data: D;
    id: number;
};
