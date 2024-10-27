import { BaseDataBase } from "../../db/base-db";
import { UserModel } from "../user/models/UserModel";
import { UserDb } from "../../db/user.db";

export class WinnersService {
    private readonly userDb: BaseDataBase<UserModel> = UserDb;

    public updateWinnersCount(socketId: number): void {
        const userList = this.userDb
            .getAll()
            .find((user) => user.socketId === socketId);

        if (!userList) {
            return;
        }

        userList.winsCount += 1;
    }
}
