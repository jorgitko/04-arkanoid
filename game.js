// Arkanoid MVP - Game Logic

// Canvas y contexto
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Dimensiones
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Estados del juego
const STATES = {
  START: 'START',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAMEOVER: 'GAMEOVER',
  WIN: 'WIN'
};

// Game state
const gameState = {
  state: STATES.START,
  score: 0,
  lives: 3,
  blocks: []
};

// Paddle
const paddle = {
  x: CANVAS_WIDTH / 2 - 81,
  y: CANVAS_HEIGHT - 40,
  width: 162,
  height: 14,
  speed: 6
};

// Ball
const ball = {
  x: CANVAS_WIDTH / 2 - 8,
  y: CANVAS_HEIGHT / 2,
  width: 16,
  height: 16,
  vx: 3,
  vy: -3,
  active: true
};

// Input state
const keys = {
  left: false,
  right: false
};
