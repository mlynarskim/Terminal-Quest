import {
  GAME_CRASH_BET_MIN,
  GAME_CRASH_MAX_ATTEMPTS,
  GAME_CRASH_WIN_MULTIPLIER,
  GAME_MEMORY_GRID_SIZE,
  GAME_MEMORY_TIME_LIMIT_MS,
  GAME_SNAKE_GRID_SIZE,
  GAME_SNAKE_SPEED_MS,
  GAME_2048_GRID_SIZE,
} from './constants';

const KEY_SETS = ['XK72-AQF4-B1', 'GRID-9F2-CAT', 'P0L0-A1R-IN0', 'ZZZ-0101-MEOW', 'B10-H4CK-R00T'];

const pickKeys = (seed) => KEY_SETS[seed % KEY_SETS.length];

export const startCrash = ({ bet }) => {
  const challenge = pickKeys(Math.floor(Math.random() * KEY_SETS.length * 100));
  return {
    type: 'crash',
    bet: Math.max(GAME_CRASH_BET_MIN, Math.floor(bet || GAME_CRASH_BET_MIN)),
    challenge,
    attemptsLeft: GAME_CRASH_MAX_ATTEMPTS,
  };
};

export const judgeCrashGuess = (game, guess) => {
  const trimmed = String(guess || '')
    .trim()
    .toUpperCase();
  if (trimmed === game.challenge.toUpperCase()) return 'win';
  return game.attemptsLeft - 1 <= 0 ? 'lose' : 'continue';
};

export const crashWinnings = (game) => game.bet * GAME_CRASH_WIN_MULTIPLIER;
export const crashBetMin = () => GAME_CRASH_BET_MIN;

export const startLeak = () => ({ type: 'leak', catches: 0 });
export const registerCatch = (game) => ({ ...game, catches: game.catches + 1 });

// ===== MEMORY GAME =====

export const startMemory = () => {
  const size = GAME_MEMORY_GRID_SIZE;
  const totalPairs = (size * size) / 2;
  const symbols = '☀☁☂☃☄★☆☇☈☉☊☋☌☍☎☏☐☑☒☓☔☕☖☗☘☙☚☛☜☝☞☟☠☡☢☣☤☥☦☧☨☩☪☫☬☭☮☯☰☱☲☳☴☵☶☷☸☹☺☻☼☽☾☿'.split('');
  
  // Create pairs
  const selected = symbols.slice(0, totalPairs);
  const cards = [...selected, ...selected].sort(() => Math.random() - 0.5);
  
  return {
    type: 'memory',
    gridSize: size,
    cards: cards.map((symbol, index) => ({
      id: index,
      symbol,
      revealed: false,
      matched: false,
    })),
    flipped: [],
    matches: 0,
    moves: 0,
    startTime: Date.now(),
    timeLimit: GAME_MEMORY_TIME_LIMIT_MS,
  };
};

export const flipMemoryCard = (game, cardId) => {
  const card = game.cards.find(c => c.id === cardId);
  if (!card || card.revealed || card.matched) return game;
  
  const flipped = game.flipped.filter(c => !c.matched);
  if (flipped.length >= 2) return game;
  
  const newFlipped = [...flipped, cardId];
  const newCards = game.cards.map(c => c.id === cardId ? { ...c, revealed: true } : c);
  
  // Check for match
  if (newFlipped.length === 2) {
    const [first, second] = newFlipped;
    const card1 = newCards.find(c => c.id === first);
    const card2 = newCards.find(c => c.id === second);
    
    const isMatch = card1.symbol === card2.symbol;
    const matchedCards = isMatch ? [first, second] : [];
    
    return {
      ...game,
      cards: newCards.map(c => matchedCards.includes(c.id) ? { ...c, matched: true, revealed: true } : { ...c, revealed: false }),
      flipped: [],
      matches: isMatch ? game.matches + 1 : game.matches,
      moves: game.moves + 1,
    };
  }
  
  return {
    ...game,
    cards: newCards,
    flipped: newFlipped,
    moves: game.moves + 1,
  };
};

export const checkMemoryWin = (game) => game.matches === (game.gridSize * game.gridSize) / 2;

export const getMemoryTimeLeft = (game) => Math.max(0, game.timeLimit - (Date.now() - game.startTime));

// ===== SNAKE GAME =====

export const startSnake = () => {
  const size = GAME_SNAKE_GRID_SIZE;
  const center = Math.floor(size / 2);
  return {
    type: 'snake',
    gridSize: size,
    snake: [{ x: center, y: center }, { x: center - 1, y: center }, { x: center - 2, y: center }],
    direction: 'right',
    nextDirection: 'right',
    food: { x: Math.floor(Math.random() * size), y: Math.floor(Math.random() * size) },
    score: 0,
    gameOver: false,
    speed: GAME_SNAKE_SPEED_MS,
    lastMove: Date.now(),
  };
};

export const changeSnakeDirection = (game, direction) => {
  const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
  if (game.direction !== opposites[direction]) {
    return { ...game, nextDirection: direction };
  }
  return game;
};

