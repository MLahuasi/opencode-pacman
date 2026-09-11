// game.js
// Estado y reglas. Depende de globals de maze.js: MAZE, TUNNEL_ROW,
// PACMAN_START, GHOST_STARTS.

const DIRS = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};
const OPPOSITE = { left: 'right', right: 'left', up: 'down', down: 'up' };

const PACMAN_SPEED = 0.125; // 1/8 celda/frame -> alinea cada 8 frames
const GHOST_SPEED = 0.1;    // 1/10 celda/frame

// Crea una partida nueva. Copia MAZE (pristino) a game.grid para poder comer
// dots sin destruir el original, y reiniciar.
function createGame() {
  const grid = MAZE.map( ( row ) => row.slice() );
  // La celda de inicio de Pacman arranca sin dot.
  grid[ PACMAN_START.y ][ PACMAN_START.x ] = 0;

  let collectibles = 0;
  for ( const row of grid ) for ( const v of row ) if ( v === 2 || v === 4 ) collectibles++;

  return {
    state: 'start',
    score: 0,
    lives: 3,
    collectiblesRemaining: collectibles,
    playingTime: 0,
    powerPulseRemaining: 0,
    powerPelletSoundPending: false,
    frightenedRemaining: 0,
    frightenedGhostsEaten: 0,
    ghostEatenSoundsPending: 0,
    floatingScores: [],
    grid,
    pacman: {
      x: PACMAN_START.x,
      y: PACMAN_START.y,
      dir: 'left',
      nextDir: null,
      speed: PACMAN_SPEED,
    },
    ghosts: GHOST_STARTS.map( ( g ) => ( {
      x: g.x,
      y: g.y,
      dir: 'up',
      speed: GHOST_SPEED,
      kind: g.kind,
      color: g.color,
      releaseDelay: g.releaseDelay,
      released: g.releaseDelay === 0,
      releaseAt: g.releaseDelay,
      patrolTarget: g.kind === 'patrol' ? { x: 26, y: 1 } : null,
    } ) ),
  };
}

function aligned( v ) {
  return Math.abs( v - Math.round( v ) ) < 1e-3;
}

// Una celda es muro para el actor dado?
//   pacman: bloqueado por pared (1) y puerta (3)
//   ghost:  bloqueado solo por pared (1)
function isWall( grid, x, y, actor ) {
  if ( y < 0 || y >= grid.length ) return true;
  if ( x < 0 || x >= grid[ 0 ].length ) return true;
  const v = grid[ y ][ x ];
  if ( v === 1 ) return true;
  if ( v === 3 && actor === 'pacman' ) return true;
  return false;
}

// Puede el actor avanzar desde (x,y) en la direccion dir?
function canMove( grid, x, y, dir, actor ) {
  const d = DIRS[ dir ];
  if ( !d ) return false;
  const tx = x + d.x;
  const ty = y + d.y;
  // Tunel: salir por un borde en la fila del tunel siempre es valido.
  if ( ty === TUNNEL_ROW && ( tx < 0 || tx >= grid[ 0 ].length ) ) return true;
  return !isWall( grid, tx, ty, actor );
}

function wrapTunnel( a, width ) {
  if ( Math.round( a.y ) === TUNNEL_ROW ) {
    if ( a.x < 0 ) a.x += width;
    else if ( a.x >= width ) a.x -= width;
  }
}

function activateFrightenedMode( game ) {
  game.frightenedRemaining = 10000;
  game.frightenedGhostsEaten = 0;
  game.ghosts.forEach( ( g ) => {
    if ( g.released ) g.dir = OPPOSITE[ g.dir ];
  } );
}

function movePacman( game ) {
  const p = game.pacman;
  const grid = game.grid;
  const width = grid[ 0 ].length;

  if ( aligned( p.x ) && aligned( p.y ) ) {
    p.x = Math.round( p.x );
    p.y = Math.round( p.y );

    // Aplicar giro pendiente si es posible.
    if ( p.nextDir && canMove( grid, p.x, p.y, p.nextDir, 'pacman' ) ) {
      p.dir = p.nextDir;
      p.nextDir = null;
    }
    // Comer dot o Power Pellet.
    if ( grid[ p.y ][ p.x ] === 2 || grid[ p.y ][ p.x ] === 4 ) {
      const isPowerPellet = grid[ p.y ][ p.x ] === 4;
      grid[ p.y ][ p.x ] = 0;
      game.score += isPowerPellet ? 50 : 10;
      game.collectiblesRemaining--;
      if ( isPowerPellet ) {
        game.powerPulseRemaining = 500;
        game.powerPelletSoundPending = true;
        activateFrightenedMode( game );
      }
    }
    // Si no puede seguir, se detiene en la celda.
    if ( !canMove( grid, p.x, p.y, p.dir, 'pacman' ) ) return;
  }

  const d = DIRS[ p.dir ];
  p.x += d.x * p.speed;
  p.y += d.y * p.speed;
  wrapTunnel( p, width );
}

function nearestValidTarget( grid, target ) {
  if ( !isWall( grid, target.x, target.y, 'ghost' ) ) return target;

  let nearest = null;
  let nearestDistance = Infinity;
  for ( let y = 0; y < grid.length; y++ ) {
    for ( let x = 0; x < grid[ y ].length; x++ ) {
      if ( isWall( grid, x, y, 'ghost' ) ) continue;
      const distance = Math.abs( x - target.x ) + Math.abs( y - target.y );
      if ( distance < nearestDistance ) {
        nearest = { x, y };
        nearestDistance = distance;
      }
    }
  }
  return nearest;
}

