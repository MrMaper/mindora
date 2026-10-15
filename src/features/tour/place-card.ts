export type TourHole = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const EDGE = 12;
const GAP = 14;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Keep the tooltip fully inside the viewport, near the highlight hole. */
export function placeTourCard(
  hole: TourHole | null,
  cardW: number,
  cardH: number,
  vw: number,
  vh: number,
  rtl: boolean,
): { top: number; left: number } {
  if (!hole) {
    return {
      top: Math.max(EDGE, (vh - cardH) / 2),
      left: Math.max(EDGE, (vw - cardW) / 2),
    };
  }

  const spaceBelow = vh - (hole.top + hole.height) - EDGE;
  const spaceAbove = hole.top - EDGE;
  const spaceEnd = rtl
    ? hole.left - EDGE
    : vw - (hole.left + hole.width) - EDGE;

  let top: number;
  let left: number;

  if (spaceBelow >= cardH + GAP || spaceBelow >= spaceAbove) {
    top = hole.top + hole.height + GAP;
    left = rtl ? hole.left + hole.width - cardW : hole.left;
  } else if (spaceAbove >= cardH + GAP) {
    top = hole.top - cardH - GAP;
    left = rtl ? hole.left + hole.width - cardW : hole.left;
  } else if (spaceEnd >= cardW + GAP) {
    top = hole.top;
    left = rtl
      ? hole.left - cardW - GAP
      : hole.left + hole.width + GAP;
  } else {
    top = clamp(hole.top + 24, EDGE, vh - cardH - EDGE);
    left = clamp(
      rtl ? hole.left + hole.width - cardW : hole.left,
      EDGE,
      vw - cardW - EDGE,
    );
  }

  return {
    top: clamp(top, EDGE, Math.max(EDGE, vh - cardH - EDGE)),
    left: clamp(left, EDGE, Math.max(EDGE, vw - cardW - EDGE)),
  };
}
