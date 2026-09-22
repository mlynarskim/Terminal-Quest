export const ROT_N = (text, n) =>
  text.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + n) % 26) + base);
  });

export const VIGENERE = (text, keyword) => {
  const key = keyword.toUpperCase().replace(/[^A-Z]/g, '');
  if (!key) return text;
  let keyIndex = 0;
  return text.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    const keyChar = key[keyIndex % key.length];
    const shift = keyChar.charCodeAt(0) - 65;
    keyIndex++;
    return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26) + base);
  });
};

export const VIGENERE_DECRYPT = (text, keyword) => {
  const key = keyword.toUpperCase().replace(/[^A-Z]/g, '');
  if (!key) return text;
  let keyIndex = 0;
  return text.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    const keyChar = key[keyIndex % key.length];
    const shift = keyChar.charCodeAt(0) - 65;
    keyIndex++;
    return String.fromCharCode(((c.charCodeAt(0) - base - shift + 26) % 26) + base);
  });
};

export const BASE64_ENCODE = (text) => {
  try {
    return btoa(text);
  } catch {
    return text;
  }
};

export const BASE64_DECODE = (text) => {
  try {
    return atob(text);
  } catch {
    return text;
  }
};

export const XOR_HEX = (text, key) =>
  [...text]
    .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ ((key >> ((i % 4) * 8)) & 0xff)))
    .join('');

export const decodeHex = (hexStr) => {
  try {
    return hexStr.replace(/\\x([0-9a-f]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
  } catch {
    return hexStr;
  }
};

export const ENCRYPTED_FILES = [
  {
    path: '/logs/cipher_alpha.log',
    cipher: 'rot',
    shift: 7,
    reward: 100,
    hint: 'HINT: shift the letters. seven steps forward, nineteen back.',
    plaintext: 'SECTOR_7 was the first to fall. the corruption started here.',
  },
  {
    path: '/archives/encrypted.dat',
    cipher: 'hex',
    reward: 120,
    hint: 'HINT: hex is just numbers wearing a mask. decode byte by byte.',
    plaintext: 'The grid has a memory. it remembers every explorer.',
  },
  {
    path: '/system/cipher_beta.sys',
    cipher: 'xor',
    shift: 42,
    reward: 150,
    hint: 'HINT: XOR with key 42. the universal answer.',
    plaintext: 'The answer to everything is 42. the question is: who asked?',
  },
  {
    path: '/users/explorer/journal.enc',
    cipher: 'rot',
    shift: 13,
    reward: 200,
    hint: 'HINT: ROT13 — the classic. what goes around comes around.',
    plaintext: 'I found the core crystal. it hummed a frequency I had never heard.',
  },
  {
    path: '/home/secrets.txt.enc',
    cipher: 'hex',
    reward: 180,
    hint: 'HINT: each pair of hex digits is a letter. the truth is in the bytes.',
    plaintext: 'The previous explorer left a message: DONT TRUST THE GLITCH.',
  },
  {
    path: '/archives/vigenere_msg.enc',
    cipher: 'vigenere',
    keyword: 'GRID',
    reward: 200,
    hint: 'HINT: Vigenere cipher. the key is the grid itself. four letters.',
    plaintext: 'The cat knows the way. follow the fragments to the core.',
  },
  {
    path: '/system/base64_log.enc',
    cipher: 'base64',
    reward: 200,
    hint: 'HINT: Base64 encoding. looks like garbage, but it is structured.',
    plaintext: 'System log: Core temperature nominal. Cat subsystem: ACTIVE.',
  },
  {
    path: '/home/vigenere_diary.enc',
    cipher: 'vigenere',
    keyword: 'CAT',
    reward: 250,
    hint: 'HINT: Three letters. the guardian of the grid. meow.',
    plaintext: 'Day 847: The explorer is close. The cat watches. The grid remembers.',
  },
  {
    path: '/archives/base64_archive.enc',
    cipher: 'base64',
    reward: 250,
    hint: 'HINT: Base64. decode to reveal the archive index.',
    plaintext: 'Archive Index: [001] Core Crystal, [002] Master Key, [003] Grid Artifact.',
  },
];

export const encryptFile = (file) => {
  if (file.cipher === 'rot') {
    return { ...file, content: ROT_N(file.plaintext, file.shift) };
  }
  if (file.cipher === 'hex') {
    return {
      ...file,
      content: [...file.plaintext]
        .map((c) => '\\x' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    };
  }
  if (file.cipher === 'xor') {
    return { ...file, content: XOR_HEX(file.plaintext, file.shift) };
  }
  if (file.cipher === 'vigenere') {
    return { ...file, content: VIGENERE(file.plaintext, file.keyword) };
  }
  if (file.cipher === 'base64') {
    return { ...file, content: BASE64_ENCODE(file.plaintext) };
  }
  return file;
};

export const decryptFile = (file) => {
  if (file.cipher === 'rot') {
    return ROT_N(file.content, 26 - file.shift);
  }
  if (file.cipher === 'hex') {
    return decodeHex(file.content);
  }
  if (file.cipher === 'xor') {
    return XOR_HEX(file.content, file.shift);
  }
  if (file.cipher === 'vigenere') {
    return VIGENERE_DECRYPT(file.content, file.keyword);
  }
  if (file.cipher === 'base64') {
    return BASE64_DECODE(file.content);
  }
  return file.content;
};
