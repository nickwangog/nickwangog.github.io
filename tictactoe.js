alert("Hello");
const canvas = document.getElementById('ttt');
const ctx = canvas.getContext('2d');
const msg = document.getElementById('message');
const resetButton = document.getElementById('resetButton');
const aiButton = document.getElementById('aiButton');
const twoPlayerButton = document.getElementById('twoPlayerButton');
const cellSize = 100;
const grid = [
    0, 0, 0,
    0, 0, 0,
    0, 0, 0
]
const winPatterns = [
    0b111000000, 0b000111000, 0b000000111, //rows
    0b100100100, 0b010010010, 0b001001001, //columns
    0b100010001, 0b001010100 //diagonals
]
const X = 1;
const O = -1;
const BLANK = 0;
mouse = {
    x: -1,
    y: -1,
}
const playerCheck = Math.floor(Math.random() * 2);
playerCheck == 1 ? currentPlayer = X : currentPlayer = O;
let gameOver = false;
let winCells = [];
let win = false;
let aiMode = true;
let twoPlayerMode = false;
let aiTurn = false;
let newGame = true;
var interval = 0;

var gameStats = {
    'Time':0,
    'xWins':0,
    'oWins':0,
    'Ties':0
}

canvas.width = canvas.height = 3 * cellSize;

function playTwoPlayer(cell) {
    if (gameOver == true)
        return;
    if (grid[cell] != BLANK){
        msg.textContent = 'Position occupied.';
        return;
    }
    grid[cell] = currentPlayer;
    displayTurn();
    checkWin(currentPlayer);
    checkTie();
    currentPlayer *= -1;
}

function playAiOpponent(cell) {
    if (gameOver == true)
        return;
    if (grid[cell] != BLANK){
        msg.textContent = 'Position occupied.';
        aiTurn = false;
        return;
    }
    grid[cell] = currentPlayer;
    displayTurn();
    checkWin(currentPlayer);
    checkTie();
    currentPlayer *= -1;
    aiTurn = true;
}

function aiPlays() {
    if (gameOver == true)
        return;
    aiMove();
    displayTurn();
    checkWin(currentPlayer);
    checkTie();
    currentPlayer *= -1;
    aiTurn = false;    
}

function aiMove() {
    let possibleMoves = [];
    let blankCorners = [];
    for(i = 0; i < 9; i++){
        if (grid[i] == BLANK){
            possibleMoves.push(i);
        }
    }
    for(i = 0; i < 9; i += 2){
        if (grid[i] == BLANK){
            blankCorners.push(i);
        }
    }
    let playPosition = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    let randomCorner = blankCorners[Math.floor(Math.random() * blankCorners.length)];
    if (grid[4] == BLANK)
        playPosition = 4;
    else if (randomCorner != undefined)
        playPosition = randomCorner;
    grid[playPosition] = currentPlayer;
}

function checkWin(player) {
    let bitMap = 0;
    let bit = 1;
    for (let i = 0; i < grid.length; i++){
        bitMap <<= 1;
        if (grid[i] == player)
            bitMap += 1;
    }
    for (let i = 0; i < winPatterns.length; i++){
        if ((bitMap & winPatterns[i]) == winPatterns[i]){
            if (currentPlayer == -1 ) {
                msg.textContent = 'O is the winner!';
                gameStats.oWins += 1;
                oWin();
            }
            else {
                msg.textContent = 'X is the winner!';
                gameStats.xWins += 1;
                xWin();
            }
            gameOver = true;
            for (let j = 0; j < grid.length; j++){
                if ((bit & winPatterns[i]) == bit)
                    winCells.push(j);
                bit <<= 1;
            win = true;
            newGame = true;
            clearInterval(interval);
            interval = 0;
            }
        }
    }
}

function checkTie() {
    if (win == true) 
        return;
    if (grid.indexOf(BLANK) == -1){
        gameOver = true;
        msg.textContent = 'Tie game!';
        gameStats.Ties += 1;
        newGame = true;
        clearInterval(interval);
        interval = 0;
        tieGame();
    }
}

//fmpurl script calls

