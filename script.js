const modeSelection = document.getElementById('mode-selection'); 
const vsPlayerBtn = document.getElementById('vs-player');
const vsCpuBtn = document.getElementById('vs-cpu');
const gameSection = document.getElementById('game-section');
const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
const restartBtn = document.getElementById('restart');
const backBtn = document.getElementById('back');
const scoreXText = document.getElementById('score-x');
const scoreOText = document.getElementById('score-o');
const winLine = document.getElementById('win-line');

let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let running = false;
let isVsCPU = false;
let scoreX = 0;
let scoreO = 0;

const winConditions = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

// === Setup ===
vsPlayerBtn.addEventListener('click', () => startGame(false));
vsCpuBtn.addEventListener('click', () => startGame(true));
restartBtn.addEventListener('click', restartGame);
backBtn.addEventListener('click', goBackToMenu);

function startGame(vsCPU) {
  isVsCPU = vsCPU;
  modeSelection.style.display = 'none';
  gameSection.style.display = 'block';
  init();
}

function init() {
  board = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = "X";
  running = true;
  statusText.textContent = `Player ${currentPlayer}'s turn`;
  cells.forEach(cell => {
    cell.textContent = "";
    cell.removeEventListener("click", cellClicked); // Prevent duplicates
    cell.addEventListener("click", cellClicked);
  });
  winLine.innerHTML = "";
}

function cellClicked() {
  const index = this.getAttribute("data-index");
  if (board[index] !== "" || !running) return;

  makeMove(index);

  if (isVsCPU && running && currentPlayer === "O") {
    setTimeout(cpuMove, 300);
  }
}

function makeMove(index) {
  board[index] = currentPlayer;
  cells[index].textContent = currentPlayer;
  checkWinner();

  if (running) {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusText.textContent = `Player ${currentPlayer}'s turn`;
  }
}

function cpuMove() {
  let emptyIndices = board
    .map((val, idx) => val === "" ? idx : null)
    .filter(idx => idx !== null);

  for (let i of emptyIndices) {
    board[i] = "O";
    if (checkPotentialWin("O")) {
      board[i] = "";
      makeMove(i);
      return;
    }
    board[i] = "";
  }

  for (let i of emptyIndices) {
    board[i] = "X";
    if (checkPotentialWin("X")) {
      board[i] = "O";
      makeMove(i);
      return;
    }
    board[i] = "";
  }

  let randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  makeMove(randomIndex);
}

function checkWinner() {
  for (let combo of winConditions) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      drawAnimatedWinLine(combo);
      statusText.textContent = `Player ${currentPlayer} wins!`;
      running = false;
      updateScore(currentPlayer);
      return;
    }
  }

  if (!board.includes("")) {
    statusText.textContent = "It's a draw!";
    running = false;
  }
}

// 🧼 Removed unused: showWinLine()

function drawAnimatedWinLine(indices) {
  const cellsArray = document.querySelectorAll(".cell");
  const rect1 = cellsArray[indices[0]].getBoundingClientRect();
  const rect2 = cellsArray[indices[2]].getBoundingClientRect();
  const boardRect = document.querySelector(".board-container").getBoundingClientRect();

  const x1 = rect1.left + rect1.width / 2 - boardRect.left;
  const y1 = rect1.top + rect1.height / 2 - boardRect.top;
  const x2 = rect2.left + rect2.width / 2 - boardRect.left;
  const y2 = rect2.top + rect2.height / 2 - boardRect.top;

  const length = Math.hypot(x2 - x1, y2 - y1);
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

  winLine.innerHTML = `
    <div style="
      position: absolute;
      left: ${x1}px;
      top: ${y1}px;
      width: ${length}px;
      height: 5px;
      background: black;
      transform: rotate(${angle}deg);
      transform-origin: left center;
    "></div>
  `;
}

function checkPotentialWin(player) {
  return winConditions.some(([a, b, c]) =>
    (board[a] === player && board[b] === player && board[c] === "") ||
    (board[a] === player && board[c] === player && board[b] === "") ||
    (board[b] === player && board[c] === player && board[a] === "")
  );
}

function updateScore(winner) {
  if (winner === "X") {
    scoreX++;
    scoreXText.textContent = scoreX;
  } else {
    scoreO++;
    scoreOText.textContent = scoreO;
  }
}

function restartGame() {
  init();
}

function goBackToMenu() {
  gameSection.style.display = 'none';
  modeSelection.style.display = 'block';
  board = ["", "", "", "", "", "", "", "", ""];
  cells.forEach(cell => cell.textContent = "");
  statusText.textContent = "";
  running = false;
}