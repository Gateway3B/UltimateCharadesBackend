import { state } from "./state";
import { team } from "./team";
import { user } from "./user";
import { word } from "./word";

export class session {
    sessionId: string;
    ownerId: string;
    users: Map<string, user>;
    teamOneWords: Map<string, word>;
    teamTwoWords: Map<string, word>;
    currentPlayer: user;
    currentWord: word;
    ready: boolean[]
    state: state;
    timer: NodeJS.Timer | undefined;

    constructor() {
        this.sessionId = '';
        this.ownerId = '';
        this.users = new Map();
        this.teamOneWords = new Map();
        this.teamTwoWords = new Map();
        this.ready = [false, false];
        this.currentPlayer = new user('null');
        this.currentWord = new word('null');
        this.state = state.teamSelection;
        this.timer = undefined
    }

    teamUsers(team: team): user[] {
        const users: user[] = Array.from(this.users.values());
        return users.filter(user => user.team === team);
    }

    getUserByUsername(username: string): user | undefined {
        const users: user[] = Array.from(this.users.values());
        return users.filter(user => user.username === username)[0];
    }

    teamRoom(team: team): string {
        return `${this.sessionId}${team}`;
    }

}