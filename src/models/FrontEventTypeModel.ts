export enum FrontEventTypeModel {
    REGISTRATION = "reg",
    ROOM_CREATE = "create_room",
    ROOM_ADD_USER = "add_user_to_room",
    ROOM_UPDATE = "update_room",
    GAME_CREATE = "create_game",
    SHIPS_ADD = "add_ships",
    GAME_START = "start_game",
}

export enum ServerEventModel {
    ROOM_LIST_UPDATE = "room_list_update",
    GAME_CREATE = "game_create",
    GAME_START = "start_game",
}
