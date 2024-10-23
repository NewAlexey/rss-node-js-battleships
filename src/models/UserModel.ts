export type UserModel = {
    id: number;
    name: string;
    password: string;
};

export type FrontUserModel = Omit<UserModel, "password">;
