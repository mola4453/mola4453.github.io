alert("HI");
const canvas = document.getElementById('drawingCanvas');
const context = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');

canvas.width = 800;
canvas.height = 600;

let drawing = false;

canvas.addEventListener('mousedown', () => drawing = true);
canvas.addEventListener('mouseup', () => {
    drawing = false;
    context.beginPath();
});
canvas.addEventListener('mousemove', draw);

function draw(event) {
    if (!drawing) return;
    context.lineWidth = brushSize.value;
    context.lineCap = 'round';
    context.strokeStyle = colorPicker.value;

    context.lineTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
    context.stroke();
    context.beginPath();
    context.moveTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
}

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}
