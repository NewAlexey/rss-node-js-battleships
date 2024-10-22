import { config } from "dotenv";

import { App } from "./app";
import { ControllerModel } from "./modules/ControllerModel";
import { RegistrationControllerInstance } from "./modules/registration/registration.controller";

config();

const port = process.env.PORT || 3000;

const serviceList: ControllerModel[] = [RegistrationControllerInstance];

new App(port, serviceList);
