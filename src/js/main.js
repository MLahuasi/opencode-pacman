// main.js
// Bucle, teclado y pantallas. Usa createGame/update/draw (globals).

const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );
const overlay = document.getElementById( 'overlay' );
const actionBtn = document.getElementById( 'action-btn' );

let game = createGame();
let frame = 0;
let previousTimestamp = null;
let audioContext = null;

const KEY_DIR = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
};

document.addEventListener( 'keydown', ( e ) => {
  const dir = KEY_DIR[ e.key ];
  if ( !dir ) return;
  e.preventDefault();
  if ( game.state === 'playing' ) game.pacman.nextDir = dir;
} );

function showOverlay( title, cls, btnLabel ) {
  overlay.innerHTML =
    '<h1' + ( cls ? ' class="' + cls + '"' : '' ) + '>' + title + '</h1>' +
    '<button id="action-btn">' + btnLabel + '</button>';
  overlay.classList.add( 'show' );
  document.getElementById( 'action-btn' ).addEventListener( 'click', startGame );
}

function startGame() {
  game = createGame();
  game.state = 'playing';
  overlay.classList.remove( 'show' );
}

if ( actionBtn ) actionBtn.addEventListener( 'click', startGame );

function playPowerPelletSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if ( !AudioContextClass ) return;

    if ( !audioContext ) audioContext = new AudioContextClass();
    if ( audioContext.state === 'suspended' ) audioContext.resume().catch( () => {} );

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime( 220, now );
    oscillator.frequency.linearRampToValueAtTime( 440, now + 0.15 );
    gain.gain.setValueAtTime( 0, now );
    gain.gain.linearRampToValueAtTime( 0.1, now + 0.01 );
    gain.gain.linearRampToValueAtTime( 0, now + 0.15 );
    oscillator.connect( gain );
    gain.connect( audioContext.destination );
    oscillator.start( now );
    oscillator.stop( now + 0.15 );
  } catch ( error ) {
    // El audio es opcional: el juego debe seguir si el navegador lo bloquea.
  }
}

function playPendingPowerPelletSound() {
  if ( !game.powerPelletSoundPending ) return;
  game.powerPelletSoundPending = false;
  playPowerPelletSound();
}

function playGhostEatenSound( startTime ) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if ( !AudioContextClass ) return;

    if ( !audioContext ) audioContext = new AudioContextClass();
    if ( audioContext.state === 'suspended' ) audioContext.resume().catch( () => {} );

    const now = startTime === null ? audioContext.currentTime : startTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime( 440, now );
    oscillator.frequency.linearRampToValueAtTime( 880, now + 0.15 );
    gain.gain.setValueAtTime( 0, now );
    gain.gain.linearRampToValueAtTime( 0.1, now + 0.01 );
    gain.gain.linearRampToValueAtTime( 0, now + 0.15 );
    oscillator.connect( gain );
    gain.connect( audioContext.destination );
    oscillator.start( now );
    oscillator.stop( now + 0.15 );
  } catch ( error ) {
    // El audio es opcional: el juego debe seguir si el navegador lo bloquea.
  }
}

function playPendingGhostEatenSounds() {
  const sounds = game.ghostEatenSoundsPending;
  game.ghostEatenSoundsPending = 0;
  for ( let i = 0; i < sounds; i++ ) {
    const startTime = audioContext ? audioContext.currentTime + i * 0.15 : null;
    playGhostEatenSound( startTime );
  }
}

function loop( timestamp ) {
  const elapsedTime = previousTimestamp === null ? 0 : timestamp - previousTimestamp;
  previousTimestamp = timestamp;
  frame++;
  if ( game.state === 'playing' ) {
    update( game, elapsedTime );
    playPendingPowerPelletSound();
    playPendingGhostEatenSounds();
    if ( game.state === 'won' ) showOverlay( 'GANASTE', 'win', 'Reiniciar' );
    else if ( game.state === 'lost' ) showOverlay( 'PERDISTE', 'lose', 'Reiniciar' );
  }
  draw( ctx, game, frame );
  requestAnimationFrame( loop );
}

loop();