function shortestPathDirection( game, g, target, choices ) {
  const grid = game.grid;
  const width = grid[ 0 ].length;
  const start = { x: Math.round( g.x ), y: Math.round( g.y ) };
  const queue = [ { ...start, dir: g.dir, firstDir: null } ];
  const visited = new Set( [ `${start.x},${start.y},${g.dir}` ] );

  for ( let i = 0; i < queue.length; i++ ) {
    const current = queue[ i ];
    if ( current.x === target.x && current.y === target.y ) return current.firstDir || choices[ 0 ];

    const directions = current.firstDir
      ? Object.keys( DIRS ).filter( ( dir ) => dir !== OPPOSITE[ current.dir ] )
      : choices;
    for ( const dir of directions ) {
      if ( !canMove( grid, current.x, current.y, dir, 'ghost' ) ) continue;
      const d = DIRS[ dir ];
      const next = { x: current.x + d.x, y: current.y + d.y };
      wrapTunnel( next, width );
      const key = `${next.x},${next.y},${dir}`;
      if ( visited.has( key ) ) continue;
      visited.add( key );
      queue.push( { ...next, dir, firstDir: current.firstDir || dir } );
    }
  }

  return choices[ 0 ];
}

function decideGhost( game, g ) {
  const grid = game.grid;
  const p = game.pacman;
  const options = Object.keys( DIRS ).filter(
    ( dir ) => dir !== OPPOSITE[ g.dir ] && canMove( grid, g.x, g.y, dir, 'ghost' )
  );
  // Sin salida (callejon): permitir el giro de 180.
  const choices = options.length ? options : [ '' + OPPOSITE[ g.dir ] ];

  if ( g.kind === 'random' ) {
    g.dir = choices[ Math.floor( Math.random() * choices.length ) ];
    return;
  }

  let target;
  if ( g.kind === 'hunter' ) {
    target = { x: Math.round( p.x ), y: Math.round( p.y ) };
  } else if ( g.kind === 'ambusher' ) {
    const d = DIRS[ p.dir ];
    target = { x: Math.round( p.x ) + d.x * 4, y: Math.round( p.y ) + d.y * 4 };
  } else {
    target = nearestValidTarget( grid, g.patrolTarget );
    if ( Math.round( g.x ) === target.x && Math.round( g.y ) === target.y ) {
      g.patrolTarget = target.x === 26 && target.y === 1 ? { x: 1, y: 29 } : { x: 26, y: 1 };
    }
    target = g.patrolTarget;
  }

  g.dir = shortestPathDirection( game, g, nearestValidTarget( grid, target ), choices );
}

function moveGhost( game, g ) {
  if ( !g.released ) return;

  const grid = game.grid;
  const width = grid[ 0 ].length;

  if ( aligned( g.x ) && aligned( g.y ) ) {
    g.x = Math.round( g.x );
    g.y = Math.round( g.y );
    decideGhost( game, g );
    if ( !canMove( grid, g.x, g.y, g.dir, 'ghost' ) ) return;
  }

  const d = DIRS[ g.dir ];
  g.x += d.x * g.speed;
  g.y += d.y * g.speed;
  wrapTunnel( g, width );
}

function resetPositions( game ) {
  game.playingTime = 0;
  game.powerPulseRemaining = 0;
  game.powerPelletSoundPending = false;
  game.frightenedRemaining = 0;
  game.frightenedGhostsEaten = 0;
  game.ghostEatenSoundsPending = 0;
  game.floatingScores = [];

  const p = game.pacman;
  p.x = PACMAN_START.x;
  p.y = PACMAN_START.y;
  p.dir = 'left';
  p.nextDir = null;
  game.ghosts.forEach( ( g, i ) => {
    g.x = GHOST_STARTS[ i ].x;
    g.y = GHOST_STARTS[ i ].y;
    g.dir = 'up';
    g.released = g.releaseDelay === 0;
    g.releaseAt = game.playingTime + g.releaseDelay;
    g.patrolTarget = g.kind === 'patrol' ? { x: 26, y: 1 } : null;
  } );
}

function collides( a, b ) {
  return Math.abs( a.x - b.x ) < 0.5 && Math.abs( a.y - b.y ) < 0.5;
}

function update( game, elapsedTime ) {
  if ( game.state === 'playing' ) {
    game.playingTime += elapsedTime;
    game.powerPulseRemaining = Math.max( 0, game.powerPulseRemaining - elapsedTime );
    game.frightenedRemaining = Math.max( 0, game.frightenedRemaining - elapsedTime );
    game.ghosts.forEach( ( g ) => {
      if ( game.playingTime >= g.releaseAt ) g.released = true;
    } );
  }

  movePacman( game );
  game.ghosts.forEach( ( g ) => moveGhost( game, g ) );

  for ( const g of game.ghosts ) {
    if ( collides( game.pacman, g ) ) {
      game.lives--;
      if ( game.lives <= 0 ) {
        game.state = 'lost';
        return;
      }
      resetPositions( game );
      break;
    }
  }

  if ( game.collectiblesRemaining <= 0 ) game.state = 'won';
}

window.createGame = createGame;
window.update = update;
window.DIRS = DIRS;