function passJSON(data) {
    data = JSON.stringify(data);
    let URL = 'fmp://$/TicTacToe?script=PassJSON&param=' + data;
    window.location = URL;
}

function oWin() {
    let URL = 'fmp://$/TicTacToe?script=oWin';
    window.location = URL;
}

function xWin() {
    let URL = 'fmp://$/TicTacToe?script=xWin';
    window.location = URL;
}

function tieGame() {
    let URL = 'fmp://$/TicTacToe?script=tieGame';
    window.location = URL;
}

//draw board

function draw() {
    ctx.fillStyle = 'white';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0,0,canvas.width, canvas.height);
    mouseHighlight();
    drawBorder();
    drawBoard();
    fillBoard();
    drawWin();

    function drawBorder() {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 15;
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(canvas.width, 0);
        ctx.lineTo(canvas.width,canvas.height);
        ctx.lineTo(0,canvas.height);
        ctx.lineTo(0,0);
        ctx.stroke();
    }

    function drawBoard() {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(cellSize,0);
        ctx.lineTo(cellSize,canvas.height);
        ctx.moveTo(cellSize*2,0);
        ctx.lineTo(cellSize*2,canvas.height);
        ctx.moveTo(0,cellSize);
        ctx.lineTo(canvas.width,cellSize);
        ctx.moveTo(0,cellSize*2);
        ctx.lineTo(canvas.width,cellSize*2);
        ctx.stroke();
    }

    function fillBoard() {
        for (let i = 0; i < grid.length; i++){
            let coords = getCellCoords(i);
            ctx.save();
            if (grid[i] == X){
                drawX(coords.x,coords.y);
            }
            else if (grid[i] == O){
                drawO(coords.x, coords.y);
            }
            ctx.restore();
        }
    }

    function mouseHighlight() {
        if (gameOver)
            return;
        let cellNum = getCellByCoords(mouse.x, mouse.y);
        let coords = getCellCoords(cellNum);
        ctx.fillStyle = 'rgba(10, 10, 220, 0.2)';
        ctx.fillRect(coords.x, coords.y, cellSize, cellSize);
        if (grid[cellNum] == BLANK){
            ctx.save();
            if (currentPlayer == X){
                ctx.strokeStyle = 'rgba(255, 10, 10, 0.5)';
                ctx.beginPath();
                ctx.moveTo(coords.x+15, coords.y+15);
                ctx.lineTo(coords.x+cellSize-15, coords.y+cellSize-15);
                ctx.moveTo(coords.x+cellSize-15, coords.y+15);
                ctx.lineTo(coords.x+15, coords.y+cellSize-15);
                ctx.stroke();
            }
            else if (currentPlayer == O){
                ctx.strokeStyle = 'rgba(10, 10, 255, 0.5)';
                ctx.beginPath();
                ctx.arc(coords.x+cellSize/2,coords.y+cellSize/2,35,0,2*Math.PI);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    function drawWin() {
        if (winCells.length == 3) {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.lineWidth = 10;
            ctx.save();
            if (winCells[0] == 0 && winCells[1] == 1 && winCells[2] == 2){
                ctx.beginPath();
                ctx.moveTo(10, cellSize * 3 - cellSize/2);
                ctx.lineTo(cellSize*3 - 10, cellSize * 3 - cellSize/2);
                ctx.stroke();
            }
            else if (winCells[0] == 3 && winCells[1] == 4 && winCells[2] == 5){
                ctx.beginPath();
                ctx.moveTo(10, cellSize * 2 - cellSize/2);
                ctx.lineTo(cellSize*3 - 10, cellSize * 2 - cellSize/2);
                ctx.stroke();
            }
            else if (winCells[0] == 6 && winCells[1] == 7 && winCells[2] == 8){
                ctx.beginPath();
                ctx.moveTo(10, cellSize - cellSize/2);
                ctx.lineTo(cellSize*3 - 10, cellSize - cellSize/2);
                ctx.stroke();
            }
            else if (winCells[0] == 2 && winCells[1] == 5 && winCells[2] == 8){
                ctx.beginPath();
                ctx.moveTo(cellSize - cellSize/2, 10);
                ctx.lineTo(cellSize - cellSize/2 , cellSize * 3 -10);
                ctx.stroke();
            }
            else if (winCells[0] == 1 && winCells[1] == 4 && winCells[2] == 7){
                ctx.beginPath();
                ctx.moveTo(cellSize * 2 - cellSize/2, 10);
                ctx.lineTo(cellSize * 2 - cellSize/2 , cellSize * 3 -10);
                ctx.stroke();
            }
            else if (winCells[0] == 0 && winCells[1] == 3 && winCells[2] == 6){
                ctx.beginPath();
                ctx.moveTo(cellSize * 3 - cellSize/2, 10);
                ctx.lineTo(cellSize * 3 - cellSize/2 , cellSize * 3 -10);
                ctx.stroke();
            }
            else if (winCells[0] == 0 && winCells[1] == 4 && winCells[2] == 8){
                ctx.beginPath();
                ctx.moveTo(15, 15);
                ctx.lineTo(cellSize * 3 - 15 , cellSize * 3 - 15);
                ctx.stroke();
            }
            else if (winCells[0] == 2 && winCells[1] == 4 && winCells[2] == 6){
                ctx.beginPath();
                ctx.moveTo(cellSize * 3 - 15 , 15);
                ctx.lineTo(15, cellSize * 3 - 15);
                ctx.stroke();
            }
            ctx.restore();
        }
    }
    requestAnimationFrame(draw);
}

function drawX(x, y) {
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(x+15, y+15);
    ctx.lineTo(x+cellSize-15, y+cellSize-15);
    ctx.moveTo(x+cellSize-15, y+15);
    ctx.lineTo(x+15, y+cellSize-15);
    ctx.stroke();
}

function drawO(x, y) {
    ctx.strokeStyle = 'blue';
    ctx.beginPath();
    ctx.arc(x+cellSize/2,y+cellSize/2,35,0,2*Math.PI);
    ctx.stroke();
}

function displayTurn(){
    currentPlayer == X ? msg.textContent = `O's turn to play.` : msg.textContent = `X's turn to play.`
}

function getCellByCoords(x, y){
    return Math.floor(x/cellSize)%3 + Math.floor(y/cellSize)*3;
};

function getCellCoords(cell) {
    let x = (cell % 3) * cellSize;
    let y = Math.floor(cell/3) * cellSize;

    return {
        'x': x,
        'y': y
    };
}

function resetGame() {
    for(i = 0; i < 9; i++){
        grid[i] = BLANK;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    playerCheck == 1 ? currentPlayer = X : currentPlayer = O;
    gameOver = false;
    winCells = [];
    win = false;
    newGame = true;
    passJSON(gameStats);
    msg.textContent = 'Play Tic Tac Toe';
}

function aiOpponentOn() {
    twoPlayerMode = false;
    aiMode = true;
    msg.textContent = 'Computer';
    resetGame();
}

function twoPlayerOn() {
    aiMode = false;
    twoPlayerMode = true;
    msg.textContent = 'Two Players';
    resetGame();
}

function gameTimer() {
    interval = setInterval(increaseTime, 1000);
}

function increaseTime(){
    gameStats.Time += 1;
}

//event listeners

canvas.addEventListener('mouseout', function(){
    mouse.x = -1;
    mouse.y = -1;
});

canvas.addEventListener('mousemove', function(e){
    let x = e.pageX - canvas.offsetLeft;
    let y = e.pageY - canvas.offsetTop;

    mouse.x = x;
    mouse.y = y;
});

canvas.addEventListener('click', function(e){
    if (newGame == true) {
        gameStats.Time = 0;
        gameTimer();
        newGame = false;
    }
    if (twoPlayerMode == true && aiMode == false)
        playTwoPlayer(getCellByCoords(mouse.x,mouse.y));
    else if (twoPlayerMode == false && aiMode == true){             
        playAiOpponent(getCellByCoords(mouse.x,mouse.y));
        if (aiTurn == true)
            aiPlays();
        }
});

resetButton.addEventListener('click', resetGame, false);
twoPlayerButton.addEventListener('click', twoPlayerOn, false);
aiButton.addEventListener('click', aiOpponentOn, false);

draw();