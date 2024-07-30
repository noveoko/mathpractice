const answers = { num_1: 0, num_2: 0, guess: 0, correct: 0 };
const config = { max: 10, score: 0, no_submit: false, difficulty: 'easy' };
const states = { right_answer: '😄', wrong_answer: '⛔', initial_state: '❔' };
const history = {};
const last_answer = { previous: [] };
const stats = Array.from({ length: 10 }, () => Array(10).fill(0));
const wrongCount = Array.from({ length: 10 }, () => Array(10).fill(0));
const correctCount = Array.from({ length: 10 }, () => Array(10).fill(0));
let attemptedProblems = new Set();
let completedProblems = new Set();
let timer;
let timerProgress;
let allProblemsAttempted = false;
let hyperFocusMode = false;

window.addEventListener('load', (event) => {
    console.log('Math Game Start');
    load_question();
    createGraph();
    setDifficulty(config.difficulty);
});

const correct_sound = new Audio('sounds/correct_answer/success.mp3');
const wrong_sound = new Audio('sounds/wrong_answer/Wrong-answer-sound-effect.mp3');
const start_sound = new Audio('sounds/game_start/game-start-6104.mp3');

function random_int() {
    return Math.ceil(Math.random() * config.max);
}

function weighted_random_int() {
    if (hyperFocusMode) {
        return getHyperFocusProblem();
    }

    let choices = [];
    for (let i = 1; i <= 10; i++) {
        for (let j = i; j <= 10; j++) {  // Ensure i <= j
            if (!completedProblems.has(`${i}-${j}`)) {
                let weight = 1 + wrongCount[i - 1][j - 1] - correctCount[i - 1][j - 1];
                weight = Math.max(weight, 1);
                for (let k = 0; k < weight; k++) {
                    choices.push([i, j]);
                }
            }
        }
    }

    if (choices.length === 0) {
        for (let i = 1; i <= 10; i++) {
            for (let j = i; j <= 10; j++) {  // Ensure i <= j
                if (!completedProblems.has(`${i}-${j}`) || completedProblems.size === 55) {  // 55 unique combinations (1-10) × (1-10)
                    choices.push([i, j]);
                }
            }
        }
    }

    let choice = choices[Math.floor(Math.random() * choices.length)];
    return choice;
}

function answer_set() {
    let [number_1, number_2] = weighted_random_int();
    answers.num_1 = number_1;
    answers.num_2 = number_2;
    answers.correct = number_1 * number_2;
    last_answer.previous = [number_1, number_2];
    attemptedProblems.add(`${number_1}-${number_2}`);
    checkAllProblemsAttempted();
}

async function reset_game() {
    if (confirm('Reset game? Warning: Score will be lost!')) {
        console.log("Game reset!");
        window.location.reload();
    } else {
        console.log("No action taken");
    }
}

function new_game() {
    reset_game().then(() => {
        console.log("Answer field in focus");
        document.querySelector("#answer").focus();
    });
}

function update_score(points) {
    document.querySelector("#score-value").textContent = `${points}`;
}

function decrease_score(v = 1) {
    config.score -= v;
}

function increase_score(v = 1) {
    config.score += v;
}

function updateGraph(num1, num2, correct, firstTry) {
    let color;
    let i = Math.min(num1, num2);
    let j = Math.max(num1, num2);
    let count = correctCount[i - 1][j - 1];

    if (correct) {
        correctCount[i - 1][j - 1]++;
        if (count === 0 && firstTry) {
            color = '#FFD700';  // Gold
        } else if (count === 1) {
            color = '#32CD32';  // Lime Green
        } else if (count === 2) {
            color = '#228B22';  // Forest Green
            completedProblems.add(`${i}-${j}`);
        }
    } else {
        wrongCount[i - 1][j - 1]++;
        color = '#FF6347';  // Tomato
    }

    if (color) {
        document.getElementById(`cell-${i}-${j}`).style.backgroundColor = color;
    }
}

function startTimer() {
    if (config.difficulty === 'hard') {
        clearTimeout(timer);
        timerProgress.style.width = '100%';
        setTimeout(() => {
            timerProgress.style.width = '0%';
        }, 10);
        timer = setTimeout(() => {
            console.log("Time's up!");
            solve();
        }, 3000);
    }
}

function setDifficulty(difficulty) {
    config.difficulty = difficulty;
    document.getElementById('easy-mode').classList.toggle('active', difficulty === 'easy');
    document.getElementById('hard-mode').classList.toggle('active', difficulty === 'hard');
    if (difficulty === 'easy') {
        clearTimeout(timer);
        timerProgress.style.width = '100%';
    } else {
        startTimer();
    }
}

