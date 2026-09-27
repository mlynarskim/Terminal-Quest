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

export const ATBASH = (text) =>
  text.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(base + (25 - (c.charCodeAt(0) - base)));
  });

export const CAESAR_PLUS = (text, shift, keyword = '') => {
  const baseShift = shift % 26;
  let keyIndex = 0;
  const key = keyword.toUpperCase().replace(/[^A-Z]/g, '');
  return text.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    let shift = baseShift;
    if (key) {
      const keyChar = key[keyIndex % key.length];
      shift = (baseShift + keyChar.charCodeAt(0) - 65) % 26;
      keyIndex++;
    }
    return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26) + base);
  });
};

export const CAESAR_PLUS_DECRYPT = (text, shift, keyword = '') => {
  const baseShift = shift % 26;
  let keyIndex = 0;
  const key = keyword.toUpperCase().replace(/[^A-Z]/g, '');
  return text.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    let shift = baseShift;
    if (key) {
      const keyChar = key[keyIndex % key.length];
      shift = (baseShift + keyChar.charCodeAt(0) - 65) % 26;
      keyIndex++;
    }
    return String.fromCharCode(((c.charCodeAt(0) - base - shift + 26) % 26) + base);
  });
};

export const PLAYFAIR = (text, keyword) => {
  const key = keyword.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
  const alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
  const used = new Set();
  let matrix = '';
  
  for (const ch of key + alphabet) {
    if (!used.has(ch)) {
      used.add(ch);
      matrix += ch;
    }
  }
  
  const getCoords = (ch) => {
    const idx = matrix.indexOf(ch);
    return [Math.floor(idx / 5), idx % 5];
  };
  
  const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
  let pairs = [];
  for (let i = 0; i < cleanText.length; ) {
    const a = cleanText[i];
    const b = cleanText[i + 1] || 'X';
    if (a === b) {
      pairs.push([a, 'X']);
      i += 1;
    } else {
      pairs.push([a, b]);
      i += 2;
    }
  }
  
  let result = '';
  for (const [a, b] of pairs) {
    const [ra, ca] = getCoords(a);
    const [rb, cb] = getCoords(b);
    if (ra === rb) {
      result += matrix[ra * 5 + (ca + 1) % 5];
      result += matrix[rb * 5 + (cb + 1) % 5];
    } else if (ca === cb) {
      result += matrix[((ra + 1) % 5) * 5 + ca];
      result += matrix[((rb + 1) % 5) * 5 + cb];
    } else {
      result += matrix[ra * 5 + cb];
      result += matrix[rb * 5 + ca];
    }
  }
  return result;
};

export const PLAYFAIR_DECRYPT = (text, keyword) => {
  const key = keyword.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
  const alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
  const used = new Set();
  let matrix = '';
  
  for (const ch of key + alphabet) {
    if (!used.has(ch)) {
      used.add(ch);
      matrix += ch;
    }
  }
  
  const getCoords = (ch) => {
    const idx = matrix.indexOf(ch);
    return [Math.floor(idx / 5), idx % 5];
  };
  
  let result = '';
  for (let i = 0; i < text.length; i += 2) {
    const a = text[i];
    const b = text[i + 1];
    const [ra, ca] = getCoords(a);
    const [rb, cb] = getCoords(b);
    if (ra === rb) {
      result += matrix[ra * 5 + (ca + 4) % 5];
      result += matrix[rb * 5 + (cb + 4) % 5];
    } else if (ca === cb) {
      result += matrix[((ra + 4) % 5) * 5 + ca];
      result += matrix[((rb + 4) % 5) * 5 + cb];
    } else {
      result += matrix[ra * 5 + cb];
      result += matrix[rb * 5 + ca];
    }
  }
  return result;
};

const BACON_MAP = {
  'A': 'AAAAA', 'B': 'AAAAB', 'C': 'AAABA', 'D': 'AAABB', 'E': 'AABAA',
  'F': 'AABAB', 'G': 'AABBA', 'H': 'AABBB', 'I': 'ABAAA', 'J': 'ABAAB',
  'K': 'ABABA', 'L': 'ABABB', 'M': 'ABBAA', 'N': 'ABBAB', 'O': 'ABBBA',
  'P': 'ABBBB', 'Q': 'BAAAA', 'R': 'BAAAB', 'S': 'BAABA', 'T': 'BAABB',
  'U': 'BAABA', 'V': 'BAABB', 'W': 'BABAA', 'X': 'BABAB', 'Y': 'BABBA', 'Z': 'BABBB'
};

export const BACON_ENCODE = (text) => {
  return text.toUpperCase().replace(/[A-Z]/g, (c) => BACON_MAP[c] || '').join(' ');
};

export const BACON_DECODE = (text) => {
  const reverseMap = Object.fromEntries(Object.entries(BACON_MAP).map(([k, v]) => [v, k]));
  return text.split(/\s+/).map(chunk => reverseMap[chunk] || '?').join('');
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
  {
    path: '/archives/atbash_note.enc',
    cipher: 'atbash',
    reward: 180,
    hint: 'HINT: Atbash cipher. A becomes Z, B becomes Y. the alphabet reversed.',
    plaintext: 'The mirror reveals what the light hides. Trust the reflection.',
  },
  {
    path: '/system/caesar_plus.enc',
    cipher: 'caesar_plus',
    shift: 7,
    keyword: 'GRID',
    reward: 220,
    hint: 'HINT: Caesar cipher with a twist. key is GRID, shift is 7.',
    plaintext: 'The grid remembers every command. even the ones you deleted.',
  },
  {
    path: '/archives/playfair_puzzle.enc',
    cipher: 'playfair',
    keyword: 'MATRIX',
    reward: 300,
    hint: 'HINT: Playfair cipher. key is MATRIX. J becomes I. pairs only.',
    plaintext: 'The matrix has you. but you have the key. find the exit.',
  },
  {
    path: '/home/bacon_secret.enc',
    cipher: 'bacon',
    reward: 200,
    hint: 'HINT: Bacon cipher. A=AAAAA, B=AAAAB. binary but tasty.',
    plaintext: 'The cat is not a cat. the cat is the system. meow in binary.',
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
  if (file.cipher === 'atbash') {
    return { ...file, content: ATBASH(file.plaintext) };
  }
  if (file.cipher === 'caesar_plus') {
    return { ...file, content: CAESAR_PLUS(file.plaintext, file.shift, file.keyword) };
  }
  if (file.cipher === 'playfair') {
    return { ...file, content: PLAYFAIR(file.plaintext, file.keyword) };
  }
  if (file.cipher === 'bacon') {
    return { ...file, content: BACON_ENCODE(file.plaintext) };
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
  if (file.cipher === 'atbash') {
    return ATBASH(file.content);
  }
  if (file.cipher === 'caesar_plus') {
    return CAESAR_PLUS_DECRYPT(file.content, file.shift, file.keyword);
  }
  if (file.cipher === 'playfair') {
    return PLAYFAIR_DECRYPT(file.content, file.keyword);
  }
  if (file.cipher === 'bacon') {
    return BACON_DECODE(file.content);
  }
  return file.content;
};