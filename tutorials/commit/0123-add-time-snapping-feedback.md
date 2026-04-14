# 0123: 给 trend-line drag 补 time snapping feedback

这次没有继续扩 magnet source，也没有去做 time snapping 的复杂配置面。

这刀做的是更直接的一件事：

- 把原本隐含存在的“按 bar 时间槽吸附”变成可见反馈

## 背景

在当前 chartx2 里，trend-line endpoint 的时间其实一直不是完全自由的。

拖动时，endpoint time 会落到最近的 axis bar 上。

问题不是“有没有 time snapping”，而是：

- 用户几乎看不见这件事

上一刀之后，price magnet 已经有：

- pane 内水平虚线
- 价格轴 magnet label

但 time 这一维还是隐形的。

## 这次做了什么

### 1. snap guide 现在同时支持 price 和 time

原来的 `drawingSnapGuide` 只够表达：

- 某个 pane
- 某个 price

现在改成同时能表达：

- `price`
- `time`

这样一来，同一套 runtime state 就能驱动：

- 横向的价格 guide
- 纵向的时间 guide

而不是再为 time snapping 单独造一套临时状态对象。

### 2. 增加 time snapping 容差

这次没有把 time snapping 做成“拖到任何位置都始终高亮最近 bar”。

那样太吵，而且会让用户感觉整张图总在抢控制权。

所以现在加了一层最小容差：

- 只有当拖拽点足够接近某个 bar 的时间槽
- 才显示 time snapping feedback

也就是说：

- endpoint 仍然会落到最近 bar 时间
- 但只有接近到一定程度时，才把这种吸附显式画出来

这样交互观感更像 assist，而不是噪音。

### 3. 在 pane 内补一条竖向时间 guide

当 time snapping 命中时，现在会在当前 pane 内画：

- 一条竖向虚线

这样用户可以直接看见：

- 当前 endpoint 对齐的是哪根 bar

### 4. 在 time axis 补 magnet label

除了 pane 内的竖线，现在 time axis 也会出现一个 magnet label。

它和 price axis 的 magnet label 是同一路径：

- 同样使用 drawing 自身颜色
- 同样是 runtime-only

这样拖拽时，用户不仅知道“吸到了某个时间槽”，还能直接读出那根 bar 的时间标签。

## 为什么这一步值得单独做

因为在图表编辑器里，price snapping 和 time snapping 其实是两条不同感知线：

- price snapping 解决“纵向对齐到什么价位”
- time snapping 解决“横向对齐到哪根 bar”

如果只把 price 反馈做完整，而 time 仍然隐形，用户会觉得这套 magnet 还是“只做了一半”。

## 这次仍然没做

这次**没有**做：

- time magnet 的独立 enable/disable
- time snapping source 或策略配置
- 多 pane 全局时间 guide 的更复杂呈现
- time snapping tooltip
- 时间/价格双轴同时更丰富的 magnet UI

所以这次只是把 time snapping 从“隐性行为”推进到“可见反馈”，还不是完整可配置版 time magnet 系统。

## 验证

本次实际跑过：

```bash
pnpm check
pnpm test:unit
pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "magnet honors source filters|drawing magnet can be disabled|snap guide|snaps endpoint prices to nearby bar OHLC levels|move cursor over the nearest endpoint handle|nearest endpoint from the line body" --update-snapshots --config /tmp/chartx2.playwright.drawing.config.ts
```

## 一个小知识点

很多编辑器交互里，“功能已经存在”并不等于“用户真的拥有它”。

如果用户看不见反馈，那这项能力通常只能算：

- hidden behavior

而不是：

- usable interaction
