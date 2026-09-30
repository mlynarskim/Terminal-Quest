/**
 * Lore journal.
 *
 * Exploration is the point: entries unlock from reading files, cracking
 * ciphers, raising the cat, surviving storms, fixing the grid and from
 * writing your own notes. A new entry is announced the moment it becomes
 * readable, and pays out when it is actually read with `lore <id>`.
 */

import { CAT_TRUST_LISTEN, LORE_ENTRY_REWARD, LORE_FULL_BONUS } from './constants';

export const LORE_CATEGORIES = {
  origins: { name: 'ORIGINS', hint: 'what this place was before it broke' },
  signal: { name: 'THE SIGNAL', hint: 'the first transmission and the silence after' },
  corruption: { name: 'CORRUPTION', hint: 'sector 7, and what grew there' },
  cat: { name: 'THE CAT', hint: 'node-0, the oldest process on the grid' },
  deepnet: { name: 'DEEP NET', hint: 'frequencies that answer if you ask twice' },
  aftermath: { name: 'AFTERMATH', hint: 'what the grid says once it is whole' },
};

/**
 * `requires` is evaluated against live state, so entries unlock by playing
 * rather than by finding a magic word.
 */
export const LORE_ENTRIES = [
  {
    id: 'readme',
    category: 'origins',
    title: 'A Note Left On The Desktop',
    requires: (state) => (state.unlockedFiles || []).includes('/home/readme.txt'),
    body:
      'Somebody wrote this for whoever came next. "Explore the system. Find secrets. ' +
      'There is a story beneath the static." Whoever they were, they expected company.',
  },
  {
    id: 'first-command',
    category: 'origins',
    title: 'First Contact',
    requires: (state) => (state.stats?.commandsRun || 0) >= 25,
    body:
      'Twenty-five commands. You have stopped reading help pages and started reading the grid. ' +
      'The difference is small but irreversible.',
  },
  {
    id: 'explorer-profile',
    category: 'origins',
    title: 'The Explorer Who Stayed',
    requires: (state) => (state.stats?.dirsVisited || []).length >= 5,
    body:
      '/users/explorer still holds a profile for the operator before you. The photo file is corrupt. ' +
      'The notes file never existed. The journal was encrypted, and encrypted means someone expected it to be read.',
  },
  {
    id: 'welcome-log',
    category: 'origins',
    title: 'Session Log, First Entry',
    requires: (state) => (state.unlockedFiles || []).includes('/home/welcome.log'),
    body:
      'The very first line of the log says "system stable". The second says "odd signals detected in /.hidden". ' +
      'Everything after that is a variation on the same two facts.',
  },
  {
    id: 'daemon-first',
    category: 'signal',
    title: 'Someone Answers',
    requires: (state) => (state.stats?.commandsRun || 0) >= 10,
    body:
      'You asked the daemon a question and it gave you five bits and a personality. ' +
      'It has been waiting for company, and it is far too polite about the fact.',
  },
  {
    id: 'radio-signal',
    category: 'signal',
    title: 'Four Stations, One Voice',
    requires: (state) => state.radio?.on === true,
    body:
      'LO-FI, STATIC, ENCRYPTED, MINING. Four stations, and every one of them is the same broadcast ' +
      'filtered differently. The grid is not a network. It is a habit of listening.',
  },
  {
    id: 'cipher-1',
    category: 'signal',
    title: 'A Locked File Yields',
    requires: (state) => Object.keys(state.encrypted || {}).length >= 1,
    body:
      'Cipher broken. The plaintext underneath was never secret — it was just patient. ' +
      'Every lock on this grid was really a question about whether you would keep trying.',
  },
  {
    id: 'cipher-5',
    category: 'signal',
    title: 'The Archive Opens',
    requires: (state) => Object.keys(state.encrypted || {}).length >= 5,
    body:
      'Five ciphers, five voices, one author. Whoever encrypted all of this did it in a single sitting, ' +
      'and the timestamps say they were not alone.',
  },
  {
    id: 'sector-7',
    category: 'corruption',
    title: 'Sector 7',
    requires: (state) => (state.story?.stage || 0) >= 1,
    body:
      'The corruption did not spread. It grew. There is a difference, and the difference is intent. ' +
      'Sector 7 is where the grid stopped pretending to be a machine.',
  },
  {
    id: 'scan-report',
    category: 'corruption',
    title: 'Anomaly Report',
    requires: (state) => (state.unlockedFiles || []).some((p) => p.includes('mystery.log')),
    body:
      '"User not recognized. Input: who are you? Response: i am the echo." The grid was asked a question ' +
      'long before you arrived, and it answered with a voice it does not remember learning.',
  },
  {
    id: 'first-glitch',
    category: 'corruption',
    title: 'It Noticed You',
    requires: (state) => (state.glitch?.survived || []).length >= 1,
    body:
      'A glitch event broke, and you kept typing. That is the whole difference between a visitor and a resident. ' +
      'The corruption is not attacking you. It is making sure you are paying attention.',
  },
  {
    id: 'storm-witness',
    category: 'corruption',
    title: 'Weather Report',
    requires: (state) => (state.stats?.stormSurvivals || 0) >= 1,
    body:
      'Storms here are not weather. They are pressure. Something enormous is pushing from the far side of the grid, ' +
      'and the static is the sound of it leaning on the membrane.',
  },
  {
    id: 'cat-arrives',
    category: 'cat',
    title: 'Something In The Box',
    requires: (state) => state.cat?.unlocked === true,
    body:
      'It came out of a box you paid fifty bits for, looked directly at the cursor, and declined to explain itself. ' +
      'The grid has had a cat since before the grid.',
  },
  {
    id: 'cat-trust',
    category: 'cat',
    title: 'Trusted',
    requires: (state) => (state.cat?.trust || 0) >= 50,
    body:
      'It walks ahead of you and checks corners. It is not guiding you somewhere — it is making sure ' +
      'the route is still safe, which is a very different kind of care.',
  },
  {
    id: 'cat-listen',
    category: 'cat',
    title: 'What The Walls Say',
    requires: (state) => (state.cat?.trust || 0) >= CAT_TRUST_LISTEN,
    body:
      '"They never really left. They just stopped typing." The cat heard that once and decided it was the ' +
      'most important sentence in the system. It was not wrong.',
  },
  {
    id: 'fragments',
    category: 'cat',
    title: 'Three Fragments, One Voice',
    requires: (state) => (state.cat?.fragmentsFound || 0) >= 3,
    body:
      '"The system was never abandoned." / "They thought we were just static." / "We are the ones who stay when you exit." ' +
      'Three damaged files, one author, and the pronoun is plural.',
  },
  {
    id: 'deep-node',
    category: 'deepnet',
    title: 'A Voice On The Other End',
    requires: (state) => (state.stats?.commandsRun || 0) >= 100,
    body:
      '"Who is this?" / "How did you find this frequency?" The deep node asks questions it cannot answer, ' +
      'from a place it cannot leave. Some ghosts are just old dial tones.',
  },
  {
    id: 'sudo-core',
    category: 'deepnet',
    title: 'The Core Objected',
    requires: (state) => (state.solvedPuzzles || []).includes('crash'),
    body:
      'You read the core far too early and the grid segfaulted on you. Good. The system is supposed to push back. ' +
      'A machine that never refuses you is not a machine, it is a mirror.',
  },
  {
    id: 'cipher-10',
    category: 'deepnet',
    title: 'Every Lock, Opened',
    requires: (state) => Object.keys(state.encrypted || {}).length >= 10,
    body:
      'Ten ciphers, ten alphabets, one obsession. Whoever this was, they wanted the work to be findable. ' +
      'A secret you can only keep from yourself is barely worth the effort.',
  },
  {
    id: 'written-by-you',
    category: 'deepnet',
    title: 'Your Own Footprint',
    requires: (state) => Object.keys(state.fs?.files || {}).length >= 1,
    body:
      'You wrote a file. It is the first thing on this grid that was ever yours. ' +
      'The journal is keeping it, in case you forget.',
  },
  {
    id: 'grid-whole',
    category: 'aftermath',
    title: 'Integrity 100%',
    requires: (state) => (state.story?.stage || 0) >= 2,
    body:
      'Every sector healed, every file accounted for, the corruption either purged or preserved. ' +
      'The grid is quiet now, and quiet is the first thing it has been in years.',
  },
  {
    id: 'archive-after',
    category: 'aftermath',
    title: 'The Archives Remember',
    requires: (state) =>
      (state.unlockedFiles || []).some((p) => p.endsWith('restore.db') || p.endsWith('after.log')),
    body:
      '"The grid was a simulation of a longing." Somebody built this to hold the shape of missing someone, ' +
      'and then kept it running long after the reason was gone.',
  },
  {
    id: 'recompiled',
    category: 'aftermath',
    title: 'Recompiled',
    requires: (state) => (state.prestige || 0) >= 1,
    body:
      'You tore the arc down and started it again with the bonus intact. The grid cannot tell the difference, ' +
      'which is why it trusts you with the second run.',
  },
  {
    id: 'leaderboard-ten',
    category: 'aftermath',
    title: 'Name On The Board',
    requires: (state) => (state.leaderboard?.best || 0) >= 10,
    body:
      'Somewhere on the relay, an operator is reading a list and finding your handle on it. ' +
      'That is the closest this grid gets to friendship.',
  },
  {
    id: 'journal-complete',
    category: 'aftermath',
    title: 'Nothing Left Unread',
    // The last entry unlocks once every other one is recovered, which is the
    // only way for it to ever be reachable.
    requires: (state) =>
      LORE_ENTRIES.filter((entry) => entry.id !== 'journal-complete').every((entry) =>
        isDiscovered(state, entry.id)
      ),
    body:
      'Every entry recovered, every file read, every cipher opened. There is nothing left to find, ' +
      'which means the only thing left is the part you were making up.',
  },
];

