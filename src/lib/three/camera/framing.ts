const DEG_TO_RAD = Math.PI / 180;

/** Distance at which a vertical extent `height` exactly fills a perspective view of `fovDeg`. */
export function distanceToFitHeight(height: number, fovDeg: number): number {
  return height / 2 / Math.tan((fovDeg * DEG_TO_RAD) / 2);
}

/** Distance at which a width x height rectangle fits the view for the given aspect (width / height). */
export function distanceToFit(width: number, height: number, fovDeg: number, aspect: number): number {
  return Math.max(distanceToFitHeight(height, fovDeg), distanceToFitHeight(width / aspect, fovDeg));
}
