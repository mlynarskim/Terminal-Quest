# Terminal Quest

A mysterious retro terminal puzzle game. You wake up inside a partially corrupted
grid. Explore its filesystem, befriend a digital cat, earn Bits, repair the
broken sectors — and ultimately decide the fate of the whole system.

Immersive CRT-style interface, Web Audio sound effects, persistent progress in
`localStorage` (`terminal_quest_save`).

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev` (dev server on port 3000)

## How To Play — Quickstart

1. Type `help` to see every command. The terminal also understands a little
   natural language (`look around`, `where am i`, `hello`).
2. Explore: `ls`, `cd /logs`, `cat readme.txt`. Hidden things exist —
   `ls -a` reveals dotfiles.
3. The note in `/home` hints at a famous cheat code. Try it. Free Bits.
4. Spend Bits in the shop: `buy box`, `buy decoder`, `buy key`, `buy cat_food`.
5. Find the cat (`/users/explorer` area, follow fragments). `feed`, `pet`,
   `talk` — trust unlocks fragments, fragments unlock the story.
6. Check your arc any time with `story`. Repair 4 sectors with `repair`,
   then run `restore` and **choose your ending**: `rewrite` or `preserve`.
7. After restoration (NG+): new archive files appear, `recompile` unlocks
   prestige levels, and the grid keeps paying you for dailies, weeklies,
   processes, radio and storms.

## First Contact — Onboarding

New terminals get an **interactive tutorial**: five guided steps
(`help` → `ls` → `cat readme.txt` → `cd /logs` → `ask hello`) that teach
the core verbs. Finishing pays **50 Bits** and the *First Boot* achievement.

- `tutorial` — show current step; `tutorial skip` opts out, `tutorial restart` replays.
- The **OBJECTIVE panel** (top-right) always shows your current goal with a
  progress bar — if you ever wonder "what now?", read it (or type `story`).
- The boot welcome states the whole arc up front: find the cat → 3 fragments →
  4 sectors → restore.

## What To Expect

**The loop:** explore → earn Bits → buy tools → unlock deeper layers →
advance the story → restore → prestige → chase 100% bestiary.

**Story arc (3 stages):**

| Stage | Name | How to progress |
|---|---|---|
| 0 | DISCOVERY | Find 3 cat fragments (`/users/explorer`, cat trust ≥ 80 helps) |
| 1 | REPAIR | `repair` each of the 4 corrupted sectors (1000 Bits each) |
| 2 | RESTORED | `restore rewrite` **or** `restore preserve` — two different endings, achievements and epilogues |

**Endings:**

- `restore rewrite` — purge the corruption, clean boot. Title: *Grid Rewriter*.
- `restore preserve` — seal the glitches in amber, keep the beautiful bugs.
  Title: *Glitch Keeper*.

Both unlock NG+ archive files (`/archives/restore.db`, `/logs/after.log`,
`/users/explorer/epilogue.txt`) and the `recompile` prestige command.

**Ambient life:** wild processes spawn on their own, grid storms roll through,
radio transmissions flicker in, the daemon hands you 3 fresh quests every day
and a new challenge every week. The side panels (PROCESSES, RADIO_NET,
WEEKLY_OPS, BESTIARY, DAEMON_DAILY, ARC_LOG) always show the live state.

## Full Command Reference

### Navigation & files

| Command | Description |
|---|---|
| `help` (`?`) | List all commands |
| `ls` (`dir`) | List directory contents (`ls -a` shows hidden) |
| `cd <dir>` (`goto`) | Change directory (`cd ..` goes up) |
| `pwd` | Print working directory |
| `cat <file>` (`read`) | Read file content (also reads your memos) |
| `search <pattern>` (`find`) | Search the filesystem |
| `clear` (`cls`) | Clear the terminal |
| `status` (`info`) | System health report |
| `sudo <cmd>` | Elevated privileges (enter restricted dirs) |

### Bits, shop & inventory

| Command | Description |
|---|---|
| `bits` (`balance`) | Check Bit balance |
| `buy <item>` (`shop`) | Buy `box` (50B), `cat_food` (30B), `decoder` (150B), `key` (200B), `theme_amber` (300B), `theme_cyan` (250B), `theme_violet` (400B) |
| `inventory` (`inv`) | Show collected items |
| `combine <a> <b>` (`craft`) | Merge two items (see Crafting) |
| `motherlode`, konami code | …try them |

### The cat

| Command | Description |
|---|---|
| `pet` / `feed` / `talk` / `follow` / `listen` / `look` | Interact (trust-gated: follow ≥ 50, listen ≥ 80) |

Feed the cat (needs `cat_food`), keep hunger up, raise trust past 80 —
fragments appear for the taking.

### Story

| Command | Description |
|---|---|
| `story` (`arc`) | Arc status, fragments, sectors |
| `repair` (`fix`) | Repair one sector, 1000 Bits (stage ≥ 1) |
| `restore [rewrite\|preserve]` | Final protocol — pick your ending (needs master `key` + 4/4 sectors) |
| `recompile` (`prestige`) | Reset the world for a permanent bonus (stage 2 + 2000 lifetime Bits) |

### Dailies, stats & rank

| Command | Description |
|---|---|
| `daily` (`quest`) | 3 seeded daemon quests per day + streak (milestones at 3/7/30 days) |
| `stats` (`report`) | Session counters; `stats --graph` draws an ASCII bit-flow log |
| `rank` (`level`) | Lifetime-Bits rank (shown in the StatusBar) |
| `time` (`clock`) | System time + phase of day |
| `tips` (`hint`) | Random operational tip |
| `tutorial` (`intro`) | Guided first 5 commands; `tutorial [restart\|skip]` |
| `weekly` (`challenge`) | This week's challenge + bot leaderboard; #1 pays 150 Bits (once per week) |

### Minigames

| Command | Description |
|---|---|
| `play crash [bet]` | Repeat the shown sequence with `guess` — 3 attempts, win pays bet ×2 |
| `play leak` | `catch` falling packets for 8s, `stop` to collect (+2 Bits each, jackpot at 20) |

### Processes

| Command | Description |
|---|---|
| `ps` (`top`) | List live processes with age and risk |
| `kill <pid>` | Terminate for Bits (overheated ones pay a near-miss bonus) |
| `run [monitor\|stress\|shadow\|idle]` | Spawn your own process |

Processes age every command you type. Past their danger threshold they
overheat — the grid warns you, then glitches.

### Ciphers

| Command | Description |
|---|---|
| `decrypt <path>` | Decode an encrypted file (needs `key` or `decoder`) |

Five cipher files hide in `/logs`, `/archives`, `/system`, `/users/explorer`,
`/home` — ROT, HEX and XOR, each with lore and a Bit reward.

### Radio & storms

| Command | Description |
|---|---|
| `radio on\|off\|tune <station>\|stations` | LO-FI (calm), STATIC (wild), ENCRYPTED (lore), MINING (+Bits) |
| `storm` | Storm status — survive 45s of spiking glitches for 80 Bits |

### Notes, themes & daemon

| Command | Description |
|---|---|
| `edit <name> <text>` (`memo`) | Write a personal memo (`cat <name>` reads it back) |
| `notes` / `rm memo <name>` | List / delete memos |
| `theme [name]` (`skin`) | Equip an owned theme; bare `theme` lists them |
| `ask <question>` (`daemon`) | Chat with the system daemon (+5 Bits, short cooldown) |

### Automation

| Command | Description |
|---|---|
| `cron add <cmd> <minutes>` | Run a command on a schedule (max 5 jobs) |
| `cron list` / `cron remove <id>` | Manage jobs |
| `record <name>` … `record --stop` | Capture commands into a macro (max 20) |
| `play <macro>` | Replay a saved macro |

### Gallery & persistence

| Command | Description |
|---|---|
| `bestiary` (`codex`) | Grid fauna, glyphs, organs and lore — discoveries unlock as you play |
| `achievements` | Unlocked achievements |
| `save` / `load` | Export / import progress as a JSON backup file |

## Systems In Depth

**Bits economy.** Earn via puzzles, `motherlode`-style cheats, minigames,
process kills, cipher rewards, radio catches, storm survival, dailies,
weeklies, daemon chats. Spend on shop tools, sector repairs, themes.

**Crafting recipes.** `box + decoder` → loot box (120B) · `key + decoder` →
master key · `box + key` → safe (200B) · `decoder + key` → grid artifact ·
`master_key + decoder` → root access (300B) · `artifact + master_key` →
core crystal (500B). Inputs are consumed.

**Storms.** Random onset, 45s duration, elevated glitch visuals. Keep typing —
survival pays automatically.

**Prestige.** `recompile` wipes sectors/story/processes/crons but keeps your
wallet growth: titles INITIAL_BOOT → RECOMPILED → REWRITTEN → TRANSCENDED →
GRID_TWIN → PHANTOM_NODE → OMEGA_SECTOR, plus a Bit bonus per level.

**Bestiary.** Five categories (files, command glyphs, fauna, system organs,
lore). Entries unlock from live progress — explore, solve, befriend, restore.

## Tips

- Stuck? Idle hints arrive on their own; `tips` and `ask` help immediately.
- `ls -a` early, `ls -a` often.
- Buy the `decoder` before wandering into `/archives`; buy the `key` before
  touching anything encrypted.
- Dangerous processes are profitable — let one simmer, then `kill` it.
- Tune MINING radio and leave it on while you explore.
- Record your daily loop as a macro; cron the boring parts.

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

## Project Structure

```
src/
  components/      Reusable UI (StatusBar, TerminalPanel, FileIcon, Onboarding)
  game/            Game logic (fileSystem, commandRegistry, commandProcessor,
                   hintEngine, constants, processes, crafting, daemon, cron,
                   ciphers, prestige, radio, weekly, bestiary, storm, skins,
                   ranks, dailyQuest, story, games, tips, tutorial, objective)
  hooks/           useGameState (state management + persistence)
  lib/             audioSystem (Web Audio sound effects)
```
