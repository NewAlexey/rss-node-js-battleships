import { BaseDataBase } from "../../db/base-db";
import { UserDb } from "../../db/user.db";

import { UserModel } from "./models/UserModel";

export class UserService {
    private readonly db: BaseDataBase<UserModel> = UserDb;

    public getUser(username: string): UserModel | undefined {
        return this.db.get(username);
    }

    public loginUser(username: string, socketId: number): void {
        const user = this.db.get(username);

        if (!user) {
            throw new Error("Something wrong with user.");
        }

        user.socketId = socketId;
    }

    public getUserBySocketId(socketId: number): UserModel | undefined {
        const userList = this.db.getAll();

        return userList.find((user) => user.socketId === socketId);
    }

    public getAll(): UserModel[] {
        return this.db.getAll();
    }

    public registerUser(
        props: { name: string; password: string },
        socketId: number,
    ): UserModel {
        return this.db.add({ ...props, winsCount: 0, socketId }, props.name);
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
