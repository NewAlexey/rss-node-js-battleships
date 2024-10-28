import { UserModel } from "../modules/user/models/UserModel";

import { BaseDataBase } from "./base-db";

const UserDb = new BaseDataBase<UserModel>();

export { UserDb };
