const typeForgeData = window.TypeForgeData || {};
const classicParagraphs = typeForgeData.paragraphs || [];
const developerSnippets = typeForgeData.codeSnippets || [];

const state = {
  mode: 'classic',
  duration: 60,
  timeLeft: 60,
  timerId: null,
  started: false,
  finished: false,
  prompt: '',
  inputValue: '',
  typedCharacters: 0,
  mistakes: 0,
  correctCharacters: 0,
  currentWordIndex: 0,
};

const elements = {
  landingSection: document.getElementById('landingSection'),
  typingSection: document.getElementById('typingSection'),
  startButton: document.getElementById('startButton'),
  previewButton: document.getElementById('previewButton'),
  homeButton: document.getElementById('homeButton'),
  retryButton: document.getElementById('retryButton'),
  returnHomeButton: document.getElementById('returnHomeButton'),
  modeButtons: Array.from(document.querySelectorAll('.mode-button')),
  timerDisplay: document.getElementById('timerDisplay'),
  wpmValue: document.getElementById('wpmValue'),
  accuracyValue: document.getElementById('accuracyValue'),
  charactersValue: document.getElementById('charactersValue'),
  mistakesValue: document.getElementById('mistakesValue'),
  forgeValue: document.getElementById('forgeValue'),
  promptPanel: document.getElementById('promptPanel'),
  typingInput: document.getElementById('typingInput'),
  progressFill: document.getElementById('progressFill'),
  resultsCard: document.getElementById('resultsCard'),
  modeHeadline: document.getElementById('modeHeadline'),
  resultsScore: document.getElementById('resultsScore'),
  resultWpm: document.getElementById('resultWpm'),
  resultAccuracy: document.getElementById('resultAccuracy'),
  resultMistakes: document.getElementById('resultMistakes'),
};

function init() {
  bindEvents();
  renderPrompt();
  updateMetrics();
  updateTimerDisplay();
  updateProgress();
}

function bindEvents() {
  elements.startButton.addEventListener('click', startExperience);
  elements.previewButton.addEventListener('click', () => {
    showTypingScreen();
    startExperience();
  });
  elements.homeButton.addEventListener('click', showLanding);
  elements.retryButton.addEventListener('click', () => {
    startExperience(true);
  });
  elements.returnHomeButton.addEventListener('click', showLanding);

  elements.modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.mode;
      if (mode === state.mode) return;
      state.mode = mode;
      updateModeButtons();
      elements.modeHeadline.textContent = mode === 'developer' ? 'Developer Mode' : 'Classic Mode';
      startExperience(true);
    });
  });

  elements.typingInput.addEventListener('input', handleTyping);
  elements.typingInput.addEventListener('focus', () => {
    elements.promptPanel.classList.add('focused');
  });
  elements.promptPanel.addEventListener('click', () => elements.typingInput.focus());
}

function startExperience(resetPrompt = false) {
  clearInterval(state.timerId);
  state.finished = false;
  state.started = false;
  state.timeLeft = state.duration;
  state.inputValue = '';
  state.typedCharacters = 0;
  state.mistakes = 0;
  state.correctCharacters = 0;
  state.currentWordIndex = 0;
  elements.typingInput.value = '';
  elements.resultsCard.classList.remove('active');
  showTypingScreen();

  if (resetPrompt || !state.prompt) {
    state.prompt = getRandomPrompt();
  }

  renderPrompt();
  updateMetrics();
  updateTimerDisplay();
  updateProgress();
  elements.typingInput.focus();
}

function showTypingScreen() {
  elements.landingSection.style.display = 'none';
  elements.typingSection.classList.add('active');
}

function showLanding() {
  clearInterval(state.timerId);
  state.started = false;
  state.finished = false;
  elements.typingSection.classList.remove('active');
  elements.resultsCard.classList.remove('active');
  elements.landingSection.style.display = 'grid';
  elements.typingInput.value = '';
}

function getRandomPrompt() {
  const pool = state.mode === 'developer' ? developerSnippets : classicParagraphs;
  const selected = pool[Math.floor(Math.random() * pool.length)];
  return selected;
}

function updateModeButtons() {
  elements.modeButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === state.mode);
  });
}

function handleTyping(event) {
  if (!state.started) {
    state.started = true;
    startTimer();
  }

  state.inputValue = elements.typingInput.value;
  const safeLength = Math.min(state.inputValue.length, state.prompt.length);
  state.typedCharacters = safeLength;
  state.correctCharacters = 0;
  state.mistakes = 0;

  for (let index = 0; index < safeLength; index += 1) {
    if (state.inputValue[index] === state.prompt[index]) {
      state.correctCharacters += 1;
    } else {
      state.mistakes += 1;
    }
  }

  state.currentWordIndex = getCurrentWordIndex(safeLength);
  renderPrompt();
  updateMetrics();

  if (safeLength >= state.prompt.length) {
    finishTest();
  }
}

function startTimer() {
  state.timerId = window.setInterval(() => {
    state.timeLeft -= 1;
    updateTimerDisplay();
    updateProgress();

    if (state.timeLeft <= 0) {
      finishTest();
    }
  }, 1000);
}

