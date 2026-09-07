const reaction = document.querySelector('.reaction');
let timers = [];

function resetReaction() {
  timers.forEach(clearTimeout);
  timers = [];
  reaction.innerHTML = '';
  reaction.classList.remove('is-visible');
}

function showReaction(markup) {
  resetReaction();
  reaction.innerHTML = markup;
  requestAnimationFrame(() => reaction.classList.add('is-visible'));
}

function showWarning() {
  showReaction('<p>Я буквально написала «не нажимать».</p><p class="reaction-late">Но я знала, что ты нажмёшь.</p>');
  timers.push(setTimeout(() => {
    reaction.querySelector('.reaction-late')?.classList.add('is-shown');
  }, 700));
}

function showSecret() {
  showReaction('<p>На самом деле я просто хотела сказать, что мне будет не хватать наших разговоров.</p>');
}

function showLastQuestion() {
  showReaction(`
    <p>Ты точно хочешь нажать последнюю кнопку?</p>
    <div class="reaction__choices">
      <button class="reaction__choice" type="button" data-answer="yes">Да</button>
      <button class="reaction__choice reaction__choice--no" type="button" data-answer="no">Нет</button>
    </div>`);
}

function showFinal() {
  showReaction('<p>Спасибо, что был частью моей работы здесь.<br>Не теряйся ❤️</p>');
}

document.querySelectorAll('[data-action]').forEach((button) => {
  button.addEventListener('click', () => {
    if (button.dataset.action === 'warning') showWarning();
    if (button.dataset.action === 'secret') showSecret();
    if (button.dataset.action === 'last') showLastQuestion();
  });
});

reaction.addEventListener('click', (event) => {
  const answer = event.target.closest('[data-answer]')?.dataset.answer;
  if (answer === 'yes') showFinal();
  if (answer === 'no') {
    const noButton = event.target.closest('[data-answer="no"]');
    noButton.classList.add('is-elusive');
    if (reaction.querySelector('.reaction__note')) return;
    const note = document.createElement('p');
    note.className = 'reaction-late is-shown reaction__note';
    note.textContent = 'Хорошая попытка.';
    reaction.append(note);
  }
});

// Мини-игра изолирована от остальной интерактивности страницы.
const gameModal = document.querySelector('.game-modal');
const gameIntro = document.querySelector('.game-intro');
const gamePlay = document.querySelector('.game-play');
const gameWorld = document.querySelector('[data-game-world]');
const runner = document.querySelector('[data-runner]');
const obstaclesLayer = document.querySelector('[data-obstacles]');
const office = document.querySelector('[data-office]');
const gameResult = document.querySelector('[data-game-result]');
const gameObstacles = [
  { type: 'call', icon: '☎', label: 'созвон', message: 'Паша застрял в созвоне 😬' },
  { type: 'task', icon: '📁', label: 'задача', message: 'Паша утонул в задачах 😬' },
  { type: 'deadline', icon: '⏱', label: 'дедлайн', message: 'Дедлайн настиг Пашу 😬' },
  { type: 'task', icon: '📁', label: 'задача', message: 'Паша утонул в задачах 😬' },
  { type: 'call', icon: '☎', label: 'созвон', message: 'Паша застрял в созвоне 😬' },
  { type: 'deadline', icon: '⏱', label: 'дедлайн', message: 'Дедлайн настиг Пашу 😬' },
  { type: 'call', icon: '☎', label: 'созвон', message: 'Паша застрял в созвоне 😬' },
  { type: 'task', icon: '📁', label: 'задача', message: 'Паша утонул в задачах 😬' },
  { type: 'deadline', icon: '⏱', label: 'дедлайн', message: 'Дедлайн настиг Пашу 😬' },
  { type: 'call', icon: '☎', label: 'созвон', message: 'Паша застрял в созвоне 😬' },
];

const game = { status: 'idle', frame: null, timers: [], y: 0, velocity: 0, distance: 0, lastTime: 0, officeX: 0, items: [] };
const runnerWidth = 46;
const jumpVelocity = -850;
const gravity = 2350;
const speed = 255;

function clearGameTimers() {
  game.timers.forEach(clearTimeout);
  game.timers = [];
}

function stopGameLoop() {
  if (game.frame) cancelAnimationFrame(game.frame);
  game.frame = null;
}

function playerX() {
  return gameWorld.clientWidth * 0.13;
}

