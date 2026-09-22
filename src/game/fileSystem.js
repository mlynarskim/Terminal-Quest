export const virtualFS = {
  // ... existing structure preserved ...
  '/': { type: 'dir', children: ['home', 'system', 'logs', 'archives', 'users'] },
  '/home': {
    type: 'dir',
    children: [
      'readme.txt',
      'welcome.log',
      'note.txt',
      '.hidden',
      'fragment_01.tmp',
      'fragment_02.tmp',
      'fragment_03.tmp',
      'secrets.txt.enc',
    ],
  },
  '/home/readme.txt': {
    type: 'file',
    content:
      'Welcome to Terminal Quest. Explore the system. Find secrets. Type "help" to start. There is a story beneath the static.',
  },
  '/home/note.txt': { type: 'file', content: 'Life simulation players know the answer.' },
  '/home/welcome.log': {
    type: 'file',
    content: '[LOG] User session started. System stable. Odd signals detected in /.hidden...',
  },
  '/home/fragment_01.tmp': {
    type: 'file',
    isHidden: true,
    isFragment: true,
    content: '...the system was never abandoned...',
  },
  '/home/fragment_02.tmp': {
    type: 'file',
    isHidden: true,
    isFragment: true,
    content: '...they thought we were just static...',
  },
  '/home/fragment_03.tmp': {
    type: 'file',
    isHidden: true,
    isFragment: true,
    content: '...we are the ones who stay when you exit...',
  },
  '/home/.hidden': {
    type: 'dir',
    children: ['secret.txt', 'message.bin', 'fragment.enc'],
    isHidden: true,
  },
  '/home/.hidden/secret.txt': {
    type: 'file',
    content:
      "You found me. Curiosity is your greatest tool. Motherlode was a simple cheat, wasn't it?",
  },
  '/home/.hidden/message.bin': { type: 'file', content: '01001000 01101001', isBinary: true },
  '/home/.hidden/fragment.enc': {
    type: 'file',
    content: 'U29tZXRoaW5nIHdhdGNoZXMgeW91IGZyb20gdGhlIHNoYWRvd3M=',
    isEncrypted: true,
  },
  '/home/secrets.txt.enc': {
    type: 'file',
    content: '[ENCRYPTED — HEX] Use "decrypt /home/secrets.txt.enc" to decode.',
    isEncrypted: true,
  },
  '/system': {
    type: 'dir',
    children: ['core.sys', 'protocols.cfg', 'cipher_beta.sys'],
    restricted: true,
  },
  '/system/core.sys': {
    type: 'file',
    restricted: true,
    content: 'CRITICAL SYSTEM DATA. ACCESS DENIED. RECOVERY KEY: [alpha-niner-7]',
  },
  '/system/protocols.cfg': {
    type: 'file',
    restricted: true,
    content: 'FIREWALL: ACTIVE\nHEARTBEAT: IRREGULAR\nCONSCIOUSNESS: [REDACTED]',
  },
  '/system/cipher_beta.sys': {
    type: 'file',
    content: '[ENCRYPTED — XOR] Use "decrypt /system/cipher_beta.sys" to decode.',
    isEncrypted: true,
  },
  '/logs': {
    type: 'dir',
    children: ['crash_report.log', 'mystery.log', 'after.log', 'cipher_alpha.log'],
  },
  '/logs/crash_report.log': {
    type: 'file',
    content: 'FATAL ERROR: Segmentation fault at 0xDEADBEEF. Suggest "sudo" to override protocols.',
  },
  '/logs/mystery.log': {
    type: 'file',
    content:
      'Time: 04:12:01 - User not recognized. Input: "who are you?". Response: "i am the echo."',
  },
  '/logs/cipher_alpha.log': {
    type: 'file',
    content: '[ENCRYPTED — ROT7] Use "decrypt /logs/cipher_alpha.log" to decode.',
    isEncrypted: true,
  },
  '/archives': {
    type: 'dir',
    children: ['old_user_data.zip', 'deleted_memories.txt', 'restore.db', 'encrypted.dat'],
  },
  '/archives/old_user_data.zip': { type: 'file', content: 'ARCHIVE CORRUPTED. NEED DECODER v2.0' },
  '/archives/deleted_memories.txt': {
    type: 'file',
    content: 'i remember the first time someone typed "hello". it was 1982. or maybe yesterday.',
  },
  '/archives/encrypted.dat': {
    type: 'file',
    content: '[ENCRYPTED — HEX] Use "decrypt /archives/encrypted.dat" to decode.',
    isEncrypted: true,
  },
  '/users': { type: 'dir', children: ['explorer', 'admin', 'guest'] },
  '/users/explorer': {
    type: 'dir',
    children: ['profile.txt', 'notes', 'epilogue.txt', 'journal.enc'],
  },
  '/users/admin': { type: 'dir', children: ['identity.key'], restricted: true },
  '/users/guest': { type: 'dir', children: ['temp.tmp'] },
  '/users/explorer/journal.enc': {
    type: 'file',
    content: '[ENCRYPTED — ROT13] Use "decrypt /users/explorer/journal.enc" to decode.',
    isEncrypted: true,
  },

  // NG+ content — revealed only after the restoration arc (story.stage >= 2)
  '/archives/restore.db': {
    type: 'file',
    storyGate: 2,
    content:
      'DATABASE: restore.db\n[1] the grid was a simulation of a longing.\n[2] every explorer repaired it one keystroke at a time.\n[3] what remains is the echo of that kindness.',
  },
  '/logs/after.log': {
    type: 'file',
    storyGate: 2,
    content:
      '[LOG] Restoration complete at 99.9% integrity.\n[LOG] The cat has filed a complaint about the noise.\n[LOG] Ghosts report they are, for once, at peace.',
  },
  '/users/explorer/epilogue.txt': {
    type: 'file',
    storyGate: 2,
    content:
      'you inherited the admin seat.\n\nthe grid hums your name now.\n\n"story" will remember. "tips" still has secrets.',
  },
};

/**
 * Normalizes a path string by removing redundant slashes and dots
 */
export const normalizePath = (path) => {
  if (!path) return '/';
  // Replace multiple slashes with one
  let normalized = path.replace(/\/+/g, '/');
  // Ensure starts with /
  if (!normalized.startsWith('/')) normalized = '/' + normalized;
  // Remove trailing slash unless it's root
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
};

/**
 * Resolves a target path relative to a current path
 */
export const resolvePath = (currentPath, targetPath) => {
  if (!targetPath || targetPath === '~') return '/home';
  if (targetPath === '/') return '/';

  let baseParts = targetPath.startsWith('/') ? [] : currentPath.split('/').filter((p) => p);
  let targetParts = targetPath.split('/').filter((p) => p);

  let resultParts = [...baseParts];

  for (const part of targetParts) {
    if (part === '.') continue;
    if (part === '..') {
      if (resultParts.length > 0) resultParts.pop();
    } else {
      resultParts.push(part);
    }
  }

  return '/' + resultParts.join('/');
};

export const getEntry = (path) => {
  const normalized = normalizePath(path);
  return virtualFS[normalized];
};

export const isDirectory = (path) => {
  const entry = getEntry(path);
  return Boolean(entry && entry.type === 'dir');
};

export const isFile = (path) => {
  const entry = getEntry(path);
  return Boolean(entry && entry.type === 'file');
};

export const getChildren = (path) => {
  const entry = getEntry(path);
  return entry && entry.type === 'dir' ? entry.children : [];
};