export const moveSnake = (game) => {
  if (game.gameOver) return game;
  
  const now = Date.now();
  if (now - game.lastMove < game.speed) return game;
  
  const dir = game.nextDirection;
  const head = { ...game.snake[0] };
  
  if (dir === 'up') head.y = (head.y - 1 + game.gridSize) % game.gridSize;
  if (dir === 'down') head.y = (head.y + 1) % game.gridSize;
  if (dir === 'left') head.x = (head.x - 1 + game.gridSize) % game.gridSize;
  if (dir === 'right') head.x = (head.x + 1) % game.gridSize;
  
  // Check self collision
  if (game.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
    return { ...game, gameOver: true };
  }
  
  const newSnake = [head, ...game.snake];
  let newFood = game.food;
  let newScore = game.score;
  
  // Check food
  if (head.x === game.food.x && head.y === game.food.y) {
    newScore += 10;
    newFood = {
      x: Math.floor(Math.random() * game.gridSize),
      y: Math.floor(Math.random() * game.gridSize),
    };
    // Ensure food doesn't spawn on snake
    while (newSnake.some(s => s.x === newFood.x && s.y === newFood.y)) {
      newFood = {
        x: Math.floor(Math.random() * game.gridSize),
        y: Math.floor(Math.random() * game.gridSize),
      };
    }
  } else {
    newSnake.pop(); // Remove tail
  }
  
  return {
    ...game,
    snake: newSnake,
    food: newFood,
    score: newScore,
    direction: game.nextDirection,
    lastMove: Date.now(),
  };
};

// ===== 2048 GAME =====

export const start2048 = () => {
  const size = GAME_2048_GRID_SIZE;
  let grid = Array(size * size).fill(0);
  
  const addTile = (g) => {
    const empty = g.map((v, i) => v === 0 ? i : -1).filter(i => i >= 0);
    if (empty.length === 0) return g;
    const idx = empty[Math.floor(Math.random() * empty.length)];
    g[idx] = Math.random() < 0.9 ? 2 : 4;
    return g;
  };
  
  grid = addTile(grid);
  grid = addTile(grid);
  
  return {
    type: '2048',
    gridSize: size,
    grid,
    score: 0,
    won: false,
    gameOver: false,
  };
};

export const move2048 = (game, direction) => {
  if (game.gameOver || game.won) return game;
  
  const size = game.gridSize;
  let grid = [...game.grid];
  let moved = false;
  let scoreGain = 0;
  
  const get = (x, y) => grid[y * size + x];
  const set = (x, y, v) => { grid[y * size + x] = v; };
  
  const moveLine = (line) => {
    // Filter zeros
    let filtered = line.filter(v => v !== 0);
    // Merge
    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i] === filtered[i + 1]) {
        filtered[i] *= 2;
        filtered.splice(i + 1, 1);
      }
    }
    // Pad with zeros
    while (filtered.length < 4) filtered.push(0);
    return filtered;
  };
  
  if (direction === 'up') {
    for (let x = 0; x < size; x++) {
      const col = [get(x, 0), get(x, 1), get(x, 2), get(x, 3)];
      const newCol = moveLine(col);
      for (let y = 0; y < size; y++) {
        if (get(x, y) !== newCol[y]) moved = true;
        set(x, y, newCol[y]);
      }
    }
  } else if (direction === 'down') {
    for (let x = 0; x < size; x++) {
      const col = [get(x, 3), get(x, 2), get(x, 1), get(x, 0)];
      const newCol = moveLine(col);
      for (let y = 0; y < size; y++) {
        if (get(x, y) !== newCol[size - 1 - y]) moved = true;
        set(x, y, newCol[size - 1 - y]);
      }
    }
  } else if (direction === 'left') {
    for (let y = 0; y < size; y++) {
      const row = [get(0, y), get(1, y), get(2, y), get(3, y)];
      const newRow = moveLine(row);
      for (let x = 0; x < size; x++) {
        if (get(x, y) !== newRow[x]) moved = true;
        set(x, y, newRow[x]);
      }
    }
  } else if (direction === 'right') {
    for (let y = 0; y < size; y++) {
      const row = [get(3, y), get(2, y), get(1, y), get(0, y)];
      const newRow = moveLine(row);
      for (let x = 0; x < size; x++) {
        if (get(x, y) !== newRow[size - 1 - x]) moved = true;
        set(x, y, newRow[size - 1 - x]);
      }
    }
  }
  
  if (!moved) return game;
  
  // Add new tile
  const empty = grid.map((v, i) => v === 0 ? i : -1).filter(i => i >= 0);
  if (empty.length > 0) {
    const idx = empty[Math.floor(Math.random() * empty.length)];
    grid[idx] = Math.random() < 0.9 ? 2 : 4;
  }
  
  const maxTile = Math.max(...grid);
  const newWon = maxTile >= 2048;
  
  // Check game over
  let gameOver = false;
  if (grid.every(v => v !== 0)) {
    let canMove = false;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const v = get(x, y);
        if (x < 3 && v === get(x + 1, y)) canMove = true;
        if (y < 3 && v === get(x, y + 1)) canMove = true;
      }
    }
    gameOver = !canMove;
  }
  
  return {
    ...game,
    grid,
    score: game.score + scoreGain,
    won: newWon,
    gameOver,
  };
};

export const check2048Win = (game) => game.won;
export const check2048GameOver = (game) => game.gameOver;
