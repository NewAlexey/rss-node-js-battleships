export type UserModel = {
    id: number;
    name: string;
    password: string;
    winsCount: number;
};

export type FrontUserModel = Pick<UserModel, "id" | "name">;
