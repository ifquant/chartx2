import { describe, expect, it } from "vitest";

import {
  normalizeVersionedChartTemplate,
  stringifyVersionedChartTemplate,
} from "../../src/lib/chartx/internal/model";

describe("chart template contracts", () => {
  it("keeps a stable v1 JSON serialization contract for chart templates", () => {
    const rawState = {
      options: {
        layout: {
          backgroundColor: "#fffdf7",
          paneBackgroundColor: "#fffaf0",
          gridColor: "rgba(16, 16, 16, 0.08)",
        },
        crosshair: {
          lineColor: "rgba(16, 16, 16, 0.5)",
          pointColor: "#101010",
        },
      },
      timeScale: {
        barSpacing: 12,
        rightOffset: 1,
        visibleLogicalRange: { from: 1, to: 8 },
      },
      priceScale: {
        visibleRange: { minValue: 100, maxValue: 140 },
        scaleSeriesOnly: false,
      },
      panes: [{ height: 112, resizable: true }],
      mainSeries: null,
      series: [
        {
          kind: "line" as const,
          paneIndex: 1,
          options: {
            color: "#7c3aed",
            lineWidth: 3,
          },
          data: [
            { time: 1, value: 101 },
            { time: 2, value: 103 },
          ],
        },
      ],
      studies: [
        {
          type: "moving-average" as const,
          paneIndex: 1,
          seriesOptions: {
            color: "#2563eb",
            lineWidth: 2,
          },
          studyOptions: {
            length: 5,
            inputContextMode: "chart-context" as const,
            requestedSymbol: undefined,
            requestedResolution: undefined,
            requestedSession: undefined,
            requestedTimezone: undefined,
            mergePolicy: "exact" as const,
          },
        },
      ],
    };

    expect(stringifyVersionedChartTemplate(rawState)).toBe(`{
  "kind": "chart-template",
  "version": 1,
  "chart": {
    "options": {
      "layout": {
        "backgroundColor": "#fffdf7",
        "paneBackgroundColor": "#fffaf0",
        "gridColor": "rgba(16, 16, 16, 0.08)"
      },
      "crosshair": {
        "lineColor": "rgba(16, 16, 16, 0.5)",
        "pointColor": "#101010"
      }
    },
    "timeScale": {
      "barSpacing": 12,
      "rightOffset": 1,
      "visibleLogicalRange": {
        "from": 1,
        "to": 8
      }
    },
    "priceScale": {
      "visibleRange": {
        "minValue": 100,
        "maxValue": 140
      },
      "scaleSeriesOnly": false
    },
    "panes": [
      {
        "height": 112,
        "resizable": true
      }
    ],
    "mainSeries": null,
    "series": [
      {
        "kind": "line",
        "paneIndex": 1,
        "options": {
          "color": "#7c3aed",
          "lineWidth": 3
        },
        "data": [
          {
            "time": 1,
            "value": 101
          },
          {
            "time": 2,
            "value": 103
          }
        ]
      }
    ],
    "studies": [
      {
        "type": "moving-average",
        "paneIndex": 1,
        "seriesOptions": {
          "color": "#2563eb",
          "lineWidth": 2
        },
        "studyOptions": {
          "length": 5,
          "inputContextMode": "chart-context",
          "mergePolicy": "exact"
        }
      }
    ]
  }
}`);
  });

  it("rejects unsupported template versions during normalization", () => {
    expect(() =>
      normalizeVersionedChartTemplate({
        kind: "chart-template",
        version: 2,
        chart: {
          options: {
            layout: {},
            crosshair: {},
          },
          timeScale: {
            barSpacing: null,
            rightOffset: 0.8,
            visibleLogicalRange: null,
          },
          priceScale: {
            visibleRange: null,
            scaleSeriesOnly: false,
          },
          panes: [],
          mainSeries: null,
          series: [],
          studies: [],
        },
      } as never),
    ).toThrow("chartx chart template version 2 is not supported");
  });
});
