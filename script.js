const typeForgeData = window.TypeForgeData || {};
const classicParagraphs = (typeForgeData.paragraphs || []).map((item) => (typeof item === 'string' ? item : item.text || item.snippet || ''));
const developerSnippets = (typeForgeData.codeSnippets || []).map((item) => {
  if (typeof item === 'string') {
    return { category: 'JavaScript', snippet: item };
  }
  return {
    category: item.category || 'JavaScript',
    snippet: item.snippet || item.text || '',
  };
});

const ranks = [
  { min: 0, max: 40, icon: '✦', name: 'Spark', description: 'A bright first spark of precision.' },
  { min: 40, max: 70, icon: '⚙', name: 'Apprentice', description: 'Steady rhythm and growing control.' },
  { min: 70, max: 90, icon: '⚒', name: 'Craftsman', description: 'Consistent speed with refined accuracy.' },
  { min: 90, max: Infinity, icon: '🏆', name: 'Master Forge', description: 'Elite speed and precision.' },
];

const state = {
  mode: 'classic',
  category: 'JavaScript',
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
  soundEnabled: true,
  session: {
    testsCompleted: 0,
    totalWpm: 0,
    bestWpm: 0,
    totalAccuracy: 0,
  },
};

const elements = {
  landingSection: document.getElementById('landingSection'),
  typingSection: document.getElementById('typingSection'),
  startButton: document.getElementById('startButton'),
  previewButton: document.getElementById('previewButton'),
  aboutButton: document.getElementById('aboutButton'),
  closeModal: document.getElementById('closeModal'),
  aboutModal: document.getElementById('aboutModal'),
  homeButton: document.getElementById('homeButton'),
  soundToggle: document.getElementById('soundToggle'),
  dailyChallengeButton: document.getElementById('dailyChallengeButton'),
  dailyChallengeText: document.getElementById('dailyChallengeText'),
  sessionStats: document.getElementById('sessionStats'),
  retryButton: document.getElementById('retryButton'),
  copyResultButton: document.getElementById('copyResultButton'),
  returnHomeButton: document.getElementById('returnHomeButton'),
  categoryBar: document.getElementById('categoryBar'),
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
  transitionCard: document.getElementById('transitionCard'),
  transitionMessage: document.getElementById('transitionMessage'),
  modeHeadline: document.getElementById('modeHeadline'),
  resultsScore: document.getElementById('resultsScore'),
  resultWpm: document.getElementById('resultWpm'),
  resultAccuracy: document.getElementById('resultAccuracy'),
  resultMistakes: document.getElementById('resultMistakes'),
  rankIcon: document.getElementById('rankIcon'),
  rankName: document.getElementById('rankName'),
  rankDescription: document.getElementById('rankDescription'),
  keyboardVisualizer: document.getElementById('keyboardVisualizer'),
  toast: document.getElementById('toast'),
};

let audioContext = null;

function init() {
  bindEvents();
  renderCategoryButtons();
  renderDailyChallenge();
  updateSessionStats();
  renderPrompt();
  updateMetrics();
  updateTimerDisplay();
  updateProgress();
  buildKeyboard();
}

