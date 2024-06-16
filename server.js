const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

let players = [];
let currentPlayerIndex = 0;
let roundTime = 60; // 每轮60秒
let timer;
let currentWord = 'banana';
let inRound = false;
let remainingTime = roundTime-1;

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('setNickname', (nickname) => {
        players.push({ id: socket.id, nickname , score: 0});
        io.emit('updatePlayers', { players, currentPlayer: players[currentPlayerIndex] ? players[currentPlayerIndex].id : null });
        if (players.length === 1) {
            startNextRound();
        }
        io.to(socket.id).emit('setSocketId',socket.id);
    });

    socket.on('setWord',(Word)=>{
        currentWord = Word;
    });
    socket.on('sendMessage', (message) => {
        const player = players.find(p => p.id === socket.id);
        if (player) {
            if(message.toLowerCase() === currentWord.toLowerCase()){
                let score_ = 100 * remainingTime/roundTime + 50;
                player.score += parseInt(score_);
                io.emit('receiveMessage', { nickname: player.nickname, message: '正確答案!'});
                io.to(player.id).emit('correctAnswer');
            }else{
                io.emit('receiveMessage', { nickname: player.nickname, message });
            }
        }
    });

    socket.on('drawing', (data) => {
        socket.broadcast.emit('drawing', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        players = players.filter(player => player.id !== socket.id);
        if (currentPlayerIndex >= players.length) {
            currentPlayerIndex = 0;
        }
        io.emit('updatePlayers', { players, currentPlayer: players.length > 0 ? players[currentPlayerIndex].id : null });
    });
});
let interval;
function startNextRound() {
    if (players.length === 0) return;
    clearTimeout(timer);
    clearInterval(interval);
    const currentPlayer = players[currentPlayerIndex];
    io.to(currentPlayer.id).emit('requestCurrentWord');
    io.emit('startRound', currentPlayer.id);
    io.emit('updatePlayers', { players, currentPlayer: currentPlayer.id });
    io.emit('broadcast',`${currentPlayer.nickname}的回合開始了!`);
    remainingTime = roundTime;
    interval = setInterval(
        ()=>{
            io.emit('updateTimer', remainingTime);
            remainingTime--;
        }, 1000)
    timer = setTimeout(() => {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        startNextRound();
    }, roundTime * 1000);
}

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