async function load_question() {
    config.no_submit = false;
    console.log("Next question...");
    let target = document.querySelector("#problem");
    update_score(config.score);
    answer_set();
    let guess = `
        <p class="question"><span>${answers.num_1}</span> × <span>${answers.num_2}</span> =</p>
        <div id="result">${states.initial_state}</div>
        <input autofocus type="number" id="answer" class="answer-input">
        <button id="submit" class="submit-btn" onclick="solve()">Submit</button>
    `;
    target.innerHTML = guess;
    timerProgress = document.querySelector("#timer-progress");
    startTimer();
    document.querySelector("#answer").focus();
    updateModeDisplay();
}

function disable_button() {
    document.querySelector("#submit").disabled = true;
    config.no_submit = true;
}

async function solve() {
    answers.guess = Number(document.querySelector("#answer").value);
    console.log(answers);
    clearTimeout(timer);
    if (answers.guess == answers.correct) {
        increase_score();
        update_score(config.score);
        correct_sound.play();
        disable_button();
        console.log("Correct!");
        states.initial_state = states.right_answer;
        document.querySelector("#result").textContent = `${states.right_answer}`;
        let firstTry = wrongCount[answers.num_1 - 1][answers.num_2 - 1] === 0;
        updateGraph(answers.num_1, answers.num_2, true, firstTry);
    } else {
        decrease_score();
        update_score(config.score);
        const soundEffect = new Audio('sound.mp3');
        wrong_sound.volume = 0.25; // Sets volume to 25%
        wrong_sound.play();
        disable_button();
        console.log("Sorry! Wrong answer");
        states.initial_state = states.wrong_answer;
        document.querySelector("#result").textContent = `${states.wrong_answer}`;
        updateGraph(answers.num_1, answers.num_2, false, false);
    }
}

document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        if (config.no_submit == false) {
            solve().then(load_question);
        }
    }
});

document.onkeyup = function (e) {
    if (e.key == " " || e.code == "Space") {
        load_question();
    }
}

function createGraph() {
    let graph = document.getElementById('knowledge-graph');
    for (let i = 1; i <= 10; i++) {
        for (let j = i; j <= 10; j++) {  // Ensure i <= j
            let cell = document.createElement('div');
            cell.id = `cell-${i}-${j}`;
            cell.classList.add('knowledge-cell');
            cell.title = `${i} × ${j}`;
            graph.appendChild(cell);
        }
    }
}

function showDifficultProblems() {
    let difficulties = [];
    for (let i = 1; i <= 10; i++) {
        for (let j = i; j <= 10; j++) {  // Ensure i <= j
            difficulties.push({
                problem: `${i} × ${j}`,
                wrongs: wrongCount[i - 1][j - 1]
            });
        }
    }
    difficulties.sort((a, b) => b.wrongs - a.wrongs);
    let topDifficulties = difficulties.slice(0, 10);
    alert("Top 10 most difficult problems: \n" + topDifficulties.map(d => `${d.problem}: ${d.wrongs} wrong answers`).join("\n"));
}

window.addEventListener('beforeunload', showDifficultProblems);

function checkAllProblemsAttempted() {
    if (attemptedProblems.size === 55 && !allProblemsAttempted) {
        allProblemsAttempted = true;
        document.getElementById('hyper-focus-btn').disabled = false;
        alert("Congratulations! You've attempted all problems. Hyper Focus mode is now available!");
    }
}

function startHyperFocus() {
    hyperFocusMode = true;
    document.getElementById('hyper-focus-btn').textContent = 'Exit Hyper Focus';
    document.getElementById('hyper-focus-btn').onclick = exitHyperFocus;
    load_question();
}

function exitHyperFocus() {
    hyperFocusMode = false;
    document.getElementById('hyper-focus-btn').textContent = 'Hyper Focus';
    document.getElementById('hyper-focus-btn').onclick = startHyperFocus;
    load_question();
}

function getHyperFocusProblem() {
    let difficulties = [];
    for (let i = 1; i <= 10; i++) {
        for (let j = i; j <= 10; j++) {  // Ensure i <= j
            difficulties.push({
                num1: i,
                num2: j,
                difficulty: wrongCount[i - 1][j - 1] - correctCount[i - 1][j - 1]
            });
        }
    }
    difficulties.sort((a, b) => b.difficulty - a.difficulty);
    let topDifficulties = difficulties.slice(0, 10);
    let selectedProblem = topDifficulties[Math.floor(Math.random() * topDifficulties.length)];
    return [selectedProblem.num1, selectedProblem.num2];
}

function updateModeDisplay() {
    let modeDisplay = document.createElement('div');
    modeDisplay.id = 'mode-display';
    modeDisplay.textContent = hyperFocusMode ? 'Hyper Focus Mode' : 'Normal Mode';
    modeDisplay.style.textAlign = 'center';
    modeDisplay.style.marginTop = '10px';
    modeDisplay.style.fontWeight = 'bold';
    modeDisplay.style.color = hyperFocusMode ? 'var(--accent-color)' : 'var(--primary-color)';
    
    let existingModeDisplay = document.getElementById('mode-display');
    if (existingModeDisplay) {
        existingModeDisplay.replaceWith(modeDisplay);
    } else {
        document.querySelector("#problem").appendChild(modeDisplay);
    }
}
