import { session } from '../objects/session';
import { user } from '../objects/user';
import { emitEvents } from '../events/emitEvents';
import { team } from '../objects/team';
import { state } from '../objects/state';
import { word } from '../objects/word';

const crypto = require('crypto');

export interface IReceiveEvents {
    createSession: (message: string) => void,
    joinSession: (message: string) => void,
    setUsername: (message: string) => void,
    changeTeam: (message: string) => void,
    startGame: (message: string) => void,
    addWord: (message: string) => void,
    deleteWord: (message: string) => void,
    usToggle: (message: string) => void,
    claimUser: (message: string) => void,
    startTimer: (message: string) => void,
    stopTimer: (message: string) => void,
    nextRound: (message: string) => void
}

export class receiveEvents implements IReceiveEvents {
    socket: any;
    sessions: Map<string, session>;
    session: session;

    constructor(socket: any, sessions: Map<string, session>) {
        this.socket = socket;
        this.sessions = sessions;
        this.session = new session();
    }

    events = {
        createSession: this.createSession,
        joinSession: this.joinSession,
        setUsername: this.setUsername,
        changeTeam: this.changeTeam,
        startGame: this.startGame,
        addWord: this.addWord,
        deleteWord: this.deleteWord,
        usToggle: this.usToggle,
        claimUser: this.claimUser,
        startTimer: this.startTimer,
        stopTimer: this.stopTimer,
        nextRound: this.nextRound
    }

    createSession(message: String) {

        let sessionId = '';
        for(let i = 0; i < 4; i++) {
            sessionId += String.fromCharCode(65 + crypto.randomInt(26));
        }
        this.socket.join(sessionId);

        this.session = new session();
        this.session.sessionId = sessionId;
        this.session.ownerId = this.socket.id;
        // this.session = new session(sessionId, this.socket.id);        

        this.session.users.set(this.socket.id, new user(this.socket.id));

        this.sessions.set(sessionId, this.session);

        this.socket.emit(emitEvents.sessionJoined, sessionId);

        this.socket.emit(emitEvents.setOwner, this.session?.ownerId);
    }

    joinSession(sessionId: string) {
        if(this.sessions.has(sessionId) && this.sessions.get(sessionId)!.state === state.teamSelection) {
            this.session = this.sessions.get(sessionId)!;

            this.socket.join(sessionId);

            this.session.users.set(this.socket.id, new user(this.socket.id));

            this.socket.emit(emitEvents.sessionJoined, sessionId);

            this.socket.emit(emitEvents.setOwner, this.session.ownerId);
        } else {
            this.socket.emit(emitEvents.sessionDoesNotExist, null);
        }  
    }

    setUsername(username: string) {
        if(this.session.state === state.teamSelection) {
            const user: user | undefined = this.session.getUserByUsername(username);
            if(user === undefined)
            {
                // Set user values.
                const user: user = this.session.users.get(this.socket.id)!;
                user.username = username;
                user.team = crypto.randomInt(2) + 1;
    
                // Emit new user to user.
                this.socket.emit(emitEvents.existingUsers, JSON.stringify(Array.from(this.session.users.values())));
                
                // Emit new user to room.
                this.socket.in(this.session.sessionId).emit(emitEvents.userAdded, JSON.stringify(user));
    
                // Emit username accepted to user.
                this.socket.emit(emitEvents.usernameAccepted, username);
            } else {
                this.socket.emit(emitEvents.usernameTaken, null);
            }
        }
    }

    changeTeam(message: string) {
        if(this.session.state === state.teamSelection) {
            const user: user = this.session.users.get(this.socket.id)!;
            user.team = user.team === team.one ? team.two : team.one;

            this.socket.emit(emitEvents.userAdded, JSON.stringify(user));

            this.socket.in(this.session.sessionId).emit(emitEvents.userAdded, JSON.stringify(user));
        }
    }