function bindEvents() {
  elements.startButton.addEventListener('click', () => {
    playButtonSound();
    startExperience(true);
  });
  elements.previewButton.addEventListener('click', () => {
    playButtonSound();
    showTypingScreen();
    startExperience(true);
  });
  elements.homeButton.addEventListener('click', () => {
    playButtonSound();
    showLanding();
  });
  elements.aboutButton.addEventListener('click', () => {
    playButtonSound();
    openAboutModal();
  });
  elements.closeModal.addEventListener('click', closeAboutModal);
  elements.aboutModal.addEventListener('click', (event) => {
    if (event.target === elements.aboutModal) {
      closeAboutModal();
    }
  });
  elements.soundToggle.addEventListener('click', toggleSound);
  elements.dailyChallengeButton.addEventListener('click', () => {
    playButtonSound();
    startExperience(true, true);
  });
  elements.retryButton.addEventListener('click', () => {
    playButtonSound();
    startExperience(true);
  });
  elements.copyResultButton.addEventListener('click', copyResult);
  elements.returnHomeButton.addEventListener('click', () => {
    playButtonSound();
    showLanding();
  });

  elements.modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.mode;
      if (mode === state.mode) return;
      state.mode = mode;
      updateModeButtons();
      elements.modeHeadline.textContent = mode === 'developer' ? 'Developer Mode' : 'Classic Mode';
      renderCategoryButtons();
      startExperience(true);
    });
  });

  elements.typingInput.addEventListener('input', handleTyping);
  elements.typingInput.addEventListener('keydown', handleKeyInteraction);
  elements.typingInput.addEventListener('keyup', handleKeyRelease);
  elements.promptPanel.addEventListener('click', () => elements.typingInput.focus());
  window.addEventListener('keydown', handleGlobalKeyInteraction);
}

function startExperience(resetPrompt = false, dailyChallengeOverride = false) {
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
  elements.transitionCard.classList.remove('active');
  showTypingScreen();

  if (resetPrompt || !state.prompt || dailyChallengeOverride) {
    state.prompt = dailyChallengeOverride ? getDailyChallengePrompt() : getRandomPrompt();
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
  elements.transitionCard.classList.remove('active');
  elements.landingSection.style.display = 'grid';
  elements.typingInput.value = '';
  renderDailyChallenge();
}

function getRandomPrompt() {
  const pool = getPromptPool();
  const selected = pool[Math.floor(Math.random() * pool.length)];
  return selected;
}

function getPromptPool() {
  if (state.mode === 'developer') {
    const pool = developerSnippets.filter((item) => item.category === state.category);
    return pool.length ? pool.map((item) => item.snippet) : developerSnippets.map((item) => item.snippet);
  }
  return classicParagraphs;
}

function getDailyChallengePrompt() {
  const pool = getPromptPool();
  const seedValue = new Date().toISOString().slice(0, 10).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const index = seedValue % pool.length;
  return pool[index];
}

function renderDailyChallenge() {
  const prompt = getDailyChallengePrompt();
  const summary = prompt.length > 92 ? `${prompt.slice(0, 92)}…` : prompt;
  elements.dailyChallengeText.textContent = `Today’s challenge: ${summary}`;
}

function updateModeButtons() {
  elements.modeButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === state.mode);
  });
  elements.categoryBar.style.display = state.mode === 'developer' ? 'flex' : 'none';
}

function renderCategoryButtons() {
  const categories = ['JavaScript', 'SQL', 'Python', 'Linux', 'Git', 'Docker'];
  elements.categoryBar.innerHTML = '';

  categories.forEach((category) => {
    const button = document.createElement('button');
    button.className = `category-button ${state.category === category ? 'active' : ''}`;
    button.textContent = category;
    button.addEventListener('click', () => {
      state.category = category;
      renderCategoryButtons();
      startExperience(true);
    });
    elements.categoryBar.appendChild(button);
  });

  updateModeButtons();
}

