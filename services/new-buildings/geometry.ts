export type Point = [number, number];
export interface PointDraft { x: string; y: string }

export function pointDrafts(points: Point[]): PointDraft[] {
  return points.map(([x, y]) => ({ x: String(Number((x * 100).toFixed(4))), y: String(Number((y * 100).toFixed(4))) }));
}

export function parsePoints(drafts: PointDraft[]): Point[] {
  if (drafts.length < 3 || drafts.length > 30) throw new Error('Укажите от 3 до 30 вершин.');
  return drafts.map(({ x, y }) => {
    const pair = [x, y].map(value => {
      const text = value.trim().replace(',', '.');
      if (!/^(?:\d+|\d*\.\d+)$/.test(text) || Number(text) < 0 || Number(text) > 100) throw new Error('Координаты должны быть числами от 0 до 100 процентов.');
      return Number((Number(text) / 100).toFixed(6));
    });
    return [pair[0], pair[1]];
  });
}

export function pointerPoint(x: number, y: number, bounds: { left: number; top: number; width: number; height: number }): Point {
  if (bounds.width <= 0 || bounds.height <= 0) throw new Error('Изображение ещё не загрузилось.');
  return [x - bounds.left, y - bounds.top].map((value, index) => Number(Math.min(1, Math.max(0, value / (index ? bounds.height : bounds.width))).toFixed(6))) as Point;
}
