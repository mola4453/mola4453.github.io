const canvas = document.getElementById('drawingCanvas');
const context = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');

canvas.width = 800;
canvas.height = 600;

let drawing = false;

const socket = io();

canvas.addEventListener('mousedown', () => drawing = true);
canvas.addEventListener('mouseup', () => {
    drawing = false;
    context.beginPath();
});
canvas.addEventListener('mousemove', draw);

function draw(event) {
    if (!drawing) return;
    const x = event.clientX - canvas.offsetLeft;
    const y = event.clientY - canvas.offsetTop;

    context.lineWidth = brushSize.value;
    context.lineCap = 'round';
    context.strokeStyle = colorPicker.value;

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

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}
