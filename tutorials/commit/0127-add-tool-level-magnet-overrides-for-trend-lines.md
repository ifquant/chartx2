# 0127: 给 trend-line 增加 tool-level magnet override

这次继续把 magnet 从 chart 级推进到 tool 级，不再让所有 drawing 都只能共用一套全局磁吸行为。

## 之前的问题

前面已经把 magnet 做到了 chart 级：

- `magnetEnabled`
- `magnetTolerancePx`
- `magnetSources`
- `timeMagnetEnabled`
- `timeMagnetPolicy`
- `timeMagnetTolerancePx`

这说明 chart 作为整体已经有完整控制面了。

但真正的图表编辑器还有一个更细的边界：

- 某一种 drawing tool，甚至某一条 drawing，本身也应该能局部覆盖这些默认值

否则会有一个很现实的问题：

- 我想全 chart 默认不开价格磁吸
- 但某一条 trend-line 想强制开磁吸

或者：

- 全 chart 的时间磁吸策略是 `next`
- 但某一条线我明确想用 `previous`

如果没有 tool-level override，这种需求就只能靠改全局配置，影响其他 drawing。

## 这次做了什么

### 1. 扩展 `PhaseOneTrendLineDrawingOptions`

现在 trend-line 自己的 options 也支持：

- `magnetEnabled`
- `magnetTolerancePx`
- `magnetSources`
- `timeMagnetEnabled`
- `timeMagnetPolicy`
- `timeMagnetTolerancePx`

这意味着：

- chart 级 magnet 仍然提供默认值
- 但 trend-line 可以声明自己的局部覆盖

### 2. 运行时先合并 drawing override，再做 snapping

这次真正重要的是拖拽路径改了。

`applyDrawingDrag()` 不再直接吃 chart 级 `drawingOptions`，而是先通过：

- `resolveTrendLineDrawingMagnetOptions()`

把：

- chart 全局 magnet 配置
- 当前 trend-line 的局部 override

合成出一份运行时有效配置，再喂给：

- `resolveSnappedDrawingTime()`
- `resolveSnappedDrawingPrice()`

所以这次不是“只是把字段存起来”，而是：

- 它真的进入了实际拖拽和 snapping 行为

### 3. snapshot / restore 也跟着带上 override

既然局部 override 已经是 drawing 的真实语义，
那 chart snapshot 和 template 也要记住这些字段。

现在 trend-line drawing snapshot 会把这批 magnet override 一起写进 `options`，
恢复时也会重新创建出同样的局部行为。

## 增加了什么验证

这次补了两条浏览器契约：

1. 全 chart `magnetEnabled: false`，但 trend-line 局部 `magnetEnabled: true`
   - 把 endpoint 往 `132` 附近拖
   - 断言它仍然会被吸到 `132`

2. 全 chart `timeMagnetPolicy: "next"`，但 trend-line 局部 `timeMagnetPolicy: "previous"`
   - 把 endpoint 拖到两根 bar 中间
   - 断言最终时间落到前一根 bar

这两条测试锁住的是：

- tool-level override 的优先级高于 chart-level 默认值
- 而且优先级不是类型层声明，是真正进入交互路径的

## 为什么这一步重要

chart 级配置能解决“系统默认行为”，
但做成真正的编辑器之后，很快就会碰到：

- 某类 tool 的默认行为不同
- 某一条对象需要特殊交互规则

如果没有 tool-level override，
那系统最后会被逼回：

- 改全局配置
- 或复制一套新 drawing 类型

这两条路都不健康。

所以这一步的意义在于：

- magnet 第一次真正从 chart 级能力，进入了 drawing/tool 级能力

## 这次仍然没做

这次**没有**做：

- horizontal-line 的 magnet override
- tool preset / tool registry
- drawing 级 tooltip 自定义
- z-order / grouping / 多选编辑
- drawing inspector UI

所以这一步做完后，trend-line 已经具备最小局部 magnet 能力，但还没有进入完整的 drawing property system。

## 验证

本次实际跑过：

```bash
pnpm check
pnpm test:unit
pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "trend-line can override chart-level price magnet settings|trend-line can override chart-level time magnet policy|time magnet policy can snap to the previous bar|time magnet policy can snap to the next bar|time magnet tolerance can disable time snapping without disabling the feature|magnet tolerance can disable price snapping without disabling magnet|time magnet can be disabled independently|magnet honors source filters|drawing magnet can be disabled|snap guide|snaps endpoint prices to nearby bar OHLC levels|move cursor over the nearest endpoint handle|nearest endpoint from the line body" --config /tmp/chartx2.playwright.drawing.config.ts
```

## 一个小知识点

很多系统做到一半时，会先有：

- global defaults

但真正变成熟以后，通常还要补：

- object-level override

因为“默认值”解决的是系统一致性，
而“局部 override”解决的才是编辑器的表达力。
