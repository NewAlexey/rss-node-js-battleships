import { UserModel } from "../modules/registration/models/UserModel";

import { BaseDataBase } from "./base-db";

const UserDb = new BaseDataBase<UserModel>();

export { UserDb };