function finishTest() {
  clearInterval(state.timerId);
  state.finished = true;
  state.started = false;
  updateMetrics();
  renderResults();
}

function renderPrompt() {
  if (!state.prompt) {
    elements.promptPanel.innerHTML = '<p>Loading prompt…</p>';
    return;
  }

  const words = state.prompt.split(' ');
  const fragment = document.createDocumentFragment();

  words.forEach((word, index) => {
    const wordNode = document.createElement('span');
    wordNode.className = `prompt-word ${index === state.currentWordIndex ? 'active' : ''}`;

    for (let charIndex = 0; charIndex < word.length; charIndex += 1) {
      const charNode = document.createElement('span');
      const expectedChar = word[charIndex];
      const typedChar = state.inputValue.split(' ')[index]?.[charIndex] || '';
      const position = state.inputValue.length;
      const isCurrent = position === state.prompt.indexOf(word) + charIndex;

      charNode.className = 'prompt-char';
      charNode.textContent = expectedChar;

      if (charIndex < (state.inputValue.split(' ')[index] || '').length) {
        if (typedChar === expectedChar) {
          charNode.classList.add('correct');
        } else {
          charNode.classList.add('incorrect');
        }
      }

      if (isCurrent) {
        charNode.classList.add('current');
      }

      wordNode.appendChild(charNode);
    }

    fragment.appendChild(wordNode);
    if (index < words.length - 1) {
      fragment.appendChild(document.createTextNode(' '));
    }
  });

  elements.promptPanel.innerHTML = '';
  elements.promptPanel.appendChild(fragment);
}

function getCurrentWordIndex(typedLength) {
  let count = 0;
  let index = 0;
  while (index < typedLength && index < state.prompt.length) {
    if (state.prompt[index] === ' ') {
      count += 1;
    }
    index += 1;
  }
  return count;
}

function updateMetrics() {
  const elapsedSeconds = Math.max(1, state.duration - state.timeLeft);
  const elapsedMinutes = elapsedSeconds / 60;
  const wpm = elapsedMinutes > 0 ? (state.typedCharacters / 5) / elapsedMinutes : 0;
  const accuracy = state.typedCharacters > 0 ? ((state.typedCharacters - state.mistakes) / state.typedCharacters) * 100 : 100;
  const forgeScore = wpm * (accuracy / 100);

  animateValue(elements.wpmValue, wpm, (value) => Math.round(value).toString(), 500);
  animateValue(elements.accuracyValue, accuracy, (value) => `${Math.max(0, Math.round(value))}%`, 500);
  animateValue(elements.charactersValue, state.typedCharacters, (value) => Math.round(value).toString(), 500);
  animateValue(elements.mistakesValue, state.mistakes, (value) => Math.round(value).toString(), 500);
  animateValue(elements.forgeValue, forgeScore, (value) => value.toFixed(1), 500);
}

function updateTimerDisplay() {
  const minutes = String(Math.floor(state.timeLeft / 60)).padStart(2, '0');
  const seconds = String(state.timeLeft % 60).padStart(2, '0');
  elements.timerDisplay.textContent = `${minutes}:${seconds}`;
}

function updateProgress() {
  const percent = (state.timeLeft / state.duration) * 100;
  elements.progressFill.style.width = `${percent}%`;
}

function renderResults() {
  const elapsedSeconds = Math.max(1, state.duration - state.timeLeft);
  const elapsedMinutes = elapsedSeconds / 60;
  const wpm = elapsedMinutes > 0 ? (state.typedCharacters / 5) / elapsedMinutes : 0;
  const accuracy = state.typedCharacters > 0 ? ((state.typedCharacters - state.mistakes) / state.typedCharacters) * 100 : 100;
  const forgeScore = wpm * (accuracy / 100);

  animateValue(elements.resultsScore, forgeScore, (value) => value.toFixed(1), 700);
  animateValue(elements.resultWpm, wpm, (value) => Math.round(value).toString(), 700);
  animateValue(elements.resultAccuracy, accuracy, (value) => `${Math.max(0, Math.round(value))}%`, 700);
  animateValue(elements.resultMistakes, state.mistakes, (value) => Math.round(value).toString(), 700);
  elements.resultsCard.classList.add('active');
}

function animateValue(element, target, formatter, duration = 500) {
  const startValue = parseFloat(element.dataset.value || element.textContent.replace(/[^0-9.]/g, '')) || 0;
  const startTime = performance.now();

  const tick = (now) => {
    const progress = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = startValue + (target - startValue) * eased;
    element.textContent = formatter(currentValue);
    element.dataset.value = currentValue.toString();

    if (progress < 1) {
      window.requestAnimationFrame(tick);
    }
  };

  window.requestAnimationFrame(tick);
}

window.addEventListener('load', () => {
  updateModeButtons();
  elements.modeHeadline.textContent = state.mode === 'developer' ? 'Developer Mode' : 'Classic Mode';
  init();
});
