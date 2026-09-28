# Terminal Quest

A retro terminal mystery game. Explore a corrupted filesystem, befriend a digital cat, and restore the grid.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite dev server on port 3000 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Type-check + ESLint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm test` | Run Vitest test suite |
| `npm run format` | Format source with Prettier |
| `npm run test:e2e` | Run Playwright E2E tests |

## Project Structure

```
src/
  components/      Reusable UI (StatusBar, TerminalPanel, FileIcon, Onboarding, MobileGameControls)
  game/            Game logic (fileSystem, commandRegistry, commandProcessor,
                   hintEngine, constants, processes, crafting, daemon, cron,
                   ciphers, prestige, radio, weekly, bestiary, storm, skins,
                   ranks, dailyQuest, story, games, tips, tutorial, objective)
  hooks/           useGameState (state management + persistence)
  lib/             audioSystem (Web Audio sound effects)
```

## Gameplay

### Core Loop
Explore → Solve puzzles → Earn Bits → Buy tools → Befriend cat → Collect fragments → Repair sectors → Restore grid → Choose ending → Prestige (NG+)

### Navigation & Files
| Command | Description |
|---------|-------------|
| `help` (`?`) | List all commands |
| `ls` (`dir`, `list`) | List directory contents (`ls -a` shows hidden) |
| `cd <dir>` | Change directory |
| `pwd` | Print working directory |
| `cat <file>` (`read`) | Read file content (also reads your memos) |
| `search <pattern>` (`find`) | Search the filesystem |
| `clear` (`cls`) | Clear the terminal |

### Bits, Shop & Inventory
| Command | Description |
|---------|-------------|
| `bits` (`balance`, `wallet`) | Check Bit balance |
| `buy <item>` (`shop`, `get`) | Buy items: `box` (50B), `cat_food` (30B), `decoder` (150B), `key` (200B), `theme_amber` (300B), `theme_cyan` (250B), `theme_violet` (400B) |
| `inventory` (`inv`, `bag`) | Show collected items |
| `combine <a> <b>` (`craft`, `fuse`) | Merge two items (see Crafting) |

### The Cat
| Command | Description |
|---------|-------------|
| `pet` / `feed` / `talk` / `follow` / `listen` / `look` | Interact (trust-gated: follow ≥ 50, listen ≥ 80) |

Feed the cat (needs `cat_food`), keep hunger up, raise trust past 80% — fragments appear for the taking.

### Story Arc (3 Stages)
| Stage | Name | How to Progress |
|-------|------|-----------------|
| 0 | DISCOVERY | Find 3 cat fragments (`/users/explorer`), build trust to 80%+ |
| 1 | REPAIR | `repair` each of 4 corrupted sectors (1000 Bits each) |
| 2 | RESTORED | `restore rewrite` **or** `restore preserve` — choose your ending |

**Endings:**
- `restore rewrite` — purge corruption, clean boot → *Grid Rewriter* achievement
- `restore preserve` — seal glitches in amber → *Glitch Keeper* achievement

Both unlock NG+ archive files (`/archives/restore.db`, `/logs/after.log`, `/users/explorer/epilogue.txt`) and the `recompile` (prestige) command.

### Minigames
| Command | Description |
|---------|-------------|
| `play crash [bet]` | Repeat the shown sequence with `guess` — 3 attempts, win pays bet ×2 |
| `play leak` | `catch` falling packets for 8s, `stop` to collect (+2 Bits each, jackpot at 20) |

### Ciphers & Decryption
| Command | Description |
|---------|-------------|
| `decrypt <path>` | Decode encrypted file (needs `key` or `decoder` from shop) |

**5 encrypted files** hidden in `/logs`, `/archives`, `/system`, `/users/explorer`, `/home`
- Algorithms: ROT, HEX, XOR
- Each rewards Bits + lore
- Need `key` (200B) or `decoder` (150B) from shop

### Radio & Storms
| Command | Description |
|---------|-------------|
| `radio on|off|tune <station>\|stations` | LO-FI (calm), STATIC (wild), ENCRYPTED (lore), MINING (+Bits) |
| `storm` | Storm status — survive 45s of spiking glitches for 80 Bits |

### Dailies, Stats & Rank
| Command | Description |
|---------|-------------|
| `daily` (`quest`) | 3 seeded daemon quests/day + streak (milestones at 3/7/30 days) |
| `stats` (`report`) | Session counters; `stats --graph` for ASCII bit-flow log |
| `rank` (`level`) | Lifetime-Bits rank (shown in StatusBar) |
| `time` (`clock`) | System time + phase of day |
| `tips` (`hint`) | Random operational tip |
| `tutorial` (`intro`) | Guided first 5 commands; `tutorial [restart\|skip]` |
| `weekly` (`challenge`) | This week's challenge + bot leaderboard; #1 pays 150 Bits (once/week) |

### Crafting
| Command | Description |
|---------|-------------|
| `combine <a> <b>` (`merge`, `craft`, `fuse`) | Merge two items for rewards |

**Recipes:**
- `box + decoder` → loot box (120 Bits)
- `key + decoder` → master key (deep archive access)
- `box + key` → safe (200 Bits)
- `decoder + key` → grid artifact
- `master_key + decoder` → root access (300 Bits)
- `artifact + master_key` → core crystal (500 Bits)

### Automation
| Command | Description |
|---------|-------------|
| `cron add <cmd> <minutes>` | Schedule recurring command (max 5 jobs) |
| `cron list` / `cron remove <id>` | Manage jobs |
| `record <name>` … `record --stop` | Capture commands into a macro (max 20) |
| `play <macro>` | Replay a saved macro |

### Notes & Themes
| Command | Description |
|---------|-------------|
| `edit <name> <text>` (`memo`) | Write a personal memo (`cat <name>` reads it back) |
| `notes` / `rm memo <name>` | List / delete memos |
| `theme [name]` (`skin`) | Equip an owned theme; bare `theme` lists them |
| `ask <question>` (`daemon`) | Chat with the system daemon (+5 Bits, short cooldown) |

### Processes
| Command | Description |
|---------|-------------|
| `ps` (`top`, `tasks`) | List active processes with age and risk |
| `kill <pid>` | Terminate for Bits (overheated ones pay bonus) |
| `run [monitor\|stress\|shadow\|idle]` | Spawn your own process |

Processes age every command. Past danger threshold → overheat → glitches. Kill before overheating for near-miss bonus.

### Gallery & Progress
| Command | Description |
|---------|-------------|
| `bestiary` (`gallery`, `codex`) | Grid fauna, glyphs, organs, lore — discoveries unlock as you play |
| `achievements` (`awards`, `badges`) | Unlocked achievements |
| `stats` (`report`) | Session counters; `stats --graph` for ASCII bit-flow log |
| `rank` (`level`) | Lifetime-Bits rank (shown in StatusBar) |
| `time` (`clock`) | System time + phase of day |
| `tips` (`hint`) | Random operational tip |
| `tutorial` (`intro`) | Guided first 5 commands; `tutorial [restart\|skip]` |
| `weekly` (`challenge`) | This week's challenge + bot leaderboard; #1 pays 150 Bits (once/week) |
| `bestiary` (`codex`, `gallery`) | Grid fauna, glyphs, organs, lore — discoveries unlock as you play |

### Prestige (NG+)
| Command | Description |
|---------|-------------|
| `recompile` (`prestige`) | Reset world for permanent bonus (requires stage 2 + 2000 lifetime Bits) |

**Prestige Levels:**
| Level | Title | Perks |
|-------|-------|-------|
| 1 | RECOMPILED | +15% Bits, +200 start |
| 2 | REWRITTEN | Auto-feed cat, +30% Bits, +500 start |
| 3 | TRANSCENDED | Free decoder, +45% Bits, +1000 start |
| 4 | GRID_TWIN | 2× process Bits, +60%, +2000 start |
| 5 | PHANTOM_NODE | Storm immune, +75%, +5000 start |
| 6 | OMEGA_SECTOR | All perks, 2× global Bits, +10000 start |

### Save/Load & Utility
| Command | Description |
|---------|-------------|
| `save` / `load` | Export/import progress as JSON backup file |
| `clear` (`cls`) | Clear the terminal |
| `reset` | Wipe all progress (with confirmation) |
| `help` (`?`, `commands`) | List all available commands |

### Cheats / Easter Eggs
- `motherlode` — +150 Bits
- `rosebud` — +1 Bit
- Konami code (`up up down down left right left right b a`) — +100 Bits
- `sudo` — elevated privileges (try `sudo cat /system/core.sys`)
- `pizza`, `unicorn`, `dead beef`, `0xdeadbeef`, `update`, `pizza`, `unicorn`, `tetris`, `pac-man` — easter eggs

---

## Dev Commands

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite dev server on port 3000 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Type-check + ESLint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm test` | Run Vitest test suite |
| `npm run format` | Format source with Prettier |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Run Playwright with UI |
| `npm run test:e2e:headed` | Run Playwright headed |

## Architecture

- **React 19** + **Vite 6** + **Tailwind CSS 4** + **Motion**
- **Vitest** for unit tests (157 tests)
- **Playwright** for E2E tests
- **ESLint** + **Prettier** + **TypeScript** strict mode
- **Vercel Analytics** (privacy-friendly, no cookies)
- **Sentry** (optional, error tracking)

## License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built with ☕ and late-night debugging sessions. If you enjoy Terminal Quest, consider a ⭐ on GitHub or a shoutout — open source thrives on recognition.*# Force redeploy
