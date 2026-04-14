# 0128: 把 tool-level magnet override 收成共享 drawing property system

这次不是继续给某一种 drawing 再单独加字段，而是把已经在 `trend-line` 上跑通的 magnet override，收成一套共享的 drawing property system。

## 之前的问题

上一刀之后：

- `trend-line` 已经有 tool-level magnet override

但结构上仍然有明显问题：

- magnet override 的字段和逻辑主要长在 `trend-line` 身上
- `horizontal-line` 还没有进入同一套 property 模型
- snapshot/restore 的 property 读写也还不是统一路径

这说明功能已经开始有了，但对象模型还没有真正收口。

## 这次做了什么

### 1. 抽出共享的 drawing magnet property 类型

现在新增了共享的：

- `PhaseOneDrawingMagnetOverrides`
- `DrawingMagnetOverrideState`

然后让：

- `PhaseOneHorizontalLineDrawingOptions`
- `PhaseOneTrendLineDrawingOptions`

都复用这套 magnet property 定义。

这样以后再加新的 drawing，就不是再复制一套 magnet 字段，而是复用同一层对象属性。

### 2. 抽出共享的 property 处理函数

这次新增了 3 个关键 helper：

- `normalizeDrawingMagnetOverrideOptions()`
- `applyDrawingMagnetOverrideOptions()`
- `resolveDrawingMagnetOptions()`

它们分别负责：

- 把输入 options 规整成运行时状态
- 把局部 property 应用到 drawing descriptor
- 把 chart 默认值和 drawing 局部 override 合成实际生效配置

这样之后：

- `trend-line` 的 drag 路径
- `horizontal-line` / `trend-line` 的 snapshot
- 未来 drawing inspector 或 property panel

都能沿同一套 property system 继续长。

### 3. 把 `horizontal-line` 也拉进这套 property system

虽然 `horizontal-line` 现在还没有像 `trend-line` 那样的拖拽编辑路径，
但它已经进入了同一套 property 模型：

- API options 支持 magnet override
- registry state 支持 magnet override
- snapshot / restore 也会带上这批字段

也就是说，drawing property system 这次第一次真正跨了两类 drawing，
不再只是 `trend-line` 的特例。

## 增加了什么验证

这次新增一条浏览器契约：

1. 创建带 magnet override 的 `horizontal-line`
2. 保存 chart state
3. 清空 drawings
4. 再恢复 chart state
5. 断言恢复后的 `horizontal-line` 仍然保留：
   - `magnetEnabled`
   - `magnetTolerancePx`
   - `timeMagnetEnabled`
   - `timeMagnetPolicy`
   - `timeMagnetTolerancePx`
   - `magnetSources`

这条验证锁住的是：

- `horizontal-line` 已经正式进入共享 property system
- 而不是只在类型定义里多了几个字段

## 为什么这一步重要

很多系统在功能推进时会先出现：

- 一个对象先做通

但如果不及时抽象，
后面就会变成：

- `trend-line` 一套逻辑
- `horizontal-line` 一套逻辑
- 以后每个 drawing 各有一套逻辑

那就不是 property system，而只是“每个对象各自能用”。

这次的价值就在于：

- magnet override 第一次被提升成共享 drawing property 机制

## 这次仍然没做

这次**没有**做：

- `horizontal-line` 的拖拽编辑路径
- drawing inspector UI
- tool preset / tool registry
- richer tooltip / richer handles
- z-order / grouping / 多选编辑

所以这一步做完后，drawing property system 已经有了共享数据与 snapshot 边界，
但交互层仍然主要集中在 `trend-line`。

## 验证

本次实际跑过：

```bash
pnpm check
pnpm test:unit
pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "chart state snapshots preserve horizontal-line drawing properties|trend-line can override chart-level price magnet settings|trend-line can override chart-level time magnet policy|time magnet policy can snap to the previous bar|time magnet policy can snap to the next bar|time magnet tolerance can disable time snapping without disabling the feature|magnet tolerance can disable price snapping without disabling magnet|time magnet can be disabled independently|magnet honors source filters|drawing magnet can be disabled|snap guide|snaps endpoint prices to nearby bar OHLC levels|move cursor over the nearest endpoint handle|nearest endpoint from the line body" --config /tmp/chartx2.playwright.drawing.config.ts
```

## 一个小知识点

很多“对象系统”真正开始成型的标志，不是：

- 第二个对象也能工作

而是：

- 第二个对象开始共用第一套 property 机制

前者只是功能扩张，后者才是模型收口。
