# Terminal Quest - Product Hunt Launch (ACCURATE)

## Tagline
A retro terminal mystery game. Explore a corrupted filesystem, befriend a digital cat, and restore the grid.

## Tagline (short)
A retro terminal mystery game. Explore, solve puzzles, befriend a digital cat.

---

## Description

**Terminal Quest** is a browser-based retro terminal mystery game. You wake up inside a partially corrupted system — explore its filesystem, solve puzzles, befriend a digital cat, and ultimately decide the fate of the grid.

### What you'll actually do:

**It's a real shell first**
- 69 real commands: `ls -la`, `cd -`, `grep -ri`, `find . -name "*.enc"`, `ps aux`, `kill -9 PID`
- Pipes (`cat x | grep y | wc -l`), redirection (`echo hi > note.txt`), globs (`*.enc`), quoting, `&&`/`||`
- `man` for anything, `history` that persists, `alias`, `export`
- Windows/PowerShell names too: `dir`, `type FILE`, `copy`, `del`, `findstr`, `tasklist`
- The filesystem is writable: create files and `rm` them again

**Explore & Solve**
- Navigate with `ls`, `cd`, `cat`, `tree`, `find`, `grep`
- Find hidden files with `ls -a`
- Solve puzzles: binary decoding, decryption, sudo challenges
- Read logs, uncover lore, discover hidden directories

**Three new systems**
- **Leaderboard** — a global scoreboard (Upstash-backed) that falls back to local rival agents; top 10 pays Bits
- **Lore journal** — 25 entries in 6 chapters that unlock by exploring, cracking ciphers and befriending the cat
- **Glitch events** — the grid corrupts itself at random; keep typing to survive them

**Befriend the Digital Cat**
- Buy a `box`, `meow`, and the cat is yours
- `feed` it (needs cat_food), `pet` it, `talk` to it
- Build trust to unlock fragments — 3 fragments unlock the repair arc

**Restore the Grid (Story Arc)**
- **Stage 1 - Discovery**: Find 3 cat fragments, build trust to 80%+
- **Stage 2 - Repair**: `repair` each of 4 corrupted sectors (1000 bits each)
- **Stage 3 - Restore**: `restore rewrite` OR `restore preserve` — two different endings with unique achievements and epilogues

**Earn & Spend Bits**
- Earn via puzzles, achievements, cheats (`motherlode`, konami code)
- Shop: `buy box` (50B), `decoder` (150B), `key` (200B), `cat_food` (30B)
- Themes: `buy theme_amber` (300B), `theme_cyan` (250B), `theme_violet` (400B), `theme_matrix` (350B), `theme_cyberpunk` (450B), `theme_monochrome` (200B)

**Decrypt Files**
- 10 encrypted files scattered across the system
- Ciphers: ROT, HEX, XOR, Vigenère, Atbash, Caesar+, Playfair, Baconian
- Each rewards Bits + lore
- Need `key` (200B) or `decoder` (150B) from shop

**Minigames (5)**
- `play crash [bet]` — repeat a sequence, 3 attempts, win ×2
- `play leak` — catch falling packets for 8s, `catch`/`stop`
- `play snake` — classic snake on 16×16 grid
- `play 2048` — merge tiles to reach 2048
- `play memory` — card matching with 60s timer

**Daily & Weekly**
- `daily` — 3 daemon quests/day, streak bonuses (3/7/30 days)
- `weekly` — weekly challenge + bot leaderboard, #1 = 150 Bits

**Prestige (NG+)**
- `recompile` — reset world for permanent bonus (requires story complete + 2000 lifetime bits)
- 6 levels: RECOMPILED → REWRITTEN → TRANSCENDED → GRID_TWIN → PHANTOM_NODE → OMEGA_SECTOR
- Perks: +Bits%, auto-feed cat, free decoder, 2× process bits, storm immunity, 2× global bits

**The Cat**
- `feed` (needs cat_food), `pet`, `talk`, `follow` (trust ≥50), `listen` (trust ≥80)
- Trust unlocks fragments, `listen` reveals secrets

**Other Commands**
- `stats` — session stats + ASCII graph (`stats --graph`)
- `rank` — lifetime Bits rank
- `tips` — random tips
- `time` — system time + phase of day
- `edit`/`notes`/`rm` — personal memos
- `save`/`load` — JSON backup files
- `tips`/`ask` — tips + daemon AI chat
- `theme` — switch themes (default, amber, cyan, violet, matrix, cyberpunk, monochrome)
- `save`/`load` — JSON backup to file
- `tutorial` — guided first 5 commands; `tutorial [restart|skip]`
- `ask` — chat with the system daemon (+5 Bits)

---

## Tagline Options (pick one)
1. A retro terminal mystery game. Explore, solve puzzles, befriend a digital cat.
2. Explore a corrupted filesystem. Befriend a digital cat. Restore the grid.
3. A terminal mystery game. Explore. Solve. Restore.

---

## Launch Tags
Developer Tools, Games, Open Source, Terminal, Retro Gaming, Indie Games

---

## First Comment (pinned)

Hey hunters! 👋

I built **Terminal Quest** — a browser-based retro terminal mystery game. You explore a corrupted filesystem, solve puzzles, befriend a digital cat, and ultimately choose the fate of the grid.

**What you'll do:**
- Navigate with `ls`, `cd`, `cat` — real terminal commands
- Hidden files exist: `ls -a` reveals them
- Earn Bits through puzzles, achievements, cheats (`motherlode`, konami code)
- Buy items: `buy box`, `buy decoder`, `buy key`, `buy cat_food`
- Find the cat, build trust (`feed`, `pet`, `talk`), earn fragments
- Repair 4 sectors (`repair`), then `restore rewrite` or `restore preserve` for two different endings
- Decrypt 10 files: ROT, HEX, XOR, Vigenère, Atbash, Caesar+, Playfair, Baconian (need decoder/key)
- Minigames: `play crash [bet]`, `play leak`, `play snake`, `play 2048`, `play memory`
- Daily quests (`daily`), weekly challenge (`weekly`), stats (`stats --graph`)
- Prestige (`recompile`) for NG+ with permanent perks (6 levels)
- Themes: `theme amber`, `theme cyan`, `theme_violet`, `theme matrix`, `theme cyberpunk`, `theme monochrome`

**Play free:** https://terminal-quest.vercel.app (no install, no account)

Progress saved in localStorage. Open source: github.com/mlynarskim/Terminal-Quest

I'm actively developing this and open to ideas. What would you like to see next? More cipher types? A level editor? Let me know in the comments — I read everything.

Try it and tell me which ending you chose. 🐱💾