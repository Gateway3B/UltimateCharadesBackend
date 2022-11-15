import { receiveEvents } from './events/receiveEvents';
import { session } from './objects/session';
require('dotenv').config()

const app = require('express')();
const http = require('http').Server(app);

const io = require('socket.io')(http, {
    cors: { 
        origin: process.env.CORS_ORIGIN,
        methods: ['GET', 'POST'],
        credentials: true,
        transports: ['websocket', 'polling']
    },
    allowEIO3: true
});


const sessions: Map<string, session> = new Map();

io.on('connection', (socket: any) => {
    const events = new receiveEvents(socket, sessions);
    console.log(`A user has connected: ${socket.id}`);

    Object.entries(events.events).forEach((array) => {
        const key = array[0];
        const method = array[1];
        socket.on(key, (message: string) => {
            events[key as keyof receiveEvents](message);
            console.log({ Received: key, Message: message});
            // console.log({session: events.session})
        });
    });
});

http.listen(8080, () => console.log('listening on http://localhost:8080'));
