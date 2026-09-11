# SPEC 02 — Four Power Pellets

> **Status:** Implemented
> **Depends on:** None
> **Date:** 2026-09-10
> **Objective:** Add four collectible Power Pellets in the classic maze corners with visual, audio, and Pac-Man pulse feedback.

## Scope

**In:**

- Place one Power Pellet at each of `(1,3)`, `(26,3)`, `(1,23)`, and `(26,23)` in `src/js/maze.js`.
- Represent each Power Pellet with tile value `4` in `MAZE` and in the per-game `game.grid` copy.
- Render Power Pellets with a radius of `6` pixels and alternate between visible and hidden every `500` ms of active game time.
- Keep Power Pellets collectible during their hidden rendering phase.
- Award exactly `50` points for each collected Power Pellet.
- Rename `dotsRemaining` to `collectiblesRemaining` and count both normal dots and Power Pellets toward victory.
- Trigger a Pac-Man size pulse to `125%` for `500` ms after each Power Pellet collection.
- Restart the Pac-Man pulse duration when another Power Pellet is collected while it is active.
- Play a `150` ms Web Audio sine tone that rises from `220` Hz to `440` Hz with maximum gain `0.1` for each collection.
- Continue the game silently if Web Audio is unavailable or the browser blocks playback.
- Clear pending Power Pellet audio and Pac-Man pulse effects after a life loss.
- Restore all Power Pellets only when a new game starts or restarts.

**Out of scope (for future specs):**

- Frightened ghosts, edible ghosts, ghost score chains, returning eyes, and any changes to ghost movement.
- Audio files, external audio libraries, volume controls, or persistent audio preferences.
- Effects on Pac-Man other than the specified temporary size pulse.
- Persistence of Power Pellet collection state between games or page loads.

## Data model

`src/js/maze.js` extends its tile encoding with `4` for a Power Pellet. The immutable `MAZE` template contains tile `4` at `(1,3)`, `(26,3)`, `(1,23)`, and `(26,23)`.

```js
const POWER_PELLET = 4;

const game = {
  collectiblesRemaining: 0,
  powerPulseRemaining: 0,
  powerPelletSoundPending: false,
};
```

`collectiblesRemaining` is initialized from every tile with value `2` or `4`. `powerPulseRemaining` is measured in milliseconds of active game time. `powerPelletSoundPending` is set by game rules when a pellet is collected and consumed by `src/js/main.js` after it attempts playback.

Coordinates use the existing tile grid with origin at the top-left. Rendering uses `game.playingTime` to blink Power Pellets: visible for `0–499` ms and hidden for `500–999` ms of each one-second cycle.

## Implementation plan

1. Update `src/js/maze.js` to parse a Power Pellet marker as tile value `4` and replace the four specified dots in `MAZE_STR`; manually verify that a new game grid contains exactly four tile-`4` cells at the required coordinates.
2. Update `createGame()`, `movePacman()`, `resetPositions()`, and `update()` in `src/js/game.js` to initialize and decrement the Power Pellet effect state, count tile values `2` and `4` in `collectiblesRemaining`, collect tile `4` for `50` points, reset the pulse duration, set the audio signal, and preserve collected pellets after a life loss.
3. Update `src/js/render.js` to draw tile `4` as a radius-`6` Power Pellet only during its visible active-time phase and to apply the 125% Pac-Man size pulse while `powerPulseRemaining` is positive.
4. Update `src/js/main.js` to consume the pending audio signal and attempt the specified Web Audio tone without allowing unsupported or blocked audio to interrupt the game loop.

## Acceptance criteria

- [ ] A newly started or restarted game contains exactly four Power Pellets at `(1,3)`, `(26,3)`, `(1,23)`, and `(26,23)`.
- [ ] Each Power Pellet is rendered with a radius of `6` pixels when visible.
- [ ] Each uncollected Power Pellet alternates between visible and hidden every `500` ms of active game time.
- [ ] An uncollected Power Pellet can be collected during both its visible and hidden phases.
- [ ] Collecting a Power Pellet removes it from `game.grid`, adds exactly `50` points, and decreases `collectiblesRemaining` by one.
- [ ] Collecting a normal dot still adds exactly `10` points and decreases `collectiblesRemaining` by one.
- [ ] The game enters the win state only after all normal dots and all four Power Pellets have been collected.
- [ ] Collecting a Power Pellet grows Pac-Man to 125% of its normal rendered size for `500` ms.
- [ ] Collecting a second Power Pellet during the pulse restarts the pulse to its full `500` ms duration.
- [ ] Each Power Pellet collection attempts to play a `150` ms sine tone rising from `220` Hz to `440` Hz with maximum gain `0.1`.
- [ ] The game continues to run and applies collection, scoring, and visual feedback when audio playback is unavailable or blocked.
- [ ] Losing a life does not restore collected Power Pellets and clears any active Pac-Man pulse or pending Power Pellet audio signal.
- [ ] Starting or restarting a game restores all Power Pellets.
- [ ] Existing arrow-key movement, normal dot collection, ghost collision and lives, four ghost behaviors, and row-14 tunnel wrapping remain functional.

## Decisions

- **Yes:** Use the classic positions `(1,3)`, `(26,3)`, `(1,23)`, and `(26,23)`. They clearly express the requested four main maze corners.
- **Yes:** Use tile value `4` in `MAZE` and `game.grid`. It keeps the collectible state in the existing authoritative grid rather than duplicating it in a coordinate list.
- **Yes:** Rename `dotsRemaining` to `collectiblesRemaining`. The counter must accurately include normal dots and Power Pellets.
- **Yes:** Make Power Pellets required for victory and worth `50` points. This preserves a clear all-collectibles win condition.
- **Yes:** Blink every `500` ms from `game.playingTime`. Active-time timing remains stable across browser frame rates and resets with play state.
- **Yes:** Keep hidden Power Pellets collectible. Blinking is visual feedback only and must not change pathing or collision rules.
- **Yes:** Use a 125% Pac-Man size pulse for `500` ms. It gives immediate feedback without changing gameplay.
- **Yes:** Restart, rather than stack, the pulse when pellets are collected in succession. The effect stays bounded and predictable.
- **Yes:** Generate the sound with Web Audio. A short generated tone avoids adding binary assets or dependencies.
- **Yes:** Continue silently when audio fails. Audio is optional feedback and must never block the game.
- **Yes:** Clear transient visual and audio state after a life loss. The collectible remains consumed, while feedback does not leak into the respawn state.
- **No:** Frightened mode or edible ghosts. Those mechanics require separate ghost states, collision behavior, timing, and scoring rules.
- **No:** Audio files or external sound libraries. Web Audio is sufficient for the specified cue.
- **No:** Persistence between games or reloads. The immutable maze template already restores collectibles for each new game.

## Risks

| Risk                                                            | Mitigation                                                                         |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Web Audio is unavailable or requires a user gesture.            | Catch failed audio creation or playback and continue the game without sound.       |
| Tile `4` is mistaken for a wall or door by existing maze logic. | Retain the current rule that only values `1` and, for Pac-Man, `3` block movement. |
| The pulse remains active after a life loss.                     | Reset `powerPulseRemaining` and `powerPelletSoundPending` in `resetPositions()`.   |

## What is **not** in this spec

- Frightened ghosts, edible ghosts, returning eyes, or ghost score chains.
- Changes to ghost behavior, release timers, collision rules, or tunnel behavior.
- Audio files, settings, or persistence.
- Any visual effect for Pac-Man other than the specified size pulse.
