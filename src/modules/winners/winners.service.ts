import { BaseDataBase } from "../../db/base-db";
import { UserModel } from "../user/models/UserModel";
import { UserDb } from "../../db/user.db";

export class WinnersService {
    private readonly userDb: BaseDataBase<UserModel> = UserDb;

    public updateWinnersCount(userId: number): void {
        const user = this.userDb.get(userId);

        if (!user) {
            return;
        }

        user.winsCount += 1;
    }
}
