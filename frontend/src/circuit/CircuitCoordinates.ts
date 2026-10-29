export type CircuitXY = [number, number];

export interface CircuitTransform {
  cx: number;
  cy: number;
  scale: number;
  toScene(x: number, y: number): [number, number];
  toProvider(x: number, z: number): [number, number];
}

/**
 * Shared view-space transformation for OpenF1 X/Y coordinates.
 *
 * This preserves the existing 120-unit scene normalization.
 * Provider coordinates are NOT assumed to be GPS coordinates
 * or verified real-world metres.
 *
 * Any future geographic calibration must be applied
 * consistently to track, cars and scenery.
 */
export function getCircuitTransform(
  coordinates: readonly CircuitXY[]
): CircuitTransform {
  if (!coordinates.length) {
    throw new Error("Circuit coordinates are empty.");
  }

  const xs = coordinates.map(p => p[0]);
  const ys = coordinates.map(p => p[1]);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const scale = 120 / Math.max(
    maxX - minX,
    maxY - minY,
    1
  );

  return {
    cx,
    cy,
    scale,

    toScene(x, y) {
      return [
        (x - cx) * scale,
        -(y - cy) * scale
      ];
    },

    toProvider(x, z) {
      return [
        x / scale + cx,
        -z / scale + cy
      ];
    }
  };
}
