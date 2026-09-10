# SPEC 01 — Four Ghost Behaviors

> **Status:** Approved
> **Depends on:** None
> **Date:** 2026-09-10
> **Objective:** Add four distinct ghost behaviors with staggered releases while keeping the existing Pac-Man game playable.

## Scope

**In:**

- Define Blinky, Pinky, Inky, and Clyde in `src/js/maze.js` with their colors, behaviors, start cells, and release delays.
- Make Blinky choose the first step of a shortest valid path to Pac-Man.
- Make Pinky target the cell four tiles ahead of Pac-Man's direction.
- Make Inky patrol between the top-right and bottom-left valid maze cells after reaching each target.
- Make Clyde choose a valid direction at random.
- Release Blinky immediately and Pinky, Inky, and Clyde after 4, 8, and 12 seconds of active game time, including after a life loss.
- Preserve the current rule that ghosts cannot reverse except in a dead end.
- Render each ghost with its classic color.

**Out of scope (for future specs):**

- Power pellets, frightened ghosts, eaten ghosts, and returning eyes.
- Exact arcade behavior, internal timing tables, and original-game bugs.
- Persistence of game state or release timers.
- Additional labels, legends, or visual animations for ghosts.

## Data model

```js
const GHOST_STARTS = [
  { x: 12, y: 14, kind: "hunter", color: "#ff0000", releaseDelay: 0 },
  { x: 13, y: 14, kind: "ambusher", color: "#ffb8ff", releaseDelay: 4000 },
  { x: 14, y: 14, kind: "patrol", color: "#00ffff", releaseDelay: 8000 },
  { x: 15, y: 14, kind: "random", color: "#ffb852", releaseDelay: 12000 },
];
```

Each runtime ghost adds `released` and, for Inky, `patrolTarget`.

The game state adds `playingTime`, measured only while `game.state === 'playing'`.

Coordinates use the current tile grid with origin at the top-left. Patrol targets are `(26, 1)` and `(1, 29)`.

## Implementation plan

1. Extend `GHOST_STARTS` in `src/js/maze.js` with all four fixed start cells, behavior identifiers, classic colors, and release delays.
2. Extend `createGame()` and `resetPositions()` in `src/js/game.js` with release state, active play time, and Inky's patrol target while retaining the current speed and no-reversal rule.
3. Add shortest-path target selection in `src/js/game.js` for Blinky, Pinky, and Inky, including nearest-valid-target fallback; retain random selection for Clyde and skip movement until each ghost is released.
4. Update `update()` and `src/js/main.js` to advance active play time from animation timestamps and reset release timing after a lost life.
5. Update `src/js/render.js` to use each ghost's configured classic color instead of array position.

## Acceptance criteria

- [ ] Starting or restarting a game creates exactly four ghosts at `(12,14)`, `(13,14)`, `(14,14)`, and `(15,14)`.
- [ ] Blinky is red and begins moving immediately; Pinky is pink, Inky is cyan, and Clyde is orange.
- [ ] Pinky, Inky, and Clyde remain still until 4, 8, and 12 seconds respectively of active play time have elapsed.
- [ ] Losing a life resets all positions and repeats the 0, 4, 8, and 12 second release sequence.
- [ ] At intersections, Blinky follows a shortest valid route toward Pac-Man without reversing unless trapped.
- [ ] At intersections, Pinky follows a shortest valid route toward the cell four tiles ahead of Pac-Man, adjusting an invalid target to the nearest valid cell.
- [ ] Inky alternates between `(26,1)` and `(1,29)` after reaching each patrol target, adjusting an invalid target to the nearest valid cell.
- [ ] Clyde selects among valid non-reversing directions randomly, unless in a dead end.
- [ ] The game still supports movement, dots, win/loss states, collision lives, and tunnel wrapping on row 14.

## Decisions

- **Yes:** Simplified, distinct behaviors rather than exact arcade emulation. The current game has a small, direct movement engine.
- **Yes:** Blinky is `hunter`, Pinky is `ambusher`, Inky is `patrol`, and Clyde is `random`.
- **Yes:** Breadth-first shortest paths for targeted ghosts. It makes aggressive pursuit reliable in the maze.
- **Yes:** Four-tile anticipation for Pinky. It clearly distinguishes the ambush behavior.
- **Yes:** Inky alternates after reaching a patrol target. Its route remains objective-driven without another timer.
- **Yes:** Active animation time controls releases. Frame-count timing would vary with performance.
- **Yes:** Nearest valid-cell fallback for invalid target tiles. Targeted ghosts stay functional near walls and maze edges.
- **No:** Ghost-specific speed changes. Blinky's aggression comes from its path choice.
- **No:** Reversal at ordinary intersections. Existing movement behavior is preserved.
- **No:** Frightened mode, power pellets, or exact arcade timing. Those require separate gameplay states.

## Risks

| Risk                                          | Mitigation                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| A target lies in a wall or outside the grid.  | Resolve it to the nearest traversable tile before pathfinding.            |
| A path choice causes invalid tunnel handling. | Reuse `canMove()` and `wrapTunnel()` for all path expansion and movement. |
| Browser frame rate varies.                    | Accumulate animation timestamp deltas only during active play.            |

## What is **not** in this spec

- Power pellets, frightened ghosts, eaten ghosts, or returning eyes.
- Exact arcade behavior, timing tables, and original-game bugs.
- Persistence between sessions.
- Extra ghost interface or visual effects.
