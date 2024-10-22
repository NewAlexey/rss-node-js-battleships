import { BaseMessageModel } from "../../models/BaseMessageModel";
import { ControllerModel, EventHandlerMapType } from "../ControllerModel";

import { RegistrationService } from "./registration.service";

class RegistrationController implements ControllerModel {
    private readonly registrationService = new RegistrationService();

    private readonly eventHandlerMap: EventHandlerMapType = {
        reg: (data: BaseMessageModel<any>) =>
            this.loginOrCreateUserHandler(data),
    };

    private loginOrCreateUserHandler(
        message: BaseMessageModel<LoginOrCreateDataType>,
    ): void {
        console.log("henlo from registrationService", message);

        const isUserExist = this.registrationService.isUserExist(
            message.data.name,
        );

        if (!isUserExist) {
            const createdUser = this.registrationService.registerUser(
                message.data,
            );

            console.log("createdUser", createdUser);
            //emit user created!
        } else {
            const isPasswordMatches =
                this.registrationService.isPasswordMatches(
                    message.data.name,
                    message.data.password,
                );

            if (!isPasswordMatches) {
                //emit wrong user data!
            } else {
                //emit login user!
            }
        }
    }

    public getEventHandlerMap(): EventHandlerMapType {
        return this.eventHandlerMap;
    }
}

const RegistrationControllerInstance = new RegistrationController();

export { RegistrationControllerInstance };

type LoginOrCreateDataType = {
    name: string;
    password: string;
};
