# 0017 补最小时间轴和价格轴标签

## 背景

到 `0016` 为止，`chartx2` 的 phase-one chart 已经能画图、缩放、平移、crosshair、显示宿主级 OHLC 栏，也支持最小 `update`。但它看起来还不像一个真正的图表软件，因为右侧和底部仍然缺最基本的 axis labels。

所以这一步先不做复杂刻度系统，而是补一层足够稳定的最小轴标签。

## 主要目标

让当前图表拥有：

- 右侧最小价格标签
- 底部最小时间标签

这样当前 phase-one harness 至少具备最基本的“轴感”。

## 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)：
  - 新增最小 `drawPriceAxis`
  - 新增最小 `drawTimeAxis`
  - 复用现有 `PriceScale` / `TimeScale` 的结果生成稳定标签
- 更新 [src/lib/chartx/internal/foundation.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/foundation.ts) 和 [src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/src/routes/+page.svelte)，同步当前能力说明
- 依赖现有 visual regression 重新固定 baseline，因为轴标签会改变画面形态

## 关键知识

为什么这里先做“最小标签”，而不是直接做完整坐标轴刻度算法？因为 phase one 现在更缺的是界面结构和信息层级，而不是刻度策略的全部复杂性。

也就是说，这一步优先解决的是“用户能不能看出哪里是轴、现在的时间和价格大概落在哪”，不是“刻度系统是否已经完整对齐 upstream”。

## 补充知识

- 对 chart UI 来说，哪怕标签还很简化，只要它们稳定地挂在固定区域，整体产品感就会比“只有图和网格”上一个台阶。
- 轴标签越早出现在 visual regression 里，后面做更复杂轴系统时越容易知道自己改坏了哪里。

## 验证

- `pnpm test:visual --update-snapshots` (`PASS`)
- `pnpm test:visual` (`PASS`)
- `pnpm check` (`PASS`)
- `pnpm build` (`PASS`)

## 未覆盖项

- 还没有完整 tick 生成和刻度密度控制
- 还没有 crosshair 对应的轴跟随标签
- 还没有 instrument-aware precision 或时间格式化策略
