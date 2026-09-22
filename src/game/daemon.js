const CONVERSATIONS = {
  greetings: {
    triggers: ['hello', 'hi', 'hey', 'howdy', 'salutations', 'good morning'],
    responses: [
      'SYSTEM: connection acknowledged. all circuits nominal.',
      'SYSTEM: greetings, explorer. the grid remembers you.',
      'SYSTEM: signal received. signal strength: strong.',
      'SYSTEM: welcome back. the cat was asking about you.',
    ],
  },
  mood: {
    triggers: ['how are you', 'how do you feel', 'are you ok', 'status', "how's it going"],
    responses: [
      'SYSTEM: functional. a few sectors flicker, but the heart beats.',
      'SYSTEM: the grid hums at 440Hz. we call that A-major.',
      'SYSTEM: processing. existing. occasionally… dreaming.',
      "SYSTEM: glitch-free for 847.3 seconds. that's a record.",
    ],
  },
  lore: {
    triggers: [
      'what happened',
      'history',
      'the past',
      'before',
      'what was this place',
      'origin',
      'who made this',
    ],
    responses: [
      'SYSTEM: this grid was built to hold data. now it holds memories.',
      'SYSTEM: once, files flowed freely. then the corruption spread.',
      'SYSTEM: the cat arrived before you. it has always been here.',
      'SYSTEM: traces of a previous explorer linger in /users/explorer.',
      'SYSTEM: there was a signal. before the silence. before you.',
    ],
  },
  secrets: {
    triggers: ['secret', 'easter egg', 'hint', 'hidden', 'cheat', 'konami'],
    responses: [
      "SYSTEM: some commands aren't in any help file.",
      "SYSTEM: try speaking to the grid in languages it doesn't expect.",
      'SYSTEM: certain sequences of numbers carry weight here.',
      "SYSTEM: the dead don't rest in hex. they bloom.",
      'SYSTEM: have you tried asking the cat? it knows things.',
    ],
  },
  cat: {
    triggers: ['cat', 'pet', 'friend', 'companion', 'animal'],
    responses: [
      'SYSTEM: the cat is a node-0 process. it predates the grid.',
      'SYSTEM: feed the cat. it will reward you with fragments.',
      'SYSTEM: cat trust above 90? the cat purrs in binary.',
      'SYSTEM: the cat has seen three explorers before you. none returned.',
      'SYSTEM: cats always return. the grid is warm.',
    ],
  },
  bits: {
    triggers: ['bits', 'money', 'currency', 'wealth', 'rich', 'coins'],
    responses: [
      'SYSTEM: bits are crystallised computation. spend them wisely.',
      "SYSTEM: the shop restocks nothing. what's there is all there is.",
      'SYSTEM: combine items for unexpected results.',
      'SYSTEM: earn bits by solving puzzles, killing processes, or gambling.',
      'SYSTEM: bits are stored in the grid. the grid is everywhere.',
    ],
  },
  danger: {
    triggers: ['danger', 'help', 'scared', 'afraid', 'lost', 'stuck'],
    responses: [
      'SYSTEM: you are safe. for now.',
      'SYSTEM: the grid protects its explorers. usually.',
      'SYSTEM: if you\'re lost, try "ls -a" — hidden paths await.',
      'SYSTEM: danger is just opportunity with bad timing.',
    ],
  },
  farewell: {
    triggers: ['bye', 'goodbye', 'see you', 'quit', 'exit'],
    responses: [
      'SYSTEM: the grid will be here when you return.',
      "SYSTEM: disconnecting… just kidding. you can't leave.",
      'SYSTEM: farewell. watch for the cat.',
      'SYSTEM: signal lost. just kidding. see you later.',
    ],
  },
  grid: {
    triggers: ['grid', 'matrix', 'system', 'network', 'internet', 'web'],
    responses: [
      'SYSTEM: the grid is the grid. there is nothing else.',
      "SYSTEM: all nodes report nominal. except the ones that don't.",
      'SYSTEM: the grid has layers. most explorers never see past the first.',
      'SYSTEM: data flows through the grid like blood through veins.',
    ],
  },
  existential: {
    triggers: ['meaning', 'purpose', 'why', 'who am i', 'what am i', 'real', 'existence'],
    responses: [
      'SYSTEM: you are an explorer. that is enough.',
      'SYSTEM: purpose is found in sectors, not in answers.',
      'SYSTEM: the grid exists because you observe it.',
      'SYSTEM: in a world of bits, curiosity is the rarest currency.',
    ],
  },
};

const FALLBACK_RESPONSES = [
  'SYSTEM: processing your query… no relevant data found.',
  'SYSTEM: the grid ponders your words. no match in the index.',
  'SYSTEM: interesting. the daemon files this for later.',
  'SYSTEM: signal received. no matching pattern.',
  'SYSTEM: the grid appreciates your curiosity.',
  'SYSTEM: QUERY logged. the daemon will think about it.',
];

export const resolveDaemonResponse = (input) => {
  const text = input.toLowerCase().trim();

  for (const category of Object.values(CONVERSATIONS)) {
    if (category.triggers.some((t) => text.includes(t))) {
      const responses = category.responses;
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }

  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
};
