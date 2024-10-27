import { BaseDataBase } from "../../db/base-db";
import { UserDb } from "../../db/user.db";

import { UserModel } from "./models/UserModel";

export class UserService {
    private readonly db: BaseDataBase<UserModel> = UserDb;

    public isUserExist(username: string): boolean {
        return Boolean(this.db.get(username));
    }

    public getAll(): UserModel[] {
        return this.db.getAll();
    }

    public registerUser(
        props: { name: string; password: string },
        socketId: number,
    ): UserModel {
        return this.db.add({ ...props, winsCount: 0 }, socketId);
    }

    public isPasswordMatches(name: string, password: string): boolean {
        const existUser = this.db.get(name);

        return !existUser ? false : existUser.password === password;
    }

    public getAllWinners() {
        const userList = this.getAll();

        return userList.sort((userA, userB) => {
            if (userA.winsCount < userB.winsCount) {
                return 1;
            } else if (userA.winsCount > userB.winsCount) {
                return -1;
            }

            return 0;
        });
    }
}
