export type FloatingAnchor = { x: number; y: number };

export type FloatingPlacement = { left: number; top: number };

const DEFAULT_OFFSET = 14;
const DEFAULT_MARGIN = 10;

/**
 * Place a floating panel near the cursor, flipping to the opposite side when near viewport edges.
 * Never shrinks content; only repositions.
 */
export function computeFloatingPlacement(
  anchor: FloatingAnchor,
  size: { width: number; height: number },
  viewport: { width: number; height: number },
  offset = DEFAULT_OFFSET,
  margin = DEFAULT_MARGIN,
): FloatingPlacement {
  const { x, y } = anchor;
  const { width, height } = size;
  const vw = viewport.width;
  const vh = viewport.height;

  let left = x + offset;
  let top = y + offset;

  if (left + width + margin > vw) {
    left = x - width - offset;
  }
  if (left < margin) {
    left = margin;
  }
  if (left + width + margin > vw) {
    left = Math.max(margin, vw - width - margin);
  }

  if (top + height + margin > vh) {
    top = y - height - offset;
  }
  if (top < margin) {
    top = margin;
  }
  if (top + height + margin > vh) {
    top = Math.max(margin, vh - height - margin);
  }

  return { left, top };
}
