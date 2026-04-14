# 0129: 增加 selection-driven drawing property API

这次继续往真正的 drawing property system 推，但重点不是 UI，而是先把 property inspector 需要的最小运行时 API 立住。

## 之前的问题

上一刀之后，drawing 已经有：

- 共享 property 类型
- 共享 property helper
- snapshot / restore

这说明对象模型已经开始统一。

但如果一个 property system 只能靠：

- `getChartState()`
- 改一份大 snapshot
- 再 `applyChartState()`

去间接更新对象，
那它还不算真正可用的 inspector backend。

property panel 真正需要的是：

- 当前选中对象是谁
- 它现在有哪些 property
- 我改一个 property，能不能直接落回这个对象

## 这次做了什么

### 1. 增加 `PhaseOneDrawingStateSnapshot`

现在显式导出了：

- `PhaseOneDrawingStateSnapshot`

它本质上就是 chart state 里单个 drawing 的快照类型。

这样：

- drawing property 的读模型

第一次有了可以单独引用的稳定类型，而不是只能从整张 chart state 里切一段。

### 2. 增加 selection-driven property API

chart API 新增了两个入口：

- `getSelectedDrawingState()`
- `applySelectedDrawingOptions(...)`

这两条 API 的目标很明确：

- `getSelectedDrawingState()`
  - 给 inspector 读取当前选中 drawing 的完整 property snapshot
- `applySelectedDrawingOptions(...)`
  - 给 inspector 把用户修改直接落回当前选中 drawing

这比绕一圈 chart state 更直接，也更符合 property panel 的工作方式。

### 3. 统一走 `buildDrawingStateSnapshot()`

为了避免：

- `chart state` 一套 snapshot 逻辑
- `selected drawing state` 又一套 snapshot 逻辑

这次把单个 drawing 的读模型统一收成：

- `buildDrawingStateSnapshot()`

现在：

- `buildChartDrawingStateSnapshots()`
- `getSelectedDrawingState()`

都共用这条路径。

这一步很关键，因为 property system 最怕的就是：

- 看起来都叫 snapshot
- 但其实不同入口返回的字段不一致

## 增加了什么验证

这次补了一条 inspector 风格的浏览器契约：

1. 创建一个 `horizontal-line` 和一个 `trend-line`
2. 选中 `horizontal-line`
3. 通过 `getSelectedDrawingState()` 读取 property
4. 通过 `applySelectedDrawingOptions()` 修改 title / magnet policy / magnetEnabled
5. 再选中 `trend-line`
6. 用同一条 API 修改 color / timeMagnetPolicy
7. 最后检查：
   - 当前选中对象的 property snapshot 变了
   - `chart.getChartState().drawings` 里的对象也同步变了

这条测试锁住的是：

- property API 不只是“能读”
- 它已经能作为 inspector backend 驱动对象更新

## 为什么这一步重要

一个对象系统真正开始进入“可编辑”阶段，
通常会经历 3 步：

1. 有对象
2. 有对象属性
3. 有针对“当前选中对象”的直接 property 读写入口

前两步解决的是模型，
第三步解决的才是编辑器工作流。

所以这一步的意义在于：

- drawing property system 第一次不再只服务 snapshot/restore
- 它开始直接服务 selection-driven 编辑流

## 这次仍然没做

这次**没有**做：

- drawing inspector UI
- property 分组和 schema 元数据
- 多选对象的批量 property 编辑
- richer validation / undo / redo
- z-order / grouping / 多选编辑

所以这一步做完后，property system 已经有了 inspector backend，
但还没有真正的面板 UI。

## 验证

本次实际跑过：

```bash
pnpm check
pnpm test:unit
pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "selected drawing state can drive a minimal property inspector flow|chart state snapshots preserve horizontal-line drawing properties|trend-line can override chart-level price magnet settings|trend-line can override chart-level time magnet policy|time magnet policy can snap to the previous bar|time magnet policy can snap to the next bar|time magnet tolerance can disable time snapping without disabling the feature|magnet tolerance can disable price snapping without disabling magnet|time magnet can be disabled independently|magnet honors source filters|drawing magnet can be disabled|snap guide|snaps endpoint prices to nearby bar OHLC levels|move cursor over the nearest endpoint handle|nearest endpoint from the line body" --config /tmp/chartx2.playwright.drawing.config.ts
```

## 一个小知识点

很多系统从“能保存对象”走到“能编辑对象”的关键，不在于再多一个字段，
而在于有没有：

- selection-driven read / write path

因为真正的 property inspector，本质上就是这条路径的 UI 外壳。
