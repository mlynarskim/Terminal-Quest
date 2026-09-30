# Terminal Quest

A retro terminal mystery game that behaves like an actual shell. Explore a corrupted filesystem, befriend a digital cat, and restore the grid.

Everything you already know works. `ls -la`, `cd -`, `grep -ri`, `find . -name "*.enc"`, `cat x | wc -l`, `echo "…" > note.txt`, `ps aux`, `kill -9 4213`, pipes, redirection, globs, quoting, `&&`/`||` — 69 real commands, plus 51 grid-specific verbs. If you can use a terminal, you can play this.

**Live demo:** the Vercel deployment of this repo · **Version:** 0.2.0

---

## Run Locally

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev      # http://localhost:3000
```

Optional environment (all of it is optional — see [Leaderboard](#1-leaderboard)):

```bash
cp .env.example .env
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server on port 3000 (`--host=0.0.0.0`) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | TypeScript check + ESLint |
| `npm run lint:fix` | ESLint with `--fix` |
| `npm test` | Vitest unit suite (290 tests) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright E2E (desktop + mobile) |
| `npm run test:e2e:ui` | Playwright with the UI |
| `npm run test:e2e:headed` | Playwright in a visible browser |
| `npm run format` | Prettier over `src/` |
| `npm run clean` | Remove `dist/` |

## Project Structure

```
api/
  leaderboard.js      Vercel serverless function (Upstash Redis) for the global board
src/
  App.jsx             UI orchestration, panels, the three new systems' effects
  components/         StatusBar, TerminalPanel, FileIcon, Onboarding, MobileGameControls
  game/
    shell/            The POSIX layer
      parse.js        Tokenizer: quotes, escapes, pipes, ; && ||, > >>
      flags.js        Flag parsing (-lah, -n5, --lines=5, -name x) and glob expansion
      tables.js       The command tables + alias table
      index.js        Pipeline execution, redirection, session state (cwd, env, aliases)
      commands/       filesystem.js, text.js, system.js, processes.js
    commandProcessor.js  Grid verbs, easter eggs, and the per-command tick chain
    commandRegistry.js   Grid commands + every shell command, with aliases
    fsView.js        Read/write overlay over the world: stat, list, touch, rm, cp, mv
    fileSystem.js    The world itself (29 files, 10 directories, all read-only)
    leaderboard.js   Score model, local rival agents, board rendering
    loreJournal.js   25 lore entries and their unlock conditions
    glitchEvents.js  8 glitch events, the survive mechanic, the cooldowns
    hintEngine.js    Contextual hints and the system's personality
    fileSystem / ciphers / crafting / processes / cron / radio / storm / dailyQuest /
    weekly / bestiary / story / prestige / games / ranks / skins / tutorial / tips /
    objective / objective / constants
  hooks/
    useGameState.js  State, localStorage persistence, save migration (v8)
  lib/
    audioSystem.js   Web Audio sound effects
    leaderboardApi.js  Client for /api/leaderboard with a silent local fallback
e2e/
  terminal-quest.spec.ts  Critical path
  shell.spec.ts           Shell, leaderboard, journal, glitch events
```

---

## Gameplay

### Core loop

Explore → earn Bits → buy tools → befriend the cat → collect fragments → repair sectors → restore the grid → choose an ending → recompile (NG+)

Along the way: read files, crack ciphers, survive storms, ride out glitch events, fill the lore journal, and climb the leaderboard.

### Navigation & files (all real)

| Command | Notes |
|---------|-------|
| `pwd` | Current directory (`get-location`) |
| `cd <dir>` | `cd ..`, `cd -` (previous), `cd ~`, no argument goes home |
| `ls [-l] [-a] [-h] [-r] [-t] [-S] [-F] [-d] [file...]` | One entry per line, or a real long format |
| `cat [-n] [-b] [-E] [file...]` | Reads stdin when given no file |
| `head -n N` / `tail -n N` | Also `-c`, bare counts like `head -3` |
| `less` / `more` | Aliases of the pager behaviour (the grid scrolls itself) |
| `tree [-a] [-L n]` | ASCII directory tree with a file count |
| `find [path] [-name x] [-type f\|d] [-maxdepth n]` | `find / -name "*.enc"` works |
| `grep [-i] [-v] [-n] [-c] [-l] [-o] [-w] pattern [file...]` | `[[:alpha:]]` classes supported |
| `wc [-l] [-w] [-c] [-m]`, `sort [-n] [-r] [-u] [-k n]`, `uniq [-c]`, `cut -d X -f N`, `tr [-d] [-s]`, `rev`, `tac`, `nl`, `seq`, `tee` | Text pipeline workhorses |
| `file`, `stat [-c fmt]`, `du [-h]`, `df [-h]`, `basename`, `dirname` | Metadata |
| `touch`, `mkdir [-p]`, `rm [-r] [-f]`, `rmdir`, `cp [-r]`, `mv` | Work on the files **you** create |

**Pipes and redirection**

