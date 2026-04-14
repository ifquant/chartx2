# 0125: 增加可配置的 price/time magnet tolerance

这次不是继续加新的 drawing 类型，而是把现有 magnet 的“吸附手感”从写死常量，推进成 chart 级可配置行为。

## 之前的问题

虽然前面已经有：

- `magnetEnabled`
- `timeMagnetEnabled`
- `magnetSources`
- guide / label 可见性

但真正决定“到底多近才吸上去”的两个阈值，仍然写死在内部常量里：

- `DRAWING_PRICE_SNAP_TOLERANCE`
- `DRAWING_TIME_SNAP_TOLERANCE`

这会带来两个问题：

1. 调调用侧没法调交互手感
2. 想验证“功能还开着，但实际上不吸附”时，只能靠关总开关，没法单独收紧 tolerance

## 这次做了什么

### 1. 把 price/time tolerance 提升到 chart options

现在 `drawings` 配置下面新增：

- `magnetTolerancePx`
- `timeMagnetTolerancePx`

语义很直接：

- `magnetTolerancePx`
  - 控制价格吸附的像素容差
- `timeMagnetTolerancePx`
  - 控制时间吸附的像素容差

默认值仍然和原来的内部常量一致，所以这次不会改变默认交互手感。

### 2. snapping helper 不再依赖写死常量

`resolveSnappedDrawingPrice()` 和 `resolveSnappedDrawingTime()` 现在都接收 tolerance 参数：

- price snapping 是否命中，看 `magnetTolerancePx`
- time snapping 是否命中，看 `timeMagnetTolerancePx`

这样一来：

- `magnetEnabled: true` 但 `magnetTolerancePx: 0`
  - 价格磁吸逻辑仍然存在
  - 但除非刚好完全重合，否则不会吸住
- `timeMagnetEnabled: true` 但 `timeMagnetTolerancePx: 0`
  - 时间磁吸也仍然存在
  - 但不会轻易吸到最近 bar

这比直接关开关更精细，也更接近真正可调的编辑器交互面。

## 增加了什么验证

这次补了两条浏览器契约：

1. `timeMagnetEnabled: true` + `timeMagnetTolerancePx: 0`
   - 拖 trend-line 到半个 bar 的位置
   - 断言至少一个 endpoint time 不是整数 bar time

2. `magnetEnabled: true` + `magnetTolerancePx: 0`
   - 把 endpoint 往接近 `132` 的位置拖
   - 断言不会被吸到 `132`

这两条验证锁住的是：

- 功能开关还开着
- 但 tolerance 已经能真正改变行为

## 为什么这一步重要

很多交互系统做到后面，决定“专业感”的不是有没有功能，而是：

- 手感能不能调
- 调整是不是只改配置，不改代码

把 tolerance 提到 chart options 以后，后面要做：

- 不同产品预设
- 不同 drawing tool 的默认磁吸强度
- 更严格或更宽松的交互模式

才有现实落点。

## 这次仍然没做

这次**没有**做：

- drawing 级别的局部 tolerance override
- 不同 magnet source 使用不同 tolerance
- 更丰富的 magnet tooltip
- time magnet source/policy
- z-order / grouping / 多选编辑

所以这一步是把 magnet 从“能开关”推进到“能调手感”，但还不是完整的专业 drawing assist 系统。

## 验证

本次实际跑过：

```bash
pnpm check
pnpm test:unit
pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "time magnet tolerance can disable time snapping without disabling the feature|magnet tolerance can disable price snapping without disabling magnet|time magnet can be disabled independently|magnet honors source filters|drawing magnet can be disabled|snap guide|snaps endpoint prices to nearby bar OHLC levels|move cursor over the nearest endpoint handle|nearest endpoint from the line body" --config /tmp/chartx2.playwright.drawing.config.ts
```

## 一个小知识点

很多“专业编辑器”的控制面，最终都会从：

- `enabled / disabled`

往前走一步，变成：

- `enabled + policy + tolerance`

因为真正决定交互体验的，往往不是有没有能力，而是命中阈值和规则。
