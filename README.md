# Tic Tac Toe Game

This is a simple browser-based Tic Tac Toe game with two modes: **Player vs Player** and **Player vs CPU**. It includes a scoreboard, restart functionality, and a back button to return to mode selection.

## JavaScript Code Explanation

```js
// Get all necessary DOM elements
const modeSelection = document.getElementById('mode-selection'); // Mode selection screen
const vsPlayerBtn = document.getElementById('vs-player'); // Button to start Player vs Player
const vsCpuBtn = document.getElementById('vs-cpu'); // Button to start Player vs CPU
const gameSection = document.getElementById('game-section'); // Main game section
const cells = document.querySelectorAll('.cell'); // All 9 Tic Tac Toe cells
const statusText = document.getElementById('status'); // Displays current game status
const restartBtn = document.getElementById('restart'); // Restart game button
const backBtn = document.getElementById('back'); // Button to return to mode selection
const scoreXText = document.getElementById('score-x'); // Display Player X's score
const scoreOText = document.getElementById('score-o'); // Display Player O's score

// Game variables
let board = ["", "", "", "", "", "", "", "", ""]; // Array representing the board state
let currentPlayer = "X"; // Tracks whose turn it is
let running = false; // Boolean to track if the game is active
let isVsCPU = false; // Boolean to check if CPU mode is active
let scoreX = 0; // Player X's score
let scoreO = 0; // Player O's score

// All possible win combinations
const winConditions = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6]             // diagonals
];

// === Setup event listeners ===
vsPlayerBtn.addEventListener('click', () => startGame(false)); // Start PvP mode
vsCpuBtn.addEventListener('click', () => startGame(true)); // Start PvCPU mode
restartBtn.addEventListener('click', restartGame); // Restart the game
backBtn.addEventListener('click', goBackToMenu); // Return to main menu

// Starts the game with either PvP or PvCPU
function startGame(vsCPU) {
  isVsCPU = vsCPU; // Store the selected mode
  modeSelection.style.display = 'none'; // Hide menu
  gameSection.style.display = 'block'; // Show game
  init(); // Initialize the game board
}

// Initializes the game board
function init() {
  board = ["", "", "", "", "", "", "", "", ""]; // Reset board
  currentPlayer = "X"; // Start with Player X
  running = true; // Game is now active
  statusText.textContent = `Player ${currentPlayer}'s turn`; // Update status

  // Clear all cells and set click listeners
  cells.forEach(cell => {
    cell.textContent = "";
    cell.addEventListener("click", cellClicked);
  });
}

// Handles cell click events
function cellClicked() {
  const index = this.getAttribute("data-index"); // Get clicked cell's index
  if (board[index] !== "" || !running) return; // Ignore if already filled or game is over

  makeMove(index); // Place mark

  // If CPU mode and it's O's turn, let CPU move after short delay
  if (isVsCPU && running && currentPlayer === "O") {
    setTimeout(cpuMove, 300);
  }
}

// Makes a move at a given index
function makeMove(index) {
  board[index] = currentPlayer; // Mark the board
  cells[index].textContent = currentPlayer; // Update UI
  checkWinner(); // Check if game is won

  if (running) {
    // Switch turn
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusText.textContent = `Player ${currentPlayer}'s turn`;
  }
}

// CPU selects a random empty cell
function cpuMove() {
  let emptyIndices = board
    .map((val, idx) => val === "" ? idx : null)
    .filter(idx => idx !== null);

  let randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  makeMove(randomIndex); // CPU makes a move
}

// Checks if there's a winner or draw
function checkWinner() {
  let roundWon = false;

  for (let condition of winConditions) {
    const [a, b, c] = condition;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      roundWon = true;
      break;
    }
  }

  if (roundWon) {
    statusText.textContent = `Player ${currentPlayer} wins!`; // Announce winner
    running = false;
    updateScore(currentPlayer); // Add score
  } else if (!board.includes("")) {
    statusText.textContent = "It's a draw!"; // Announce draw
    running = false;
  }
}

// Updates the score based on the winner
function updateScore(winner) {
  if (winner === "X") {
    scoreX++;
    scoreXText.textContent = scoreX;
  } else {
    scoreO++;
    scoreOText.textContent = scoreO;
  }
}

// Restarts the current game
function restartGame() {
  init(); // Simply reinitialize the game
}

// Returns to the main menu
function goBackToMenu() {
  gameSection.style.display = 'none'; // Hide game
  modeSelection.style.display = 'block'; // Show menu
  board = ["", "", "", "", "", "", "", "", ""]; // Reset board
  cells.forEach(cell => cell.textContent = ""); // Clear UI
  statusText.textContent = ""; // Clear status
  running = false; // Stop game
}