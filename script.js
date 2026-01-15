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
const totalGamesText = document.getElementById('total-games');
const drawsText = document.getElementById('draws');
const gamesLearnedText = document.getElementById('games-learned');
const patternDetectedText = document.getElementById('pattern-detected');

const winConditions = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6]  // diagonals
];

let difficulty = "hard"; 
const difficultySelect = document.getElementById('difficulty');

let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let running = false;
let isVsCPU = false;
let scoreX = 0;
let scoreO = 0;
let totalGames = 0;
let draws = 0;

// AI Learning System
let aiMemory = {
  openingMoves: {},      // Track player's first moves
  counterStrategies: {}, // Track successful counter-moves
  playerPatterns: [],    // Store complete game patterns
  winningSequences: [],  // Sequences that led to AI wins
  losingSequences: [],   // Sequences that led to AI losses
  gamesLearned: 0
};

let currentGameMoves = []; // Track moves in current game

// Load AI memory from localStorage
function loadAIMemory() {
  const saved = localStorage.getItem('tictactoe_ai_memory');
  if (saved) {
    aiMemory = JSON.parse(saved);
    gamesLearnedText.textContent = aiMemory.gamesLearned;
    updatePatternDetection();
  }
}

// Save AI memory to localStorage
function saveAIMemory() {
  localStorage.setItem('tictactoe_ai_memory', JSON.stringify(aiMemory));
  gamesLearnedText.textContent = aiMemory.gamesLearned;
}

// Detect player patterns
function updatePatternDetection() {
  if (!aiMemory.playerPatterns.length) {
    patternDetectedText.textContent = "Unknown";
    return;
  }

  const patterns = {
    corners: 0,
    center: 0,
    edges: 0
  };

  aiMemory.playerPatterns.forEach(game => {
    if (game.length > 0) {
      const firstMove = game[0];
      if ([0, 2, 6, 8].includes(firstMove)) patterns.corners++;
      else if (firstMove === 4) patterns.center++;
      else patterns.edges++;
    }
  });

  const total = patterns.corners + patterns.center + patterns.edges;
  if (total === 0) {
    patternDetectedText.textContent = "Unknown";
    return;
  }

  const cornerPercent = (patterns.corners / total * 100).toFixed(0);
  const centerPercent = (patterns.center / total * 100).toFixed(0);
  const edgePercent = (patterns.edges / total * 100).toFixed(0);

  if (patterns.corners > patterns.center && patterns.corners > patterns.edges) {
    patternDetectedText.textContent = `Corner Player (${cornerPercent}%)`;
  } else if (patterns.center > patterns.corners && patterns.center > patterns.edges) {
    patternDetectedText.textContent = `Center Player (${centerPercent}%)`;
  } else if (patterns.edges > patterns.corners && patterns.edges > patterns.center) {
    patternDetectedText.textContent = `Edge Player (${edgePercent}%)`;
  } else {
    patternDetectedText.textContent = "Mixed Strategy";
  }
}

// Learn from game outcome
function learnFromGame(winner) {
  const playerMoves = currentGameMoves.filter((_, idx) => idx % 2 === 0);
  
  // Store player pattern
  aiMemory.playerPatterns.push(playerMoves);
  
  // Track opening moves
  if (playerMoves.length > 0) {
    const opening = playerMoves[0];
    aiMemory.openingMoves[opening] = (aiMemory.openingMoves[opening] || 0) + 1;
  }
  
  // Learn from outcomes
  if (winner === "O") {
    // AI won - remember this sequence
    aiMemory.winningSequences.push([...currentGameMoves]);
  } else if (winner === "X") {
    // AI lost - remember to avoid this
    aiMemory.losingSequences.push([...currentGameMoves]);
  }
  
  // Trim old data to prevent memory bloat (keep last 50 games)
  if (aiMemory.playerPatterns.length > 50) {
    aiMemory.playerPatterns = aiMemory.playerPatterns.slice(-50);
  }
  if (aiMemory.winningSequences.length > 30) {
    aiMemory.winningSequences = aiMemory.winningSequences.slice(-30);
  }
  if (aiMemory.losingSequences.length > 30) {
    aiMemory.losingSequences = aiMemory.losingSequences.slice(-30);
  }
  
  aiMemory.gamesLearned++;
  saveAIMemory();
  updatePatternDetection();
}

