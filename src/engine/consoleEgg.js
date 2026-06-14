// src/engine/consoleEgg.js
// Console easter egg — content-driven, so any artist theme can supply the words. The
// theme provides `content`; this prints a styled banner and mounts the API as `target.wu`
// (the `wu` global name is fixed today; a future second artist would parameterize it).
// Every command RETURNS its string and also logs it, so it is unit-testable without
// scraping console. Idempotent per target (guards against React StrictMode's double-
// invoke). No alert(), no overriding native console methods — it only ADDS a banner + target.wu.
export function installConsoleEgg({ content, stats, accent = '#E8B306', target = globalThis, logger = console } = {}) {
  if (target.wu) return target.wu; // already installed (StrictMode-safe)

  let idx = 0;
  const u = content.numbersUnits;
  const n = (v) => (v ?? 0).toLocaleString();

  const fmtStats = (s) =>
    `${n(s?.entities)} ${u.entities}. ${n(s?.links)} ${u.links}. Drawn from ${n(s?.docs)} ${u.docs} ${content.statsTail}`;

  const help = () => {
    const body = content.help.map((h) => `  ${h.cmd.padEnd(13)} ${h.desc}`).join('\n');
    const out = `the cipher responds:\n${body}`;
    logger.log(out);
    return out;
  };
  const wisdom = () => {
    const out = content.aphorisms[idx++ % content.aphorisms.length];
    logger.log(out);
    return out;
  };
  const cipher = () => {
    const out = `${content.ascii}\n${content.creed}`;
    logger.log(out);
    return out;
  };
  const statsCmd = () => {
    const out = fmtStats(stats);
    logger.log(out);
    return out;
  };

  const api = { help, wisdom, cipher, stats: statsCmd };

  // Banner — gold on the void, monospace. One log for title+intro, one for the mark.
  const css = `color:${accent}; font-family:monospace; font-size:12px; line-height:1.5;`;
  logger.log(`%c${content.title}\n\n${content.intro.join('\n')}`, css);
  logger.log(`%c${content.ascii}`, `color:${accent}; font-family:monospace;`);

  target.wu = api;
  return api;
}
