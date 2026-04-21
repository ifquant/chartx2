# 0188 - 抽出 Chart Point Count Use-Case

## 背景

`chart-harness` 的 `getPointCount()` 仍然直接遍历 source registry：

- 先从主序列拿 logical length。
- 再判断当前 source 是不是 active main-series。
- active main-series 用 chart context 中已经构建好的 rows。
- 其他 source 重新通过 store materialize rows。
- 最后把每组 rows 的末尾 index 转成 point count。

这段逻辑服务的是 time-scale、wheel/pan 等交互缩放读模型，不应该继续表现为 harness 自己拥有 source/context traversal policy。

## 改动

- 新增 `calculateChartPointCount`，集中处理 main sequence、active main context rows、secondary/study rows 的 point-count 合并规则。
- `chart-harness.getPointCount()` 现在只负责收集：
  - render coordinator 给出的 main sequence logical length
  - chart context snapshot
  - chart model source list
- 为新 use-case 增加 focused unit tests，覆盖 active main-source 复用 context rows、inactive/non-main source materialize rows、空 rows 和 fractional/sparse index。
- 架构文档补充 point-count read-model 也应继续离开 harness 的方向。

## 为什么没有行为变化

原先的判断规则没有改：

```ts
source.role === "main-series" && mainSourceId === source.id
```

命中 active main source 时仍然使用 chart context 的 `barSequence.bars`，避免重复通过 store materialize；其他 source 仍然调用对应 `store.setData(source.data)`。

最终 logical length 仍然是：

```ts
rows.length === 0 ? 0 : Math.ceil(rows[rows.length - 1]?.index ?? 0) + 1
```

## 这一刀的价值

### 1. harness 少一个读模型算法

`chart-harness` 不再内联 point-count 循环，只保留 adapter 式依赖收集。

### 2. interaction/scale 依赖更稳定

time-scale 和 pointer runtime 仍然通过 `getPointCount` 间接消费结果，但算法已经有独立测试，后续可以继续移动 interaction runtime 时不用重新证明这段 source/context 规则。

### 3. render-state 收口更容易

point-count 既出现在 render-state 方向，也被交互缩放读取。先把算法变成 leaf use-case，可以避免后续 render coordinator 和 input runtime 同时争夺 harness-local helper。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-point-count chart-interaction-handlers chart-scale-commands chart-input-runtime chart-pointer-runtime`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check -- src/lib/chartx/internal/views/chart-harness.ts src/lib/chartx/internal/views/chart-point-count.ts tests/unit/chart-point-count.test.ts docs/chart-workstation-architecture.md tutorials/commit/0188-extract-chart-point-count-use-case.md`

## 还没做

- 没有改 interaction runtime 或 scale command 的行为。
- 没有改 source owner 的 public/internal interface。
- 没有把 render-state 内部的 point-count 准备一起改掉。
