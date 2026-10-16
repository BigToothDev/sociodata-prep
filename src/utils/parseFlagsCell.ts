function parseFlagsCell(cell: string, options: string[]): { selected: string[]; unknown: string[] } {
  const text = String(cell ?? '').trim();
  if (!text) return { selected: [], unknown: [] };

  const found: { opt: string; pos: number }[] = [];
  let rest = text;

  const sorted = [...options].sort((a, b) => b.length - a.length);
  for (const opt of sorted) {
    const escaped = opt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(^|,\\s*)${escaped}(?=\\s*(,|$))`);
    const m = re.exec(rest);
    if (!m) continue;
    found.push({ opt, pos: text.indexOf(opt) });
    rest = rest.slice(0, m.index) + m[1].replace(/\S/g, '') + ' '.repeat(opt.length) + rest.slice(m.index + m[1].length + opt.length);
  }

  found.sort((a, b) => a.pos - b.pos);
  const unknown = rest.split(FLAGS_DELIMITER).map(s => s.trim()).filter(Boolean);
  return { selected: found.map(f => f.opt), unknown };
}