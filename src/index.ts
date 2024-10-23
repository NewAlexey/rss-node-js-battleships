import { config } from "dotenv";

import { App } from "./app";
import { ControllerClassModel } from "./modules/ControllerModel";
import { RegistrationController } from "./modules/registration/registration.controller";
import { RoomController } from "./modules/room/room.controller";

config();

const port = process.env.PORT || 3000;

const controllerList: ControllerClassModel[] = [
    RegistrationController,
    RoomController,
];

new App(port, controllerList);
