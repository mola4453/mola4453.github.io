const canvas = document.getElementById('drawingCanvas');
const context = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const playerList = document.getElementById('playerList');
const nicknameForm = document.getElementById('nicknameForm');
const nicknameInput = document.getElementById('nicknameInput');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatBox = document.getElementById('chatBox');
const controls = document.getElementById('controls');
const chatContainer = document.getElementById('chatContainer');
const timer = document.getElementById('timer');
const timerElement = document.getElementById('timerTime');
const scoreBoard = document.getElementById('scoreboard');
const inputGuessWord = document.getElementById('inputGuessWord');
const guessWordInput = document.getElementById('guessWordInput');
const submitWordButton = document.getElementById('submitWordButton');
const clearCanvasButton = document.getElementById('clearCanvasButton');
const eraserButton = document.getElementById('eraserButton'); 

canvas.width = 800;
canvas.height = 600;

let drawing = false;
let isMyTurn = false;
let answered = false;
let qSubmitd = false;
let isEraser = false; 
let socketId;
let currentPlayerId;

const socket = io();

socket.on('setSocketId',(socketId_)=>{socketId = socketId_;});

socket.on('correctAnswer',()=>{answered = true;});

socket.on('clearAllCanvas', ()=>{
    clearCanvas();
});

eraserButton.addEventListener('click', () => {
    isEraser = !isEraser; 
    eraserButton.textContent = isEraser ? '使用畫筆' : '使用橡皮擦';
});

clearCanvasButton.addEventListener('click',()=>{
    if(isMyTurn) socket.emit('clearCanvas');
    else displayMessage('你的回合才能清除畫布!');
});

submitWordButton.addEventListener('click',()=>{
    let Word = guessWordInput.value;
    if(Word){
    socket.emit('setWord',Word);
    inputGuessWord.style.display = 'none';
    guessWordInput.value = '';
    qSubmitd = true;
    }
});

nicknameForm.addEventListener('submit', (e) => {
    console.log('nickname submit');
    e.preventDefault();
    const nickname = nicknameInput.value;
    if (nickname) {
        socket.emit('setNickname', nickname);
        enterDrawPhase();
    }
});

function enterDrawPhase()
{
    nicknameForm.style.display = 'none';
    canvas.style.display = 'block';
    controls.style.display = 'block';
    chatContainer.style.display = 'block';
    timer.style.display = 'block';
    scoreBoard.style.display = "block";
}

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = chatInput.value;
    if(socketId === currentPlayerId){
        displayMessage('你就是出題者，不能自問自答!');
    }else if(answered){
        displayMessage('你已經回答過這題了!');
    }else if (message) {
        socket.emit('sendMessage', message);
        chatInput.value = '';
    }
});

canvas.addEventListener('mousedown', () => {
    if (isMyTurn) drawing = true;
});
canvas.addEventListener('mouseup', () => {
    drawing = false;
    context.beginPath();
});
canvas.addEventListener('mousemove', draw);

function draw(event) {
    if (!drawing) return;
    if (!qSubmitd){
        displayMessage('請先輸入你的題目，才可繪畫!');
        return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    

    context.lineWidth = brushSize.value;
    context.lineCap = 'round';
    context.strokeStyle = colorPicker.value;
    context.strokeStyle = isEraser ? '#FFFFFF' : colorPicker.value; 


    context.lineTo(x, y);
    context.stroke();
    context.beginPath();
    context.moveTo(x, y);

    socket.emit('drawing', { x, y, color: colorPicker.value, size: brushSize.value });
}

socket.on('drawing', (data) => {
    context.lineWidth = data.size;
    context.lineCap = 'round';
    context.strokeStyle = data.color;

    context.lineTo(data.x, data.y);
    context.stroke();
    context.beginPath();
    context.moveTo(data.x, data.y);
});


socket.on('startRound', (currentPlayerId_) => {
    currentPlayerId = currentPlayerId_;
    isMyTurn = currentPlayerId === socket.id;
    answered = false;
    qSubmitd = false;
    if(isMyTurn) inputGuessWord.style.display = 'block';
    else inputGuessWord.style.display = 'none';
});

socket.on('receiveMessage', (data) => {
    const { nickname, message } = data;
    const messageElement = document.createElement('div');
    messageElement.textContent = `${nickname}: ${message}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
});

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

socket.on('updateTimer', (remainingTime)=>{
    let minutes = parseInt(remainingTime / 60, 10);
    let seconds = parseInt(remainingTime % 60, 10);

    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    timerElement.textContent = `${minutes}:${seconds}`;
});

socket.on('updatePlayers', (data) => {
    const { players, currentPlayer } = data;
    playerList.innerHTML = players.map(player => {
        const isCurrent = player.id === currentPlayer ? ' (當前)' : '';
        return `<li>${player.nickname}${isCurrent} - ${player.score} 點</li>`;
    }).join('');
});

socket.on('broadcast', (message)=>{
    displayMessage(message);
});

function displayMessage(message)
{
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}