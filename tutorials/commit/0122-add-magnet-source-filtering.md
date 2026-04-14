# 0122: 给 magnet 补 source filtering

这次不是继续扩新的 snapping 几何，而是把第一版 magnet surface 再往前推一步：

- 不再强制永远吸 `OHLC`
- 改成 chart-level 可配置的 magnet sources

## 这次解决的问题

上一刀已经有：

- `magnetEnabled`
- `magnetGuideVisible`
- `magnetLabelVisible`

但还有一个明显问题：

- source 是写死的

也就是：

- 不管调用方想不想吸 `high`
- 想不想只吸 `close`
- 现在都会无差别去找最近的 `open/high/low/close`

这会让 magnet 虽然“可开关”，但还不够“可控”。

## 做了什么

### 1. 给 chart options 加入 magnetSources

现在 `drawings` 下面新增：

- `magnetSources.open`
- `magnetSources.high`
- `magnetSources.low`
- `magnetSources.close`

默认仍然是：

- 四个都开启

所以旧行为不会变。

但如果调用方只想吸 `close`，现在可以这样做：

```ts
chart.applyOptions({
  drawings: {
    magnetSources: {
      open: false,
      high: false,
      low: false,
      close: true,
    },
  },
});
```

### 2. snapping helper 现在会返回命中的 source

之前 helper 只返回：

- `price`
- `snapped`

现在还会返回：

- `source`

也就是：

- `open`
- `high`
- `low`
- `close`

这不是为了炫技，而是为了后面的 UI 和调试能力。

只要 source 进入运行时返回值，后面就能更自然地做：

- 更明确的 label
- 更丰富的 tooltip
- 更复杂的 magnet source UI

### 3. magnet axis label 现在会显示 source

价格轴上的 magnet label 不再只写：

- `MAG 132.00`

现在会写成：

- `MAG HIGH 132.00`

或者：

- `MAG CLOSE 128.00`

这样用户不只是知道“吸到了这个价格”，还知道“吸到的是哪类价位”。

## 增加了什么验证

这次新增了一条浏览器契约：

1. 创建 chart
2. 把 magnet sources 配成只允许 `close`
3. 仍然把 endpoint 拖到靠近 `132` 的位置
4. 断言拖完后没有吸到 `132`

因为在当前 fixture 里：

- `132` 是第一根 bar 的 `high`

所以如果 `high` source 被正确禁用，就不应该再吸到 `132`。

这条测试的意义是：

- 锁住 magnet source filtering 真正控制行为

而不是只改了内部配置对象，结果实际拖拽仍然按原来的 `OHLC` 全开处理。

## 为什么这一步值得先做

因为 magnet 的产品问题通常不是：

- “有没有 snapping”

而是：

- “snapping 到底在吸什么”

用户感知里，吸 `close` 和吸 `high/low` 是两种不同工具。

如果 source 不能控制，magnet 还是会显得太“硬编码”。

## 这次仍然没做

这次**没有**做：

- time snapping
- magnet source 的 UI 面板
- axis 上更丰富的 source 文案/tooltip
- drawing 级局部 source override
- 不同 source 的优先级策略

所以这次做完后，magnet surface 依然是最小可用版，但已经不再是“只能全开 OHLC”的硬编码路径。

## 验证

本次实际跑过：

```bash
pnpm check
pnpm test:unit
pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "magnet honors source filters|drawing magnet can be disabled|snap guide|snaps endpoint prices to nearby bar OHLC levels|move cursor over the nearest endpoint handle|nearest endpoint from the line body" --update-snapshots --config /tmp/chartx2.playwright.drawing.config.ts
```

## 一个小知识点

编辑器里的“开关”通常只能回答：

- 要不要这套能力

但真正让能力变得专业的，往往是第二层：

- 这套能力具体作用在哪些 source 上

所以从产品成熟度看，

- enable/disable 是第一步
- source filtering 往往才是这类辅助能力开始变“可调”的起点