function handleTyping() {
  if (!state.started) {
    state.started = true;
    startTimer();
  }

  if (state.finished) {
    return;
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
  beginResultSequence();
}

function beginResultSequence() {
  elements.transitionCard.classList.add('active');
  elements.resultsCard.classList.remove('active');
  const steps = ['Analyzing performance...', 'Measuring accuracy...', 'Calculating Forge Score...'];
  let stepIndex = 0;

  const advance = () => {
    if (stepIndex >= steps.length) {
      renderResults();
      elements.transitionCard.classList.remove('active');
      playCompleteSound();
      return;
    }

    elements.transitionMessage.textContent = steps[stepIndex];
    stepIndex += 1;
    window.setTimeout(advance, 900);
  };

  advance();
}

function renderPrompt() {
  if (!state.prompt) {
    elements.promptPanel.innerHTML = '<p>Loading prompt…</p>';
    return;
  }

  const words = state.prompt.split(' ');
  const fragment = document.createDocumentFragment();
  const typedWords = state.inputValue.split(' ');

  words.forEach((word, index) => {
    const wordNode = document.createElement('span');
    const isActive = index === state.currentWordIndex;
    wordNode.className = `prompt-word ${isActive ? 'active' : ''}`;
    const typedWord = typedWords[index] || '';

    for (let charIndex = 0; charIndex < word.length; charIndex += 1) {
      const charNode = document.createElement('span');
      const expectedChar = word[charIndex];
      const typedChar = typedWord[charIndex] || '';
      const isTyped = charIndex < typedWord.length;

      charNode.className = 'prompt-char';
      charNode.textContent = expectedChar;

      if (isTyped) {
        if (typedChar === expectedChar) {
          charNode.classList.add('correct');
        } else {
          charNode.classList.add('incorrect');
        }
      }

      if (isActive && charIndex === typedWord.length && !state.finished) {
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
  const { wpm, accuracy, forgeScore } = getPerformanceStats();

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

function getPerformanceStats() {
  const elapsedSeconds = Math.max(1, state.duration - state.timeLeft);
  const elapsedMinutes = elapsedSeconds / 60;
  const wpm = elapsedMinutes > 0 ? (state.typedCharacters / 5) / elapsedMinutes : 0;
  const accuracy = state.typedCharacters > 0 ? ((state.typedCharacters - state.mistakes) / state.typedCharacters) * 100 : 100;
  const forgeScore = wpm * (accuracy / 100);
  return { wpm, accuracy, forgeScore };
}

function renderResults() {
  const { wpm, accuracy, forgeScore } = getPerformanceStats();
  const rank = getRank(forgeScore);

  animateValue(elements.resultsScore, forgeScore, (value) => value.toFixed(1), 700);
  animateValue(elements.resultWpm, wpm, (value) => Math.round(value).toString(), 700);
  animateValue(elements.resultAccuracy, accuracy, (value) => `${Math.max(0, Math.round(value))}%`, 700);
  animateValue(elements.resultMistakes, state.mistakes, (value) => Math.round(value).toString(), 700);

  elements.rankIcon.textContent = rank.icon;
  elements.rankName.textContent = rank.name;
  elements.rankDescription.textContent = rank.description;
  elements.resultsCard.classList.add('active');

  state.session.testsCompleted += 1;
  state.session.totalWpm += wpm;
  state.session.bestWpm = Math.max(state.session.bestWpm, wpm);
  state.session.totalAccuracy += accuracy;
  updateSessionStats();
}

function getRank(forgeScore) {
  return ranks.find((rank) => forgeScore >= rank.min && forgeScore < rank.max) || ranks[ranks.length - 1];
}

function updateSessionStats() {
  const averageWpm = state.session.testsCompleted > 0 ? state.session.totalWpm / state.session.testsCompleted : 0;
  const averageAccuracy = state.session.testsCompleted > 0 ? state.session.totalAccuracy / state.session.testsCompleted : 100;
  const bestWpm = state.session.testsCompleted > 0 ? state.session.bestWpm : 0;

  elements.sessionStats.innerHTML = `
    <div><strong>${state.session.testsCompleted}</strong> tests completed</div>
    <div><strong>${Math.round(averageWpm)}</strong> avg WPM</div>
    <div><strong>${Math.round(bestWpm)}</strong> best WPM</div>
    <div><strong>${Math.max(0, Math.round(averageAccuracy))}%</strong> avg accuracy</div>
  `;
}

function animateValue(element, target, formatter, duration = 500) {
  const currentText = element.textContent || '0';
  const startValue = parseFloat(currentText.replace(/[^0-9.]/g, '')) || 0;
  const startTime = performance.now();

  const tick = (now) => {
    const progress = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = startValue + (target - startValue) * eased;
    element.textContent = formatter(currentValue);

    if (progress < 1) {
      window.requestAnimationFrame(tick);
    }
  };

  window.requestAnimationFrame(tick);
}

function openAboutModal() {
  elements.aboutModal.classList.add('active');
  elements.aboutModal.setAttribute('aria-hidden', 'false');
}

function closeAboutModal() {
  elements.aboutModal.classList.remove('active');
  elements.aboutModal.setAttribute('aria-hidden', 'true');
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  elements.soundToggle.textContent = `Sound: ${state.soundEnabled ? 'ON' : 'OFF'}`;
  if (state.soundEnabled) {
    playButtonSound();
  }
}

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

function playButtonSound() {
  if (!state.soundEnabled) return;
  ensureAudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(620, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(510, audioContext.currentTime + 0.07);
  gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.02, audioContext.currentTime + 0.03);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.12);
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.12);
}

function playCompleteSound() {
  if (!state.soundEnabled) return;
  ensureAudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(660, audioContext.currentTime + 0.16);
  gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.035, audioContext.currentTime + 0.04);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.24);
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.24);
}

function handleGlobalKeyInteraction(event) {
  const key = normalizeKey(event.key);
  if (!key) return;
  const target = elements.keyboardVisualizer.querySelector(`[data-key="${key}"]`);
  if (target) {
    target.classList.add('active');
    window.setTimeout(() => target.classList.remove('active'), 180);
  }
}

function handleKeyInteraction(event) {
  if (!state.started) {
    state.started = true;
    startTimer();
  }

  const key = normalizeKey(event.key);
  if (key && state.soundEnabled && !['Tab', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    playButtonSound();
  }
}

function handleKeyRelease(event) {
  const key = normalizeKey(event.key);
  if (!key) return;
  const target = elements.keyboardVisualizer.querySelector(`[data-key="${key}"]`);
  if (target) {
    target.classList.remove('active');
  }
}

function normalizeKey(key) {
  if (!key) return '';
  if (key === ' ') return 'Space';
  if (key === 'Enter') return 'Enter';
  if (key === 'Backspace') return 'Backspace';
  if (key === 'Tab') return 'Tab';
  if (key === 'Shift') return 'Shift';
  if (key.length === 1) return key.toUpperCase();
  return key;
}

function buildKeyboard() {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
    ['Space', 'Enter', 'Backspace'],
  ];

  elements.keyboardVisualizer.innerHTML = '';
  rows.forEach((row) => {
    const rowElement = document.createElement('div');
    rowElement.className = 'keyboard-row';
    row.forEach((key) => {
      const keyElement = document.createElement('button');
      keyElement.className = 'key';
      keyElement.dataset.key = key;
      keyElement.textContent = key === 'Space' ? '␣' : key;
      rowElement.appendChild(keyElement);
    });
    elements.keyboardVisualizer.appendChild(rowElement);
  });
}

async function copyResult() {
  const { wpm, accuracy, forgeScore } = getPerformanceStats();
  const rank = getRank(forgeScore);
  const summary = `⚒ TypeForge Result\n\nForge Score: ${forgeScore.toFixed(1)}\nSpeed: ${Math.round(wpm)} WPM\nAccuracy: ${Math.round(accuracy)}%\nRank: ${rank.name}`;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(summary);
      showToast('Result copied to clipboard.');
    } else {
      showToast('Clipboard unavailable in this browser.');
    }
  } catch (error) {
    showToast('Copy failed.');
  }
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('active');
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    elements.toast.classList.remove('active');
  }, 1600);
}

window.addEventListener('load', () => {
  updateModeButtons();
  elements.modeHeadline.textContent = state.mode === 'developer' ? 'Developer Mode' : 'Classic Mode';
  init();
});
