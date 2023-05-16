const express = require('express');
const http = require('http');
const socket = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const tasks = [];

const whitelist = ['http://localhost:3000'];
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};
app.use(cors(corsOptions));

server.listen(process.env.PORT || 8000, () => {
    console.log('Server is running on port: 8000');
});

const io = socket(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
    console.log('New client! Its id – ' + socket.id);

    socket.emit('updateData', { tasks });

    socket.on('addTask', (task) => {
        if (!isTaskExists(task.id)) {
            const id = generateUniqueId();
            const newTask = { id, taskName: task.taskName };
            tasks.push(newTask);
            io.emit('addTask', newTask);
        }
    });


    socket.on('removeTask', (id) => {
        const index = tasks.findIndex((task) => task.id === id);
        if (index !== -1) {
            const removedTask = tasks.splice(index, 1)[0];
            io.emit('removeTask', removedTask.id);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected! Its id – ' + socket.id);
    });
});

function isTaskExists(taskId) {
    return tasks.some((task) => task.id === taskId);
}

function generateUniqueId() {
    return uuidv4();
}
