import { receiveEvents } from './events/receiveEvents';
import { session } from './objects/session';


const app = require('express')();
const http = require('http').Server(app);

const io = require('socket.io')(http, {
    cors: { 
        origin: 'http://localhost:4200',
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

    Object.keys(events.events).forEach(key => {
        socket.on(key, (message: string) => {
            events[key](message);
            console.log({ Received: key, Message: message});
            // console.log({session: events.session})
        });
    });
});

http.listen(8080, () => console.log('listening on http://localhost:8080'));
