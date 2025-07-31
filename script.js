// Firebase imports for Firestore
import { collection, addDoc, query, orderBy, limit, getDocs }
  from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const gameBoard = document.getElementById('gameBoard');
const levelText = document.getElementById('levelText');
const timerText = document.getElementById('timerText');
const gameOverDiv = document.getElementById('gameOver');
const finalScore = document.getElementById('finalScore');

let level = 1;
let timer = null;
let timeLeft = 10;
let correctCell = null; 
let playerName = "";

startBtn.addEventListener('click', newPlayerGame);
restartBtn.addEventListener('click', restartGame);

function newPlayerGame() {
  const input = document.getElementById('playerNameInput');
  const nameValue = input.value.trim();

  if (!nameValue) {
    alert("Please enter your name before starting!");
    return; // stop starting the game
  }

  playerName = nameValue;

  // Completely remove the player input section (not just hide)
  const playerInputDiv = document.getElementById('playerInput');
  if (playerInputDiv) {
    playerInputDiv.remove();
  }

  beginGame();
}



function restartGame() {
  // Restart with same player name
  beginGame();
}

function beginGame() {
  document.getElementById('leaderboard').style.display = 'none';
  level = 1;
  gameOverDiv.classList.add('hidden');
  startBtn.style.display = 'none';
  updateInfo();
  createGrid();
}


function startTimer() {
  clearInterval(timer);
  timeLeft = 10;
  timerText.textContent = `Time: ${timeLeft}`;
  timer = setInterval(() => {
    timeLeft--;
    timerText.textContent = `Time: ${timeLeft}`;
    if (timeLeft <= 0) {
        clearInterval(timer);
        highlightCorrectCell(correctCell);
    }

  }, 1000);
}

function updateInfo() {
  levelText.textContent = `Level: ${level}`;
}

function showGameOver() {
  gameBoard.innerHTML = '';

  // Save score to Firebase
  saveScore(playerName, level);

  // Refresh leaderboard
  renderLeaderboard();

  // Show leaderboard now that the game is over
  document.getElementById('leaderboard').style.display = 'block';

  gameOverDiv.classList.remove('hidden');
  finalScore.textContent = `Oops ${playerName}! You reached Level ${level}`;
  startBtn.style.display = 'inline-block';
  clearInterval(timer);
  timerText.textContent = '';
}



function highlightCorrectCell(correctCell) {
  if (!correctCell) return;

  const allCells = document.querySelectorAll('.cell');

  allCells.forEach(cell => {
    // Make every cell white except the correct one
    if (cell !== correctCell) {
      cell.classList.add('dimmed'); // turn white
    }
  });

  // Highlight the correct cell
  correctCell.classList.add('highlighted');

  setTimeout(() => {
    correctCell.classList.remove('highlighted');
    allCells.forEach(cell => cell.classList.remove('dimmed'));
    showGameOver();
  }, 1000);
}

function createGrid() {
  clearInterval(timer);
  startTimer();
  gameBoard.innerHTML = '';

  
let gridSize = 2 + Math.floor((level - 1) / 2);
if (level > 18) {
  gridSize = 10; // stop at 10x10
}

let cellSize;
if (gridSize === 10) {
  cellSize = 40; // fixed size for max grid
} else {
  const maxCellSize = 90;
  cellSize = Math.max(40, maxCellSize - level * 4);
}
  const maxCellSize = 90;
  //const cellSize = Math.max(40, maxCellSize - level * 4);
  gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, ${cellSize}px)`;

  const baseColor = getRandomColor();
  // Decrease difference faster: by 3 per level instead of 2
  const diffAmount = Math.max(10, 40 - level * 2);
  //const diffAmount = Math.max(15, 45 - level * 1.5);
  const diffColor = adjustColor(baseColor, diffAmount);

  const totalCells = gridSize * gridSize;
  const diffIndex = Math.floor(Math.random() * totalCells);

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.style.width = `${cellSize}px`;
    cell.style.height = `${cellSize}px`;
    cell.style.backgroundColor = i === diffIndex ? diffColor : baseColor;
    cell.style.border = "1px solid black";

    // Always set correctCell for the different cell
    if (i === diffIndex) {
      correctCell = cell;
    }

    cell.addEventListener('click', () => {
      if (i === diffIndex) {
        level++;
        updateInfo();
        createGrid();
      } else {
        highlightCorrectCell(correctCell);
      }
    });

    gameBoard.appendChild(cell);
  }
}


function getRandomColor() {
  const r = Math.floor(Math.random() * 200);
  const g = Math.floor(Math.random() * 200);
  const b = Math.floor(Math.random() * 200);
  return `rgb(${r}, ${g}, ${b})`;
}

function adjustColor(rgb, diff) {
  const parts = rgb.match(/\d+/g).map(Number);
  const [r, g, b] = parts;
  return `rgb(${clamp(r + diff)}, ${clamp(g + diff)}, ${clamp(b + diff)})`;
}


function clamp(value) {
  return Math.max(0, Math.min(255, value));
}

async function saveScore(name, score) {
  try {
    const ref = await addDoc(collection(window.db, "scores"), { name, score });
  } catch (e) {
    console.error("Error saving score: ", e);
  }
}


async function renderLeaderboard() {
  const leaderboardDiv = document.getElementById('leaderboard');
  const q = query(collection(window.db, "scores"), orderBy("score", "desc"), limit(5));
  const snapshot = await getDocs(q);

  let html = `
    <h3 class="text-xl font-bold mb-4 text-gray-700 text-center">Top Players</h3>
    <table class="w-full border-collapse">
      <thead>
        <tr class="bg-gray-100 text-left">
          <th class="p-2 border-b">Rank</th>
          <th class="p-2 border-b">Name</th>
          <th class="p-2 border-b">Max Level</th>
        </tr>
      </thead>
      <tbody>
  `;

  let rank = 1;
  snapshot.forEach(doc => {
    const data = doc.data();
    html += `
      <tr class="hover:bg-gray-50">
        <td class="p-2 border-b">${rank}</td>
        <td class="p-2 border-b">${data.name}</td>
        <td class="p-2 border-b">${data.score}</td>
      </tr>
    `;
    rank++;
  });

  html += `
      </tbody>
    </table>
  `;

  leaderboardDiv.innerHTML = html;
}

// Show leaderboard on page load
document.getElementById('leaderboard').style.display = 'block';
renderLeaderboard();

