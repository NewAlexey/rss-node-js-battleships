import { FrontEventTypeModel } from "./FrontEventTypeModel";

export type BaseMessageModel<D> = {
    type: FrontEventTypeModel;
    data: D;
    id: number;
};
