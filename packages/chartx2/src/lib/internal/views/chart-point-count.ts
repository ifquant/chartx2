type IndexedRow = {
  index: number;
};

type PointCountSource = {
  id: string;
  role: string;
  data: any;
  store: {
    setData(data: any): readonly IndexedRow[];
  };
};

export function calculateChartPointCount(params: {
  mainSequenceLogicalLength: number;
  mainSourceId: string | null;
  contextRows: readonly IndexedRow[];
  sources: readonly PointCountSource[];
}): number {
  let pointCount = params.mainSequenceLogicalLength;

  for (const source of params.sources) {
    const rows =
      source.role === "main-series" && params.mainSourceId === source.id
        ? params.contextRows
        : source.store.setData(source.data);
    const logicalLength =
      rows.length === 0 ? 0 : Math.ceil(rows[rows.length - 1]?.index ?? 0) + 1;
    pointCount = Math.max(pointCount, logicalLength);
  }

  return pointCount;
}
