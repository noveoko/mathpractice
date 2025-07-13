document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    const state = {
        score: 0,
        streak: 0,
        currentProblem: { num1: 0, num2: 0, answer: 0, displayFormat: 'multiplication' },
        isWaitingForNext: false,
        problemHistory: new Map(), // Key: "n1-n2", Value: { attempts: [], lastPracticed: null, mastery: 'unseen' }
    };

    const MASTERY_LEVELS = {
        UNSEEN: 'unseen',
        LEARNING: 'learning',
        MASTERED: 'mastered',
        CHALLENGING: 'challenging',
    };

    const SOUNDS = {
        correct: new Audio('sounds/correct_answer/success.mp3'),
        wrong: new Audio('sounds/wrong_answer/Wrong-answer-sound-effect.mp3'),
    };

    // --- DOM ELEMENTS ---
    const scoreValueEl = document.getElementById('score-value');
    const streakValueEl = document.getElementById('streak-value');
    const problemContainerEl = document.getElementById('problem');
    const knowledgeGraphEl = document.getElementById('knowledge-graph');
    const newGameBtn = document.getElementById('new-game-btn');


    // --- INITIALIZATION ---
    function init() {
        for (let i = 1; i <= 10; i++) {
            for (let j = i; j <= 10; j++) {
                const key = `${i}-${j}`;
                state.problemHistory.set(key, {
                    attempts: [],
                    lastPracticed: null,
                    mastery: MASTERY_LEVELS.UNSEEN,
                });
            }
        }
        createGraph();
        loadQuestion();
        setupEventListeners();
    }

    function setupEventListeners() {
        newGameBtn.addEventListener('click', resetGame);
        document.addEventListener('keydown', handleKeyPress);
    }


    // --- UI & RENDERING ---
    function createGraph() {
        knowledgeGraphEl.innerHTML = '';
        for (let i = 1; i <= 10; i++) {
            for (let j = i; j <= 10; j++) {
                const key = `${i}-${j}`;
                const cell = document.createElement('div');
                cell.id = `cell-${key}`;
                cell.classList.add('knowledge-cell');
                cell.title = `${i} × ${j}`;
                cell.dataset.key = key;

                const cellText = document.createElement('span');
                cellText.classList.add('knowledge-cell-text');
                cellText.textContent = `${i}×${j}`;
                cell.appendChild(cellText);

                cell.addEventListener('click', () => practiceSpecificProblem(i, j));
                knowledgeGraphEl.appendChild(cell);
            }
        }
        updateGraph();
    }

    function updateGraph() {
        for (const [key, data] of state.problemHistory.entries()) {
            const cell = document.getElementById(`cell-${key}`);
            if (cell) {
                let color;
                switch (data.mastery) {
                    case MASTERY_LEVELS.LEARNING:
                        color = 'var(--primary-accent)';
                        break;
                    case MASTERY_LEVELS.CHALLENGING:
                        color = 'var(--incorrect-color)';
                        break;
                    case MASTERY_LEVELS.MASTERED:
                         const correctStreak = getCorrectStreak(data.attempts);
                         if (correctStreak >= 3) color = '#417505';
                         else if (correctStreak === 2) color = '#7ed321';
                         else color = '#b8e986';
                        break;
                    case MASTERY_LEVELS.UNSEEN:
                    default:
                        color = 'var(--unseen-color)';
                }
                cell.style.backgroundColor = color;
            }
        }
    }


    function renderProblem() {
        const { num1, num2, displayFormat } = state.currentProblem;
        let questionHTML = '';

        if (displayFormat === 'repeated-addition') {
            // Generate addition string: e.g., 2 + 2 + 2
            const additionString = Array(num2).fill(num1).join(' + ');
            questionHTML = `<p class="question" style="font-size: 2rem;">${additionString} =</p>`;
        } else {
            // Standard multiplication: e.g., 2 x 3
            questionHTML = `<p class="question"><span>${num1}</span> × <span>${num2}</span> =</p>`;
        }

        problemContainerEl.innerHTML = `
            ${questionHTML}
            <div id="result">❔</div>
            <input autofocus type="number" id="answer" class="answer-input">
        `;
        document.getElementById('answer').focus();
    }

    function updateScoreDisplay() {
        scoreValueEl.textContent = state.score;
        streakValueEl.textContent = state.streak;
    }


    // --- GAME LOGIC ---

    function getNextProblem() {
        const now = Date.now();
        const problems = Array.from(state.problemHistory.entries());

        const challengingProblems = problems.filter(([, data]) => data.mastery === MASTERY_LEVELS.CHALLENGING);
        if (challengingProblems.length > 0) {
            return challengingProblems[Math.floor(Math.random() * challengingProblems.length)];
        }

        const weightedProblems = problems.map(([key, data]) => {
            let weight = 1;
            if (data.mastery === MASTERY_LEVELS.UNSEEN) {
                weight = 10;
            } else if (data.mastery === MASTERY_LEVELS.LEARNING) {
                weight = 5;
            }

            if (data.lastPracticed) {
                const hoursSinceLast = (now - data.lastPracticed) / (1000 * 60 * 60);
                if (hoursSinceLast > 24) weight *= 1.5;
                if (hoursSinceLast > 72) weight *= 2;
            }
            return { key, weight };
        });

        const totalWeight = weightedProblems.reduce((sum, p) => sum + p.weight, 0);
        let random = Math.random() * totalWeight;

        for (const problem of weightedProblems) {
            random -= problem.weight;
            if (random <= 0) {
                return [problem.key, state.problemHistory.get(problem.key)];
            }
        }

        return problems[Math.floor(Math.random() * problems.length)];
    }

    function loadQuestion() {
        const [key] = getNextProblem();
        let [num1, num2] = key.split('-').map(Number);

        let displayFormat = 'multiplication';
        // Decide on the problem format
        const formatRoll = Math.random();
        if (formatRoll < 0.25 && num2 > 1 && num1 > 1) { // 25% chance for repeated addition
            displayFormat = 'repeated-addition';
            // For A + A + ... (B times), num1 is the number, num2 is the count
            if(Math.random() > 0.5) [num1, num2] = [num2, num1]; // Randomly swap for variation
        } else if (formatRoll < 0.75) { // 50% chance to swap for commutative property
            [num1, num2] = [num2, num1];
        }
        // The remaining 25% will be the standard n1 x n2

        state.currentProblem = { num1, num2, answer: num1 * num2, displayFormat };
        state.isWaitingForNext = false;

        renderProblem();
    }

    function practiceSpecificProblem(num1, num2) {
        state.currentProblem = { num1, num2, answer: num1 * num2, displayFormat: 'multiplication' };
        state.isWaitingForNext = false;
        renderProblem();
    }


    function handleKeyPress(e) {
        if (e.key === 'Enter' && !state.isWaitingForNext) {
            const answerInput = document.getElementById('answer');
            if (document.activeElement === answerInput && answerInput.value !== '') {
                checkAnswer();
            }
        } else if (e.key === ' ' || e.code === 'Space') {
            if (state.isWaitingForNext) {
                e.preventDefault();
                loadQuestion();
            }
        }
    }


    function checkAnswer() {
        state.isWaitingForNext = true;
        const guess = Number(document.getElementById('answer').value);
        const resultEl = document.getElementById('result');

        // Original numbers for history tracking are stored in currentProblem
        const n1 = state.currentProblem.num1;
        const n2 = state.currentProblem.num2;
        const answer = state.currentProblem.answer;

        // The key for history should always be min-max
        const key = `${Math.min(n1, n2)}-${Math.max(n1, n2)}`;
        const problemData = state.problemHistory.get(key);

        if (guess === answer) {
            resultEl.textContent = '😄';
            resultEl.style.transform = 'scale(1.5)';
            SOUNDS.correct.play();
            state.score++;
            state.streak++;
            problemData.attempts.push(true);
        } else {
            resultEl.textContent = '⛔';
            resultEl.style.transform = 'scale(1.5)';
            SOUNDS.wrong.play();
            if (state.score > 0) state.score--;
            state.streak = 0;
            problemData.attempts.push(false);
        }

        problemData.lastPracticed = Date.now();
        updateMastery(problemData);

        updateScoreDisplay();
        updateGraph();

        setTimeout(() => {
            resultEl.textContent = '...';
            resultEl.style.transform = 'scale(1)';
        }, 1000);
    }


    function updateMastery(data) {
        const totalAttempts = data.attempts.length;
        const recentAttempts = data.attempts.slice(-3);
        const correctStreak = getCorrectStreak(data.attempts);

        if (totalAttempts === 0) {
            data.mastery = MASTERY_LEVELS.UNSEEN;
            return;
        }

        const wrongCount = recentAttempts.filter(a => !a).length;

        if (wrongCount >= 2) {
            data.mastery = MASTERY_LEVELS.CHALLENGING;
        } else if (correctStreak >= 3) {
            data.mastery = MASTERY_LEVELS.MASTERED;
        } else {
            data.mastery = MASTERY_LEVELS.LEARNING;
        }
    }


    function getCorrectStreak(attempts) {
        let streak = 0;
        for (let i = attempts.length - 1; i >= 0; i--) {
            if (attempts[i]) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }


    function resetGame() {
        if (confirm('Are you sure you want to start a new game? Your progress will be lost.')) {
            state.score = 0;
            state.streak = 0;
            state.problemHistory.clear();
            init();
            updateScoreDisplay();
        }
    }

    // --- START THE APP ---
    init();
});
