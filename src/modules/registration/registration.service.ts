import { BaseDataBase } from "../../db/base-db";
import { UserModel } from "../../models/UserModel";
import { UserDb } from "../../db/user.db";

export class RegistrationService {
    private readonly db: BaseDataBase<UserModel> = UserDb;

    public isUserExist(username: string): boolean {
        return Boolean(this.db.get(username));
    }

    public registerUser(
        props: { name: string; password: string },
        socketId: number,
    ): UserModel {
        return this.db.add(props, socketId);
    }

    public isPasswordMatches(name: string, password: string): boolean {
        const existUser = this.db.get(name);

        return !existUser ? false : existUser.password === password;
    }
}