    startGame(message: string) {
        if(this.session.state === state.teamSelection) {

            const teamOne: user[] = this.session!.teamUsers(team.one);
            const teamTwo: user[] = this.session!.teamUsers(team.two);

            if(teamOne.length >= 2 && 
                teamTwo.length >= 2 &&
                this.socket.id === this.session?.ownerId
            ) {

                // Join each user to their team group.
                teamOne.forEach(user => {
                    this.socket.server.sockets.sockets.get(user.userId).join(this.session.teamRoom(team.one));
                });

                teamTwo.forEach(user => {
                    this.socket.server.sockets.sockets.get(user.userId).join(this.session.teamRoom(team.two));
                });

                this.session!.state = state.wordSelection;

                // Signal moving to next state.
                this.socket.emit(emitEvents.teamsSet, null);
                this.socket.in(this.session.sessionId).emit(emitEvents.teamsSet, null);
            } else {
                this.socket.emit(emitEvents.cantBegin, null);
                this.socket.in(this.session.sessionId).emit(emitEvents.cantBegin, null);
            }
        }
    }

    addWord(userWord: string) {
        if(this.session.state === state.wordSelection) {

            const userTeam: team = this.session.users.get(this.socket.id)!.team!;
            switch(userTeam) {
                case team.one:
                    this.session.teamOneWords.set(userWord, new word(userWord));
                    break;
                    
                case team.two:
                    this.session.teamTwoWords.set(userWord, new word(userWord));
                    break;
            }

            this.socket.emit(emitEvents.wordAdded, userWord);
            this.socket.in(this.session.teamRoom(userTeam)).emit(emitEvents.wordAdded, userWord);
        }
    }

    deleteWord(userWord: string) {
        if(this.session.state === state.wordSelection) {

            const userTeam: team = this.session.users.get(this.socket.id)!.team!;
            let deleted: boolean;
            switch(userTeam) {
                case team.one:
                    deleted = this.session.teamOneWords.delete(userWord);
                    break;
                    
                case team.two:
                    deleted = this.session.teamTwoWords.delete(userWord);
                    break;
            }

            if(deleted!) {
                this.socket.emit(emitEvents.wordDeleted, userWord);
                this.socket.in(this.session.teamRoom(userTeam)).emit(emitEvents.wordDeleted, userWord);
            }
        }
    }

    usToggle() {
        if(this.session.state === state.wordSelection) {
            
            const userTeam: team = this.session.users.get(this.socket.id)!.team!;

            this.session.ready[userTeam - 1] = !this.session.ready[userTeam - 1]

            this.socket.in(this.session.teamRoom(userTeam)).emit(emitEvents.usToggle, null);
            this.socket.emit(emitEvents.usToggle, null);

            this.socket.in(this.session.teamRoom(userTeam==team.one?team.two:team.one)).emit(emitEvents.themToggle, null);

            if(this.session.ready[0] && this.session.ready[1])
                this.nextRound();
        }
    }

