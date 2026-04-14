# 0135: 把 drawing runtime 校验收成共享 validator registry

上一刀已经把 `trend-line` 的 cross-field validation 从 workbench inspector 收进了 runtime。  
但结构上还有一个明显问题：

- 规则已经进入引擎
- 规则入口却还是散在具体 drawing API 里

这意味着以后再加别的 drawing 类型时，很容易又回到：

- 每个 `createXxxDrawing(...)` 自己写一份校验
- 每个 `applyOptions(...)` 再写一份校验

这不是长期结构。

## 这次做了什么

### 1. 新增 model-layer drawing validation 模块

新增文件：

- `src/lib/chartx/internal/model/drawing-validation.ts`

它定义了：

- `DrawingValidationTarget`
- `DRAWING_VALIDATORS`
- `assertDrawingTargetValid(...)`

这里最关键的是，drawing 校验第一次变成了：

- `kind -> validator`

而不是某个 drawing API 私有的 helper。

## 2. 把 horizontal-line 和 trend-line 都接进 registry

现在两种 drawing 都走同一条校验分发：

- `horizontal-line`
  - `price` 必须是 finite
  - `lineWidth >= 1`
- `trend-line`
  - 四个几何值必须 finite
  - `lineWidth >= 1`
  - 端点不能完全重合
  - `startTime < endTime`

这一步的意义不是“加了更多规则”，而是：

- 规则终于开始有统一挂点

## 3. create/apply 两条路径都改走共享 validator

`chart-harness.ts` 里原来 `trend-line` 的几何校验 helper 被移除了。  
现在：

- `createHorizontalLineDrawing(...)`
- `horizontal-line.applyOptions(...)`
- `createTrendLineDrawing(...)`
- `trend-line.applyOptions(...)`

都先构造完整的下一状态，再调用：

- `assertDrawingTargetValid(...)`

这样 create/update 的入口终于不会各长一套规则。

## 4. 补一条 unit contract

新增：

- `tests/unit/drawing-validation.test.ts`

它锁住了 registry 分发的两条最基本路径：

- `horizontal-line` 会拒绝无效 `price/lineWidth`
- `trend-line` 会拒绝重合端点和倒序时间

这条测试的价值是：

- 后面如果有人把 registry 拆坏了
- 不需要等到 Playwright 才发现

## 这一步为什么值钱

因为它把 drawing runtime validation 的问题定义，正式从：

- “某个 drawing 的局部 if/throw”

推进成了：

- “drawing kind 有自己的 validator，runtime 统一分发”

这才是后面继续补：

- 更多 drawing 类型
- 更丰富 geometry 规则
- engine-level validation report
- snapshot/restore 前置校验

时真正可扩展的形状。

## 这次没做什么

- 还没有做完整的 drawing validator registry class
- 还没有给 snapshot/restore 加结构化 validation result
- 也还没有把 workbench UI 的 validation 逻辑和 runtime registry 完全复用成同一套对象

所以这一步是“把挂点立住”，不是“把 validation 系统彻底做完”。
