// Firebase 모듈 가져오기
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, set, push, query, orderByChild, limitToLast, get } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyAu1mpm5Gvte9erQOBxBfrapQj8S0_bIA",
    authDomain: "numberchaingame.firebaseapp.com",
    databaseURL: "https://numberchaingame-default-rtdb.firebaseio.com",
    projectId: "numberchaingame",
    storageBucket: "numberchaingame.appspot.com",
    messagingSenderId: "356652900956",
    appId: "1:356652900956:web:8c777312bd81c54a70bc99",
    measurementId: "G-HKJHK2Y0CE"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// DOM 요소 가져오기
const startScreen = document.getElementById("start-screen");
const gameContainer = document.getElementById("game-container");
const rankingContainer = document.getElementById("ranking-container");
const playerNameInput = document.getElementById("player-name");
const startButton = document.getElementById("start-button");
const rankingList = document.getElementById("ranking-list");
const restartButton = document.getElementById("restart-button");
const gameBoard = document.getElementById("game-board");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");

// 게임 상태 변수
let playerName = "";
let score = 0;
let timeRemaining = 30;
let timerStarted = false;
let timerInterval = null;
let selectedNumbers = [];

// 게임 시작 버튼 클릭 이벤트
startButton.addEventListener("click", () => {
    playerName = playerNameInput.value.trim();
    if (!playerName) {
        alert("Please enter your name!");
        return;
    }
    startScreen.style.display = "none";
    gameContainer.style.display = "block";
    initializeGame();
});

// 게임 초기화
function initializeGame() {
    score = 0;
    timeRemaining = 30;
    timerStarted = false;
    selectedNumbers = [];
    scoreDisplay.textContent = `Score: ${score}`;
    timerDisplay.textContent = `Time: ${timeRemaining}s`;
    if (timerInterval) clearInterval(timerInterval);
    createBoard();
}

// 게임 보드 생성
function createBoard() {
    gameBoard.innerHTML = "";
    const numbers = generateNumbers();
    numbers.forEach((num) => {
        const tile = document.createElement("div");
        tile.classList.add("tile");
        tile.textContent = num;
        tile.addEventListener("click", () => onTileClick(tile));
        gameBoard.appendChild(tile);
    });
}

// 숫자 배열 생성 (1~9 랜덤)
function generateNumbers() {
    const numbers = Array.from({ length: 9 }, (_, i) => i + 1);
    while (numbers.length < 25) {
        numbers.push(Math.floor(Math.random() * 9) + 1);
    }
    return numbers.sort(() => Math.random() - 0.5);
}

// 타일 클릭 처리
function onTileClick(tile) {
    if (!timerStarted) {
        startTimer();
        timerStarted = true;
    }

    const num = parseInt(tile.textContent);
    const lastNum = selectedNumbers[selectedNumbers.length - 1];

    if (!selectedNumbers.length || Math.abs(num - lastNum) === 1) {
        if (selectedNumbers.includes(num)) {
            alert("You already selected this number!");
            return;
        }
        selectedNumbers.push(num);
        tile.classList.add("selected");
    } else {
        alert("Invalid move!");
        resetSelection();
    }

    if (selectedNumbers.length === 9 && selectedNumbers.includes(1) && selectedNumbers.includes(9)) {
        calculateScore();
        timeRemaining += 3;
        createBoard();
        resetSelection();
    }
}

// 점수 계산
function calculateScore() {
    score += selectedNumbers.length ** 2;
    scoreDisplay.textContent = `Score: ${score}`;
}

// 선택 초기화
function resetSelection() {
    selectedNumbers = [];
    document.querySelectorAll(".tile").forEach((tile) => tile.classList.remove("selected"));
}

// 타이머 시작
function startTimer() {
    timerInterval = setInterval(() => {
        timeRemaining -= 1;
        timerDisplay.textContent = `Time: ${timeRemaining}s`;
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
}

// 게임 종료
function endGame() {
    alert(`Game Over! Final Score: ${score}`);
    saveScore(playerName, score);
    showRanking();
}

// 점수 저장
function saveScore(name, score) {
    const newScoreRef = push(ref(database, "scores"));
    set(newScoreRef, { name, score }).then(() => {
        console.log("Score saved successfully!");
    }).catch((error) => {
        console.error("Error saving score:", error);
    });
}

// 랭킹 표시
function showRanking() {
    gameContainer.style.display = "none";
    rankingContainer.style.display = "block";

    const scoresQuery = query(ref(database, "scores"), orderByChild("score"), limitToLast(10));
    get(scoresQuery).then((snapshot) => {
        if (snapshot.exists()) {
            const scores = [];
            snapshot.forEach((childSnapshot) => {
                scores.push(childSnapshot.val());
            });

            scores.sort((a, b) => b.score - a.score);

            rankingList.innerHTML = "";
            scores.forEach((entry, index) => {
                const listItem = document.createElement("li");
                listItem.textContent = `${index + 1}. ${entry.name}: ${entry.score}`;
                rankingList.appendChild(listItem);
            });
        } else {
            rankingList.innerHTML = "<li>No rankings available</li>";
        }
    }).catch((error) => {
        console.error("Error fetching rankings:", error);
    });
}

// 다시 시작 버튼
restartButton.addEventListener("click", () => {
    rankingContainer.style.display = "none";
    startScreen.style.display = "block";
    initializeGame();
});
