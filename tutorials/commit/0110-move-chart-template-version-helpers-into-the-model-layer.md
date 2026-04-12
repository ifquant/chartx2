# 0110: 把 chart template 的 version helper 挪到 model layer

## 背景

上一提交已经给 `chartx2` 加上了第一版：

- `chart-template`
- `version: 1`
- `chart` payload
- `normalize` 入口

但那一版还有一个边界问题：

**template version helper 还放在 harness/view 层。**

这意味着：

- chart runtime 能用
- public API 能用
- 但 model / persistence / future migration 层还不能自然复用

如果后面还要继续做：

- template migration
- non-harness persistence
- workspace / layout template

那么 `create/normalize template` 这种逻辑就不该继续卡在 view 层。

## 主要目标

把 chart template 的 version helper 从 harness 收到 model layer，同时保持现有 public API 不变。

## 改动概览

1. 新增 model-layer 通用 template 类型
   - `ChartTemplateV1<TChartState>`
   - `VersionedChartTemplateInput<TChartState>`

2. 新增 model-layer helper
   - `createVersionedChartTemplate()`
   - `normalizeVersionedChartTemplate()`

3. harness 改成只做 phase-one 具体别名
   - `PhaseOneChartTemplateV1`
   - `PhaseOneChartTemplateInput`
   - 通过 model helper 完成 create / normalize

4. unit test 改成直接验证 model helper
   - 说明 template version 逻辑不再只是 view 私有实现

5. 文档同步更新
   - gap checklist 明确记录：template normalize/create 已经进入 model layer

## 关键知识

### 1. 为什么这一步重要

`versioned template` 本质上是 persistence schema，不是绘图逻辑。

所以它更适合挂在：

- model layer
- persistence layer
- migration layer

而不是挂在：

- harness
- canvas runtime
- 某个具体 demo chart implementation

如果边界放错，后面每次做 persistence 扩展都会反向依赖 view 层。

### 2. 为什么这里做成泛型

当前只有：

- `PhaseOneChartStateSnapshot`

但以后完全可能出现：

- 更宽的 chart state
- multi-chart layout state
- workspace state

所以 model helper 用：

- `ChartTemplateV1<TChartState>`

而不是直接写死 `PhaseOneChartStateSnapshot`。

这能让 template version helper 先成为稳定基础设施，再让具体 chart runtime 往上套。

### 3. 这一步和上一提交的区别

上一提交解决的是：

- “有没有 versioned template 边界”

这一次解决的是：

- “这个边界放在哪一层才对”

前者解决功能缺口，后者解决架构位置。

## 补充知识

### 补充 1：为什么 public API 不需要变化

因为外部用户关心的是：

- `getChartTemplate()`
- `applyChartTemplate()`

不是 helper 在 model 还是 view。

所以这次虽然是结构重构，但 public API 保持不变。

### 补充 2：为什么 normalize 仍然保留对 raw state 的兼容

因为当前 repo 内部和测试里，历史调用还很多是：

- raw chart state

如果立刻只接受 versioned template，会把结构收口变成大范围破坏性迁移。

所以当前 normalize 仍然允许：

- raw legacy state
- template v1

这是合理的过渡策略。

## 验证

- `pnpm check`
- `pnpm test`

## 未覆盖项

- template migration 还没有超出 `legacy raw state -> v1` 的范围
- workspace / multi-chart / drawings 仍未进入 template schema
- template serialization stability 还没有独立的 golden contract 测试