    nextRound() {
        if(this.session.timer !== undefined)
            clearInterval(this.session.timer);

        if(this.session.state === state.wordSelection)
            this.session.state = crypto.randomInt(2) + 1 === team.one ? state.teamOnePlay : state.teamTwoPlay;
        else if(this.session.state === state.teamOnePlay || this.session.state === state.teamTwoPlay)
            this.session.state = this.session.state === state.teamOnePlay ? state.teamTwoPlay : state.teamOnePlay;

        if(this.session.state === state.teamOnePlay || this.session.state === state.teamTwoPlay)
        {
            if(this.session.state === state.teamOnePlay) {
                this.session.currentPlayer = this.session.teamUsers(team.one).reduce((previousUser: user, currentUser: user) => {
                    if(previousUser.roundCount < currentUser.roundCount)
                        return previousUser;
                    return currentUser;
                });
    
                this.session.currentWord = Array.from(this.session.teamOneWords.values()).reduce((previousWord: word, currentWord: word) => {
                    if(previousWord.time === null)
                        return previousWord;
                    return currentWord;
                });
            } else {
                this.session.currentPlayer = this.session.teamUsers(team.two).reduce((previousUser: user, currentUser: user) => {
                    if(previousUser.roundCount < currentUser.roundCount)
                        return previousUser;
                    return currentUser;
                });
    
                this.session.currentWord = Array.from(this.session.teamTwoWords.values()).reduce((previousWord: word, currentWord: word) => {
                    if(previousWord.time === null)
                        return previousWord;
                    return currentWord;
                });
            }

            if(this.session.currentWord.time === null)
            {
                this.session.currentPlayer.roundCount++;
                this.session.currentWord.time = 0;
        
                const nextRoundData = {
                    currentPlayerId: this.session.currentPlayer.userId,
                    currentState: this.session.state,
                }
        
                this.socket.server.sockets.sockets.get(this.session.currentPlayer.userId).emit(emitEvents.charadesWord, this.session.currentWord.word);
                
                this.socket.emit(emitEvents.nextRound, JSON.stringify(nextRoundData));
                this.socket.in(this.session.sessionId).emit(emitEvents.nextRound, JSON.stringify(nextRoundData));
            } else {
                this.session.state = state.results;
                const words = {teamOneWords: Array.from(this.session.teamOneWords.values()), teamTwoWords: Array.from(this.session.teamTwoWords.values())};
                this.socket.emit(emitEvents.results, JSON.stringify(words));
                this.socket.in(this.session.sessionId).emit(emitEvents.results, JSON.stringify(words));
            }
    
        }
    }

    startTimer() {
        if(this.socket.id === this.session.currentPlayer.userId &&
            (this.session.state === state.teamOnePlay || this.session.state === state.teamTwoPlay)) {
            
            this.session.timer = setInterval(() => this.timerUpdate(), 1000);
            this.socket.emit(emitEvents.timerStart, null);
        }
    }

    timerUpdate() {
        this.session.currentWord.time!++;
        this.socket.emit(emitEvents.timerUpdate, this.session.currentWord.time);
        this.socket.in(this.session.sessionId).emit(emitEvents.timerUpdate, this.session.currentWord.time);
    }

    stopTimer() {
        if(this.socket.id === this.session.currentPlayer.userId &&
            (this.session.state === state.teamOnePlay || this.session.state === state.teamTwoPlay)) {
            if(this.session.timer !== undefined) {
                clearInterval(this.session.timer!);
                this.socket.emit(emitEvents.timerStop, null);
            }
        }
    }

    claimUser(claimString: string) {
        const { sessionId, username } = JSON.parse(claimString);

        if(this.sessions.has(sessionId)) {
            const tempSession = this.sessions.get(sessionId)!;
            const user: user | undefined = tempSession.getUserByUsername(username);
            if(user != undefined) {
                this.session = tempSession;
        
                this.socket.join(sessionId);
                this.socket.join(this.session.teamRoom(user.team!))

                if(this.session.ownerId === user.userId)
                    this.session.ownerId = this.socket.id;
        
                // Remove old entry, add new entry.
                this.session.users.delete(user.userId);
                user.userId = this.socket.id;
                this.session.users.set(this.socket.id, user);
        
                const session = {
                    sessionId: this.session.sessionId,
                    userId: user.userId,
                    ownerId: this.session.ownerId,
                    users: Array.from(this.session.users.values()),
                    words: user.team === team.one ? Array.from(this.session.teamOneWords.values()).map(word => word.word) : Array.from(this.session.teamTwoWords.values()).map(word => word.word),
                    ready: this.session.ready,
                    state: this.session.state,
                    currentPlayerId: this.session.currentPlayer.userId,
                    currentWord: this.socket.id === this.session.currentPlayer.userId ? this.session.currentWord.word : ''
                };
        
                this.socket.emit(emitEvents.userClaimed, JSON.stringify(session));
            }
        }
    }
}