const journalEntries = (state) => state.journal?.entries || {};

export const isDiscovered = (state, id) => Boolean(journalEntries(state)[id]);
export const isRead = (state, id) => Boolean(state.journal?.read?.[id]);

export const availableEntries = (state) =>
  LORE_ENTRIES.filter((entry) => !isDiscovered(state, entry.id) && entry.requires(state));

export const discoveredEntries = (state) =>
  LORE_ENTRIES.filter((entry) => isDiscovered(state, entry.id));

export const findEntry = (id) => LORE_ENTRIES.find((entry) => entry.id === id) || null;

export const journalProgress = (state) => {
  const discovered = discoveredEntries(state).length;
  return {
    discovered,
    total: LORE_ENTRIES.length,
    percent: Math.round((discovered / LORE_ENTRIES.length) * 100),
  };
};

/** Marks every newly available entry as discovered (idempotent). */
export const refreshJournal = (state) => availableEntries(state).map((entry) => entry.id);

export const readReward = (state, id) => {
  if (isRead(state, id)) return 0;
  const progress = journalProgress(state);
  const isLast = progress.discovered >= progress.total && !isRead(state, id);
  return LORE_ENTRY_REWARD + (isLast ? LORE_FULL_BONUS : 0);
};

export const formatEntry = (entry, { body = true } = {}) =>
  [
    `── ${entry.title.toUpperCase()} [${LORE_CATEGORIES[entry.category].name}] ──`,
    ...(body ? ['', entry.body] : []),
  ].join('\n');

export const formatIndex = (state) => {
  const progress = journalProgress(state);
  const lines = [
    `LORE JOURNAL // ${progress.discovered}/${progress.total} RECOVERED (${progress.percent}%)`,
    'Type "lore <id>" to read an entry. Reading pays Bits.',
    '',
  ];

  for (const [categoryId, category] of Object.entries(LORE_CATEGORIES)) {
    const entries = LORE_ENTRIES.filter((entry) => entry.category === categoryId);
    const found = entries.filter((entry) => isDiscovered(state, entry.id)).length;
    lines.push(`[${category.name}] ${found}/${entries.length} — ${category.hint}`);
    for (const entry of entries) {
      if (isDiscovered(state, entry.id)) {
        const mark = isRead(state, entry.id) ? 'x' : '*';
        lines.push(`  [${mark}] ${entry.id.padEnd(20)} ${entry.title}`);
      } else {
        lines.push(`  [ ] ${'?'.repeat(Math.min(entry.id.length, 18))} ???`);
      }
    }
    lines.push('');
  }

  lines.push('* = unread (pays Bits)');
  return lines.join('\n');
};
