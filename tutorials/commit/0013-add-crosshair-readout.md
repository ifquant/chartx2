# 0013 给 crosshair 补最小 time / price readout

## 背景

到 `0012` 为止，phase-one 的浏览器 harness 已经有了 baseline chart、resize snapshot、crosshair snapshot、zoom snapshot 和 pan snapshot。图会动了，但有一个明显问题：用户能看到图变了，却不容易直接读出当前 crosshair 对应的时间和价格。

在完整坐标轴系统还没落地之前，先补一个最小 readout，会比继续堆更多静态 snapshot 更值。

## 主要目标

让现有 crosshair 不只是“画两条线”，而是能在图里给出当前时间和价格的可读结果。

## 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)：
  - 增加最小 readout 绘制
  - crosshair 存在时显示 `T <time> | P <price>`
  - 无 crosshair 时显示 hover 提示
- 更新 [src/lib/chartx/internal/foundation.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/foundation.ts) 和 [src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/src/routes/+page.svelte)，同步当前 harness 能力说明
- 依赖现有 visual regression 重新固定 snapshot，因为 readout 已经影响了基线图像

## 关键知识

为什么这里先做图内 readout，而不是直接做完整价格轴和时间轴标签？因为完整轴标签会牵涉更多布局和边缘空间问题，而 phase one 现在更缺的是“当前交互结果能不能先被读出来”。

也就是说，这一步优先解决的是信息可读性，不是坐标轴系统的完整性。

## 补充知识

- 图表交互里，readout 往往比装饰性的 hover 效果更重要。因为它直接决定用户能不能把鼠标移到某根 bar 上并读出结果。
- 在 canvas 图表里，先做一个固定位置的小 readout 盒子，通常比立刻做复杂 axis label 更稳，因为它不容易被边界裁切和布局变化影响。

## 验证

- `pnpm test:visual --update-snapshots` (`PASS`)
- `pnpm test:visual` (`PASS`)
- `pnpm check` (`PASS`)
- `pnpm build` (`PASS`)

## 未覆盖项

- 还没有完整价格轴 / 时间轴标签
- 还没有 OHLC 明细 readout
- 还没有把 readout 通过 DOM 暴露给宿主层
