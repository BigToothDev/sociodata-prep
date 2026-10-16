interface QDef { type: string; crossSet: string; optSet: string }

type SlotParse = | { status: 'none' } | { status: 'ok'; optSet: string } | { status: 'bad' };

function parseSlotHeader(header: string, byQ: Record<string, QDef>, crossHasValue: (setName: string, value: string) => boolean): SlotParse {
  const rm = header.match(/^R_Option \d+:\s*(.*)$/);
  if (!rm) return { status: 'none' };
  const inner = rm[1].trim();

  //Flags: "R_Option N: Q"
  const flagsDef = byQ[inner];
  if (flagsDef) {
    if (flagsDef.type === 'Flags') {
      return {
        status: 'ok',
        optSet: flagsDef.optSet
      };
    }
    return { status: 'bad' };
  }

  //Crossflag: "R_Option N: Q []"
  const im = inner.match(/^(.*?)\s*\[([^\[\]]*)\]\s*$/);
  if (!im) return { status: 'bad' };

  const crossQ = im[1].trim();
  const rowValue = im[2].trim();

  const crossDef = byQ[crossQ];
  if (!crossDef) return { status: 'bad' };

  if (crossDef.type !== 'Crossflag') return { status: 'bad' };

  if (!crossHasValue(crossDef.crossSet, rowValue)) return { status: 'bad' };

  return {
    status: 'ok',
    optSet: crossDef.optSet
  };
}