function resetGameWorld() {
  stopGameLoop();
  clearGameTimers();
  game.y = 0;
  game.velocity = 0;
  game.distance = 0;
  game.officeX = gameWorld.clientWidth + 180;
  runner.style.transform = 'translateY(0)';
  runner.classList.remove('is-entering');
  office.className = 'office';
  office.style.transform = `translateX(${game.officeX}px)`;
  gameResult.className = 'game-result';
  gameResult.innerHTML = '';
  obstaclesLayer.innerHTML = '';
  game.items = gameObstacles.map((obstacle, index) => {
    const element = document.createElement('div');
    element.className = `game-obstacle game-obstacle--${obstacle.type}`;
    element.dataset.label = obstacle.label;
    element.textContent = obstacle.icon;
    obstaclesLayer.append(element);
    return { ...obstacle, element, start: 720 + index * 520, width: obstacle.type === 'task' ? 58 : 55, cleared: false };
  });
}

function renderGame() {
  runner.style.transform = `translateY(${game.y}px)`;
  game.items.forEach((item) => {
    item.x = item.start - game.distance;
    item.element.style.transform = `translateX(${item.x}px)`;
  });
  if (game.status === 'office') office.style.transform = `translateX(${game.officeX}px)`;
}

function showGameResult(title, text, action, label) {
  gameResult.innerHTML = `<div class="game-result__card"><h3>${title}</h3><p>${text}</p><button class="game-result__button" type="button" data-game-result-action="${action}">${label}</button></div>`;
  gameResult.classList.add('is-visible');
}

function loseGame(item) {
  game.status = 'lost';
  showGameResult('Ой!', item.message, 'restart', 'ПОПРОБОВАТЬ СНОВА');
}

function arriveAtOffice() {
  game.status = 'entering';
  office.classList.add('is-open');
  runner.classList.add('is-entering');
  game.timers.push(setTimeout(() => office.classList.remove('is-open'), 680));
  game.timers.push(setTimeout(() => {
    showGameResult('Ты молодец! 🎉', 'Паша добрался до офиса.', 'return', 'ВЕРНУТЬСЯ НА САЙТ');
  }, 1400));
}

function gameLoop(timestamp) {
  if (!game.lastTime) game.lastTime = timestamp;
  const delta = Math.min((timestamp - game.lastTime) / 1000, 0.032);
  game.lastTime = timestamp;

  if (game.status === 'running' || game.status === 'office') {
    game.velocity += gravity * delta;
    game.y += game.velocity * delta;
    if (game.y > 0) { game.y = 0; game.velocity = 0; }
    game.distance += speed * delta;

    const x = playerX();
    for (const item of game.items) {
      item.x = item.start - game.distance;
      if (item.x + item.width < x - 4) item.cleared = true;
      const overlaps = item.x < x + runnerWidth && item.x + item.width > x + 5;
      const lowEnoughToHit = game.y > -47;
      if (game.status === 'running' && !item.cleared && overlaps && lowEnoughToHit) {
        renderGame();
        loseGame(item);
        return;
      }
    }

    if (game.status === 'running' && game.items.every((item) => item.cleared)) {
      game.status = 'office';
      game.officeX = gameWorld.clientWidth + 150;
      office.classList.add('is-visible');
    }

    if (game.status === 'office') {
      game.officeX -= speed * delta;
      if (game.officeX <= x + 48) {
        renderGame();
        arriveAtOffice();
        return;
      }
    }
    renderGame();
    game.frame = requestAnimationFrame(gameLoop);
  }
}

function beginGame() {
  resetGameWorld();
  gameIntro.hidden = true;
  gamePlay.hidden = false;
  game.status = 'running';
  game.lastTime = 0;
  game.frame = requestAnimationFrame(gameLoop);
}

function openGame() {
  resetGameWorld();
  game.status = 'intro';
  gameModal.hidden = false;
  gameIntro.hidden = false;
  gamePlay.hidden = true;
  document.body.style.overflow = 'hidden';
}

function closeGame() {
  stopGameLoop();
  clearGameTimers();
  game.status = 'idle';
  gameModal.hidden = true;
  document.body.style.overflow = '';
}

function jump() {
  if ((game.status === 'running' || game.status === 'office') && game.y >= -1) {
    game.velocity = jumpVelocity;
  }
}

document.querySelector('[data-game-open]').addEventListener('click', openGame);
document.querySelector('[data-game-close]').addEventListener('click', closeGame);
document.querySelector('[data-game-start]').addEventListener('click', beginGame);
gameWorld.addEventListener('pointerdown', jump);
gameResult.addEventListener('click', (event) => {
  const action = event.target.closest('[data-game-result-action]')?.dataset.gameResultAction;
  if (action === 'restart') beginGame();
  if (action === 'return') closeGame();
});
document.addEventListener('keydown', (event) => {
  if (!gameModal.hidden && (event.code === 'Space' || event.key === ' ')) {
    event.preventDefault();
    jump();
  }
  if (!gameModal.hidden && event.key === 'Escape') closeGame();
});
