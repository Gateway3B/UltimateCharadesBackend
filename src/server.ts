import { receiveEvents } from './events/receiveEvents';
import { session } from './objects/session';
const process = require('process');

const devCors: string = 'http://localhost:4200';
const prodCors: string = 'https://ultimatecharades.herokuapp.com';

const app = require('express')();
const http = require('http').Server(app);

const io = require('socket.io')(http, {
    cors: { 
        origin: prodCors,
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

    Object.getOwnPropertyNames(receiveEvents.prototype).filter(method => method !== 'constructor').forEach(event => {
        socket.on(event, (message: string) => {
            events[event as keyof receiveEvents](message);
            console.log({ Received: event, Message: message});
        });
      });
});

http.listen(process.env.PORT || 80, () => console.log(`listening on port ${process.env.PORT || 80}`));
