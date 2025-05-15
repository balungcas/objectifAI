export interface DetectedObject {
  box: [number, number, number, number]; // [x1, y1, x2, y2] - relative coordinates (0-1)
  class: string;
  confidence: number;
}
