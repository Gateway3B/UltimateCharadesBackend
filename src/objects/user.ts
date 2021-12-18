import { team } from "./team";

export class user {
    userId: string;
    username?: string;
    team?: team;
    roundCount: number;

    constructor(userId: string) {
        this.userId = userId;
        this.username = undefined;
        this.team = undefined;
        this.roundCount = 0;
    }
}