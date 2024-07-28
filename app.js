const answers = { num_1: 0, num_2: 0, guess: 0, correct: 0 };
const config = { max: 10, score: 0, no_submit: false };
const states = { right_answer: '😄', wrong_answer: '⛔', initial_state: '❔' };
const history = {};
const last_answer = { previous: [] };
const stats = Array.from({ length: 10 }, () => Array(10).fill(0));
const wrongCount = Array.from({ length: 10 }, () => Array(10).fill(0));
const correctCount = Array.from({ length: 10 }, () => Array(10).fill(0));

window.addEventListener('load', (event) => {
    console.log('Math Game Start');
    start_sound.play();
    load_question();
    createGraph();
});

//sounds
let correct_sound = new Audio('sounds/correct_answer/success.mp3');
let wrong_sound = new Audio('sounds/wrong_answer/Wrong-answer-sound-effect.mp3');
let start_sound = new Audio('sounds/game_start/game-start-6104.mp3');

function random_int() {
    return Math.ceil(Math.random() * config.max);
}

function weighted_random_int() {
    let choices = [];
    for (let i = 1; i <= 10; i++) {
        for (let j = 1; j <= 10; j++) {
            let weight = 1 + wrongCount[i - 1][j - 1] - correctCount[i - 1][j - 1];
            weight = Math.max(weight, 1);
            for (let k = 0; k < weight; k++) {
                choices.push([i, j]);
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
    reset_game().then(
        console.log("Answer field in focus"),
        document.querySelector("#answer").focus()
    );
}

function update_score(points) {
    let score_div = document.querySelector("#score");
    score_div.textContent = `${points}`;
}

function decrease_score(v = 1) {
    config.score -= v;
}

function increase_score(v = 1) {
    config.score += v;
}

function updateGraph(num1, num2, correct) {
    let color;
    let count = correctCount[num1 - 1][num2 - 1];

    if (correct) {
        correctCount[num1 - 1][num2 - 1]++;
    } else {
        wrongCount[num1 - 1][num2 - 1]++;
    }

    if (count === 0) {
        color = correct ? 'yellow' : 'white';
    } else if (count === 2) {
        color = 'green';
    }

    if (color) {
        document.getElementById(`cell-${num1}-${num2}`).style.backgroundColor = color;
    }
}

async function load_question() {
    config.no_submit = false;
    console.log("Next question...");
    let target = document.querySelector("#problem");
    update_score(config.score);
    answer_set();
    let guess = `<p><span>${answers.num_1}</span>*<span>${answers.num_2}</span>=</p>
            <div id="result">${states.initial_state}</div>
             <input autofocus="autofocus" type="number" value="" id="answer">
             <button id="submit" onclick="solve()">Submit</button>`;
    target.innerHTML = guess;
}

function disable_button() {
    document.querySelector("#submit").disabled = true;
    config.no_submit = true;
}

async function solve() {
    answers.guess = Number(document.querySelector("#answer").value);
    console.log(answers);
    if (answers.guess == answers.correct) {
        increase_score();
        update_score(config.score);
        correct_sound.play();
        disable_button();
        console.log("Correct!");
        states.initial_state = states.right_answer;
        document.querySelector("#result").textContent = `${states.right_answer}`;
        updateGraph(answers.num_1, answers.num_2, true);
    } else {
        decrease_score();
        update_score(config.score);
        wrong_sound.play();
        disable_button();
        console.log("Sorry! Wrong answer");
        states.initial_state = states.wrong_answer;
        document.querySelector("#result").textContent = `${states.wrong_answer}`;
        updateGraph(answers.num_1, answers.num_2, false);
    }
}

document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        // code for enter
        if (config.no_submit == false) {
            solve().then(load_question());
        }
    }
});

document.onkeyup = function (e) {
    if (e.key == " " || e.code == "Space") {
        load_question();
    }
}

setInterval(function () {
    console.log("xx");
    //focus on input field
    document.getElementById("answer").focus();
}, 500);

function createGraph() {
    let graph = document.getElementById('knowledge-graph');
    for (let i = 1; i <= 10; i++) {
        for (let j = 1; j <= 10; j++) {
            let cell = document.createElement('div');
            cell.id = `cell-${i}-${j}`;
            cell.classList.add('knowledge-cell'); // Add a class for styling
            graph.appendChild(cell);
        }
    }
}

function showDifficultProblems() {
    let difficulties = [];
    for (let i = 1; i <= 10; i++) {
        for (let j = 1; j <= 10; j++) {
            difficulties.push({
                problem: `${i} * ${j}`,
                wrongs: wrongCount[i - 1][j - 1]
            });
        }
    }
    difficulties.sort((a, b) => b.wrongs - a.wrongs);
    let topDifficulties = difficulties.slice(0, 10);
    alert("Top 10 most difficult problems: \n" + topDifficulties.map(d => `${d.problem}: ${d.wrongs} wrong answers`).join("\n"));
}

window.addEventListener('beforeunload', showDifficultProblems);
