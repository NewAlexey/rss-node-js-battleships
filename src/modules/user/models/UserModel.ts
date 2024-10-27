export type UserModel = {
    id: number;
    name: string;
    password: string;
    socketId: number | null;
    winsCount: number;
};

export type FrontUserModel = Pick<UserModel, "id" | "name">;
