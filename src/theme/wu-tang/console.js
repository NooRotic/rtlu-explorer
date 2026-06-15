// Wu-specific console easter-egg content. Data only — the engine (consoleEgg.js)
// applies styling and wiring. No verse text: original aphorisms in the site's voice.
export const wuConsole = {
  title: 'SHAOLIN OBSERVATORY',
  intro: [
    "I see you're here for more knowledge.",
    'The Wu is all-encompassing.',
    'C.R.E.A.M.  Code Rules Everything Around Me.',
    'the cipher responds. type  wu.help()',
  ],
  ascii: String.raw`
   __        __
   \ \  /\  / /
    \ \/  \/ /
     \  /\  /
      \/  \/
  S H A O L I N   O B S E R V A T O R Y
`,
  aphorisms: [
    'The cipher has no edges. Every node is a doorway.',
    'Knowledge is the sun. Wisdom is the orbit it pulls.',
    'Supreme mathematics: a reference is a relationship that kept its receipts.',
    'Nothing is hidden from the one who maps the whole.',
    'The graph is the work. The names were always the point.',
    'Build like the lab: every loop deliberate, every node earned.',
  ],
  help: [
    { cmd: 'wu.wisdom()', desc: 'a gem from the lab' },
    { cmd: 'wu.cipher()', desc: 'redraw the mark' },
    { cmd: 'wu.stats()', desc: 'the numbers behind the galaxy' },
    { cmd: 'wu.help()', desc: 'these commands' },
  ],
  numbersUnits: { entities: 'entities', links: 'connections', docs: 'documents' },
  statsTail: 'in the lab.',
  creed: 'C.R.E.A.M.  Code Rules Everything Around Me.',
};