// Get learned counter-move
function getLearnedMove(emptyIndices) {
  // Check if current game state matches a losing sequence
  for (let loseSeq of aiMemory.losingSequences) {
    if (currentGameMoves.length >= 2 && 
        loseSeq[0] === currentGameMoves[0] && 
        loseSeq[1] === currentGameMoves[1]) {
      // Try different move than what led to loss
      const avoidMove = loseSeq.length > 2 ? loseSeq[2] : null;
      const alternatives = emptyIndices.filter(idx => idx !== avoidMove);
      if (alternatives.length > 0) {
        return alternatives[Math.floor(Math.random() * alternatives.length)];
      }
    }
  }
  
  // Check if we can replicate a winning sequence
  for (let winSeq of aiMemory.winningSequences) {
    if (currentGameMoves.length >= 2 && 
        winSeq[0] === currentGameMoves[0] && 
        winSeq[1] === currentGameMoves[1] &&
        winSeq.length > currentGameMoves.length) {
      const nextMove = winSeq[currentGameMoves.length];
      if (emptyIndices.includes(nextMove)) {
        return nextMove;
      }
    }
  }
  
  return null;
}

// Predict player's likely next move based on patterns
function predictPlayerMove(emptyIndices) {
  const corners = [0, 2, 6, 8].filter(idx => emptyIndices.includes(idx));
  const edges = [1, 3, 5, 7].filter(idx => emptyIndices.includes(idx));
  const center = emptyIndices.includes(4) ? [4] : [];
  
  // Analyze player's opening preferences
  const cornerOpening = (aiMemory.openingMoves[0] || 0) + (aiMemory.openingMoves[2] || 0) + 
                        (aiMemory.openingMoves[6] || 0) + (aiMemory.openingMoves[8] || 0);
  const centerOpening = aiMemory.openingMoves[4] || 0;
  const edgeOpening = (aiMemory.openingMoves[1] || 0) + (aiMemory.openingMoves[3] || 0) + 
                      (aiMemory.openingMoves[5] || 0) + (aiMemory.openingMoves[7] || 0);
  
  if (cornerOpening > centerOpening && cornerOpening > edgeOpening && corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  } else if (centerOpening > cornerOpening && centerOpening > edgeOpening && center.length > 0) {
    return center[0];
  } else if (edges.length > 0) {
    return edges[Math.floor(Math.random() * edges.length)];
  }
  
  return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}

vsPlayerBtn.addEventListener('click', () => startGame(false));
vsCpuBtn.addEventListener('click', () => startGame(true));
restartBtn.addEventListener('click', restartGame);
backBtn.addEventListener('click', goBackToMenu);

// Load AI memory on page load
loadAIMemory();

function startGame(vsCPU) {
  isVsCPU = vsCPU;
  difficulty = difficultySelect.value;
  modeSelection.style.display = 'none';
  gameSection.style.display = 'block';
  init();
}

function init() {
  board = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = "X";
  running = true;
  currentGameMoves = [];
  statusText.textContent = `Player ${currentPlayer}'s turn`;
  cells.forEach(cell => {
    cell.textContent = "";
    cell.classList.remove('filled', 'x', 'o');
    cell.removeEventListener("click", cellClicked);
    cell.addEventListener("click", cellClicked);
  });
  winLine.innerHTML = "";
}

function cellClicked() {
  const index = this.getAttribute("data-index");
  if (board[index] !== "" || !running) return;

  makeMove(index);

  if (isVsCPU && running && currentPlayer === "O") {
    setTimeout(cpuMove, 400);
  }
}

function makeMove(index) {
  board[index] = currentPlayer;
  cells[index].textContent = currentPlayer;
  cells[index].classList.add('filled', currentPlayer.toLowerCase());
  
  // Track move for AI learning
  if (isVsCPU) {
    currentGameMoves.push(parseInt(index));
  }
  
  checkWinner();

  if (running) {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusText.textContent = `Player ${currentPlayer}'s turn`;
  }
}