```bash
cat /logs/mystery.log | grep -i user | wc -l
ls -la /archives | grep enc
echo "found at /logs/crash_report.log" > notes.txt
find / -name "*.enc" > ciphers.txt
cat ciphers.txt | head -3
test -f readme.txt && echo "it exists"
```

**The filesystem is writable.** Anything you create is a real file: `ls`, `cat`, `grep`, `cp`, `mv` and `rm` all work on it, and it is listed in the file visualizer. The grid's own files are read-only — `rm readme.txt` answers `Operation not permitted (the grid keeps its own)` — which is what keeps the story intact. `edit <name> <text>` and `notes` are shortcuts for `echo … > file` and `ls`.

**Windows / PowerShell names work too:** `dir` `type FILE` `copy` `move` `del` `erase` `md` `rd` `findstr` `tasklist` `taskkill` `where` `ver` `cls` `get-content` `get-location` `chdir` `new-item` `set`.

### System information & shell builtins

| Command | Notes |
|---------|-------|
| `man <cmd>` | Manual page for **any** command, including grid verbs |
| `help [topic]` | `help shell`, `help lore`, `help glitch`, `help ciphers`, … |
| `history [-c] [n]` | Persists between sessions, like a real HISTFILE |
| `type`, `which`, `command -v` | Resolve commands and aliases |
| `alias ll="ls -l"`, `unalias`, `export K=V`, `unset`, `env` | Session state |
| `whoami`, `id`, `hostname`, `uname [-a]`, `date [+FORMAT]`, `uptime`, `w`, `users` | Statted from the grid |
| `echo [-n] [-e]`, `printf`, `[` / `test -f x` | Classic |
| `time <cmd>`, `sleep`, `true`, `false`, `exit` | `exit` is refused: there is no escape |
| `sudo <cmd>` | Elevates and runs it; `sudo cat /system/core.sys` too early is a bad idea |
| `calm [on\|off\|toggle]` | Turn the chaos off if you want a quiet grid |

### Processes

| Command | Notes |
|---------|-------|
| `ps` / `ps aux` / `ps -ef` | `USER PID %CPU %MEM VSZ STAT COMMAND` |
| `top` | Sorted snapshot with a load average footer |
| `kill [-9] <pid>` | Pays Bits; overheating processes pay a near-miss bonus |
| `run [monitor\|stress\|shadow\|idle]` | Spawn your own |
| `pgrep <name>` | Find a PID by name |

Processes age on every command. Past their danger threshold they overheat and trigger glitches, so `ps` then `kill` is a real loop.

### Economy & progress

| Command | Notes |
|---------|-------|
| `bits` (`balance`, `wallet`) | Balance |
| `buy box\|cat_food\|decoder\|key\|theme_<id>` | 50 / 30 / 150 / 200 Bits, themes 200–450 |
| `inventory` (`items`, `inv`) | What you carry |
| `combine <a> <b>` (`craft`, `merge`) | 6 recipes: box+decoder, key+decoder, box+key, decoder+key, master_key+decoder, artifact+master_key |
| `achievements` (`awards`, `badges`) | ~35 achievements |
| `stats [--graph]`, `rank`, `tips`, `time` | Meta information |
| `bestiary` (`gallery`, `codex`) | 18 entries in 5 categories, derived from live progress |
| `daily` (`quest`), `weekly` (`challenge`) | 3 seeded quests/day with streaks; a weekly challenge with a 150 Bits prize |
| `radio on\|off\|tune <station>\|stations` | LO-FI, STATIC, ENCRYPTED, MINING |
| `storm`, `status`, `scan`, `install`, `ping` | Grid systems |
| `play crash\|leak\|snake\|2048\|memory`, `guess`, `catch`, `stop` | 5 minigames; arrow keys or the on-screen pad |
| `cron add <cmd> <mins>`, `cron list\|remove <id>` | Up to 5 jobs |
| `record <name>` … `record --stop`, `play <macro>` | Macros, up to 20 commands |
| `theme [name]` | 7 terminal themes |
| `tutorial [restart\|skip]` | 5 guided steps, 50 Bits + *First Boot* |
| `save` / `load` | JSON backup export/import |
| `clear` (`cls`) | Clears the screen |
| `reset` | Wipes progress, after a `[Y/N]` confirmation |

### Story arc

| Stage | Name | How to progress |
|-------|------|-----------------|
| 0 | DISCOVERY | Buy a `box`, `meow`, then feed/pet the cat until trust ≥ 80 and collect 3 fragments (`/home/fragment_0N.tmp`, revealed as the cat trusts you) |
| 1 | REPAIR | `repair` four corrupted sectors (1000 Bits each) |
| 2 | RESTORED | `restore rewrite` or `restore preserve` — pick your ending |

**Endings**

- `restore rewrite` — purge the corruption, clean boot → *Grid Rewriter*
- `restore preserve` — seal the glitches in amber → *Glitch Keeper*

Either way the story-gated files open (`/archives/restore.db`, `/logs/after.log`, `/users/explorer/epilogue.txt`) and `recompile` unlocks for NG+ (6 prestige levels, up to 2× Bits).

