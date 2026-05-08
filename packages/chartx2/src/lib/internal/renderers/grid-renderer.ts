export type GridRendererData = {
  width: number;
  height: number;
  columns: number;
  rows: number;
  lineColor: string;
};

export class GridRenderer {
  public draw(context: CanvasRenderingContext2D, data: GridRendererData): void {
    context.strokeStyle = data.lineColor;
    context.lineWidth = 1;

    for (let column = 0; column <= data.columns; column += 1) {
      const x = Math.round((column / data.columns) * data.width) + 0.5;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, data.height);
      context.stroke();
    }

    for (let row = 0; row <= data.rows; row += 1) {
      const y = Math.round((row / data.rows) * data.height) + 0.5;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(data.width, y);
      context.stroke();
    }
  }
}