function cpuMove() {
  if (!isVsCPU || !running) return;
  
  let emptyIndices = board
    .map((val, idx) => val === "" ? idx : null)
    .filter(idx => idx !== null);

  if (difficulty === "easy") {
    // Easy: Smart but makes mistakes (old medium)
    // Win if possible
    for (let i of emptyIndices) {
      board[i] = "O";
      if (checkPotentialWin("O")) {
        board[i] = ""; 
        makeMove(i);
        return;
      }
      board[i] = "";
    }

    // Block player 80% of the time
    if (Math.random() < 0.8) {
      for (let i of emptyIndices) {
        board[i] = "X";
        if (checkPotentialWin("X")) {
          board[i] = "";
          makeMove(i);
          return;
        }
        board[i] = "";
      }
    }

    // Take center
    if (emptyIndices.includes(4)) {
      makeMove(4);
      return;
    }

    // Take corner
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(idx => emptyIndices.includes(idx));
    if (availableCorners.length > 0) {
      makeMove(availableCorners[Math.floor(Math.random() * availableCorners.length)]);
      return;
    }

    makeMove(emptyIndices[Math.floor(Math.random() * emptyIndices.length)]);
    
  } else if (difficulty === "medium") {
    // Medium: Perfect play with Minimax (old impossible)
    const bestMove = minimax(board, "O").index;
    makeMove(bestMove);
    
  } else {
    // Hard: Adaptive AI that learns from player
    
    // 1. CRITICAL: Check if AI can win immediately
    for (let i of emptyIndices) {
      board[i] = "O";
      if (checkWinnerForMinimax(board, "O")) {
        board[i] = "";
        makeMove(i);
        return;
      }
      board[i] = "";
    }

    // 2. CRITICAL: Block player from winning
    for (let i of emptyIndices) {
      board[i] = "X";
      if (checkWinnerForMinimax(board, "X")) {
        board[i] = "";
        makeMove(i);
        return;
      }
      board[i] = "";
    }

    // 3. Use learned patterns (if enough data)
    if (aiMemory.gamesLearned >= 3) {
      const learnedMove = getLearnedMove(emptyIndices);
      if (learnedMove !== null) {
        makeMove(learnedMove);
        return;
      }
    }

    // 4. Predict and counter player's likely move
    if (aiMemory.gamesLearned >= 5) {
      const predictedPlayerMove = predictPlayerMove(emptyIndices);
      
      // Try to create a fork or take strategic position
      const strategicMoves = [];
      
      // Counter predicted corner play
      if ([0, 2, 6, 8].includes(predictedPlayerMove)) {
        if (emptyIndices.includes(4)) strategicMoves.push(4);
        const oppositeCorners = {0: 8, 2: 6, 6: 2, 8: 0};
        if (emptyIndices.includes(oppositeCorners[predictedPlayerMove])) {
          strategicMoves.push(oppositeCorners[predictedPlayerMove]);
        }
      }
      
      if (strategicMoves.length > 0) {
        makeMove(strategicMoves[Math.floor(Math.random() * strategicMoves.length)]);
        return;
      }
    }

    // 5. Fall back to minimax for optimal play
    const bestMove = minimax(board, "O").index;
    makeMove(bestMove);
  }
}

function minimax(newBoard, player) {
  const availSpots = newBoard
    .map((val, idx) => val === "" ? idx : null)
    .filter(idx => idx !== null);

  if (checkWinnerForMinimax(newBoard, "X")) {
    return { score: -10 };
  } else if (checkWinnerForMinimax(newBoard, "O")) {
    return { score: 10 };
  } else if (availSpots.length === 0) {
    return { score: 0 };
  }

  const moves = [];

  for (let i = 0; i < availSpots.length; i++) {
    const move = {};
    move.index = availSpots[i];
    newBoard[availSpots[i]] = player;

    if (player === "O") {
      const result = minimax(newBoard, "X");
      move.score = result.score;
    } else {
      const result = minimax(newBoard, "O");
      move.score = result.score;
    }

    newBoard[availSpots[i]] = "";
    moves.push(move);
  }

  let bestMove;
  if (player === "O") {
    let bestScore = -Infinity;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score > bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score < bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  }

  return moves[bestMove];
}

function checkWinnerForMinimax(boardState, player) {
  return winConditions.some(([a, b, c]) => 
    boardState[a] === player && 
    boardState[b] === player && 
    boardState[c] === player
  );
}

function checkWinner() {
  for (let combo of winConditions) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      drawAnimatedWinLine(combo);
      statusText.textContent = `🎉 Player ${currentPlayer} wins!`;
      running = false;
      updateScore(currentPlayer);
      
      // Learn from game outcome
      if (isVsCPU && difficulty === "hard") {
        learnFromGame(currentPlayer);
      }
      
      totalGames++;
      totalGamesText.textContent = totalGames;
      return;
    }
  }

  if (!board.includes("")) {
    statusText.textContent = "🤝 It's a draw!";
    running = false;
    
    // Learn from draw
    if (isVsCPU && difficulty === "hard") {
      learnFromGame(null);
    }
    
    draws++;
    drawsText.textContent = draws;
    totalGames++;
    totalGamesText.textContent = totalGames;
  }
}

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

  const line = document.createElement("div");
  line.className = "drawing-line";
  line.style.left = `${x1}px`;
  line.style.top = `${y1}px`;
  line.style.transform = `rotate(${angle}deg)`;

  winLine.appendChild(line);

  setTimeout(() => {
    line.style.width = `${length}px`;
  }, 10);
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
  cells.forEach(cell => {
    cell.textContent = "";
    cell.classList.remove('filled', 'x', 'o');
  });
  statusText.textContent = "";
  winLine.innerHTML = "";
  running = false;
  scoreX = 0;
  scoreO = 0;
  totalGames = 0;
  draws = 0;
  scoreXText.textContent = "0";
  scoreOText.textContent = "0";
  totalGamesText.textContent = "0";
  drawsText.textContent = "0";
}