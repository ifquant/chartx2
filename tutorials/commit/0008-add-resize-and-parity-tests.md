# 0008 补窄屏 visual baseline 和有限 parity contract tests

## 背景

`0007` 已经把第一层 unit tests 和第一张浏览器 baseline 落下了，但 phase-one checklist 里还空着两块关键测试：

- 至少一张真正有意义的 resize-sensitive snapshot
- 一组有限但高价值的 upstream parity contract tests

如果这两块一直空着，后面继续迁 `lightweight-charts` 时会有两个问题：

- 你不知道缩放到不同布局宽度时，当前 canvas 输出是不是已经悄悄偏了
- 你也不知道自己是在“按 upstream 行为迁移”，还是在不知不觉做成了另一套实现

## 主要目标

继续把 phase-one 的测试层往前推进，但保持范围很窄，只盯当前已经存在的 model/scales/data 和浏览器 harness。

## 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)，让 harness 根据宿主容器宽度计算画布尺寸，而不是一直写死 `960px`
- 更新 [tests/visual/phase-one-harness.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts)，新增窄屏 snapshot `phase-one-harness-narrow.png`
- 新增 [tests/unit/upstream-parity-contracts.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/upstream-parity-contracts.test.ts)，用固定输入/输出锁住 time scale、price scale 和 data ingestion 的当前 contract
- 更新 [docs/phase-one-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/phase-one-checklist.md) 和 [src/lib/chartx/internal/foundation.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/foundation.ts)，同步当前测试进度

## 关键知识

为什么 resize-sensitive snapshot 不能靠“同一张图在不同窗口里拍两次”来凑？因为如果渲染层一直写死固定宽度，那两张图其实不会反映布局变化，只是名字不同而已。

这一步先把 harness 改成读容器宽度，再拍窄屏 baseline，才让 snapshot 真正有测试价值。

## 补充知识

- parity contract tests 不等于镜像 upstream 全套测试。这里更实际的做法，是挑几组高价值固定输入/输出，先锁住不会轻易变的核心数学行为。
- 图表渲染里“响应式”不一定意味着立刻做复杂自动布局。phase one 更重要的是先确认：当可用宽度变小时，当前输出会跟着稳定变化，而不是假装没发生。

## 验证

- `pnpm test:unit` (`PASS`)
- `pnpm test:visual --update-snapshots` (`PASS`)
- `pnpm test:visual` (`PASS`)
- `pnpm check` (`PASS`)
- `pnpm build` (`PASS`)

## 未覆盖项

- 还没有 crosshair 或 viewport update snapshot
- 还没有 public API happy path 的 parity contract tests
- 还没有把 pan / zoom 行为拉进自动测试