### Ciphers

13 encrypted files across `/logs`, `/archives`, `/system`, `/home` and `/users/explorer`, using ROT-N, Vigenère, Base64, Atbash, Caesar+, Playfair, Baconian, XOR and Hex. `decrypt <path>` (needs a `key` or `decoder`) reveals the plaintext and pays Bits; `decode <file>` reads `.bin` files with the decoder. Every file is worth reading, and most of them write a journal entry.

---

## The three new systems

### 1. Leaderboard

A real board, with a real fallback.

```bash
leaderboard                # the board, your position, your handle
leaderboard 25             # top n
leaderboard me             # your score and how it is calculated
leaderboard name ZeroCool  # set your operator handle
leaderboard submit         # publish to the global relay
leaderboard sync           # force a refresh
```

**Score** (the same in the terminal and in the LEADERBOARD panel):

| Source | Points |
|--------|--------|
| Lifetime bits | 1 per bit |
| Achievement | 250 |
| Lore entry | 400 |
| Bestiary find | 150 |
| Repaired sector | 1500 |
| Glitch event survived | 300 |

Reaching the top 10 pays 250 Bits, first place pays 750 (and the *Grid Legend* achievement). The board is sorted by score, deduplicated by handle, and clamped server-side.

**Global vs local.** With two environment variables set, the board is genuinely global — every player sees the same list:

```bash
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

`api/leaderboard.js` (a Vercel serverless function) stores a top-25 sorted set in Upstash over its REST API, with sanitised handles, clamped scores, a one-hour lease per handle so a score can only improve, and no runtime dependencies. Set `VITE_LEADERBOARD_API=off` to stay local.

**Without Redis** (local dev, offline, CI) the client silently falls back to 14 local rival agents whose scores advance with the wall clock from Monday 00:00 UTC. The board still moves between sessions — which is the point: there is always someone to catch. If the relay is unreachable, `leaderboard submit` keeps your score locally and says so.

### 2. Lore journal

Exploration pays in story, not just Bits.

```bash
lore          # index, grouped by chapter, with unread markers
lore <id>     # read an entry (pays 60 Bits the first time, +1000 for the last)
lore all      # dump everything recovered
```

25 entries in 6 chapters — ORIGINS, THE SIGNAL, CORRUPTION, THE CAT, DEEP NET, AFTERMATH. They unlock by playing, not by typing a magic word: reading a specific file, cracking ciphers, raising the cat's trust, collecting fragments, surviving a storm, riding out a glitch event, writing your own file, repairing a sector, restoring the grid, reaching the leaderboard top 10, or prestige. The LORE_JOURNAL panel tracks the chapters live, and the terminal announces each discovery as it happens.

### 3. Glitch events

Pure front-end, but it has a mechanical spine.

```bash
glitch         # active event, window, how many you have survived
glitch list    # the 8 signatures, and which ones you have ridden out
glitch force   # trigger one now
glitch force --brief   # 6-second window, for demos
```

An event can open at any time (roughly 3.5% per command, 2.5-minute cooldown). It gives you 45 seconds and expects you to keep typing: 2+ commands inside the window survives it and pays 40 Bits. Go quiet and the grid keeps what it took. 8 signatures across 4 effects — `static`, `tax` (a capped memory tax), `echo`, `fragment` — each with its own lines of corruption. While an event is open the whole CRT shudders, the scanlines thicken and a red sweep runs down the screen; the GLITCH_EVENT panel shows the progress bar. Survive 3 events for *Glitch Surfer*.

Prefer a quieter grid? `calm off` stops the self-corruption, the random events and the storms, and keeps everything else intact.

---

## Architecture

- **React 19** + **Vite 6** + **Tailwind CSS 4** + **Motion**
- **No backend required.** Progress lives in `localStorage` under `terminal_quest_save`, is versioned (`SAVE_VERSION = 8`) and migrated step by step; a partial or hand-edited save is hydrated against the defaults instead of crashing
- **One state writer.** The shell and the grid verbs read the same snapshot for a command line, which is why `cd /logs && ls` lists `/logs`
- **The world is read-only, the overlay is yours.** `fsView.js` merges the static world with your writes, so game content can never be destroyed by a stray `rm`
- **Vitest** (290 unit tests) and **Playwright** (14 E2E tests, desktop + mobile)
- **ESLint** + **Prettier** + **TypeScript** (`tsc --noEmit`)
- **Vercel** hosting with a serverless function for the leaderboard, PWA/offline support, optional **Sentry**, **Vercel Analytics**
- Accessibility: `prefers-reduced-motion` disables every CRT animation, and `calm off` removes the chaos

### Testing

```bash
npm test                 # unit
npm run test:e2e         # E2E (starts the dev server automatically)
```

The E2E suite seeds a *calm* save, so assertions are not fighting the intentional text corruption.

## License

MIT — see [LICENSE](LICENSE).

---

*Built with too much coffee and a suspicious amount of respect for `man` pages.*
