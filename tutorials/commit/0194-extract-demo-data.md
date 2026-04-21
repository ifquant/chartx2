# 0194 - 抽出 Demo Data 生成

## 背景

`chart-harness` 底部还保留了两个 demo-only helper：

- `buildDemoBars`
- `buildDemoVolumeBars`

它们只服务 `mountPhaseOneChartHarness` 的内置示例，不参与 chart runtime policy。继续放在 harness 里会让 composition root 混入 fixture/data construction 细节。

## 改动

- 新增 `chart-demo-data.ts`，导出 demo OHLC 和 volume 数据生成函数。
- `chart-harness` 改为从新模块导入 demo data helper。
- 删除 harness-local demo data helper。
- 增加 `chart-demo-data.test.ts`，覆盖 deterministic OHLC 样例、时间间隔、high/low 合法性和 volume 推导。
- 架构文档补充 demo data generation 不应继续留在 harness。

## 为什么没有行为变化

算法原样移动：

- demo bars 仍然从 `2025-01-02 09:30 UTC` 开始。
- bar 数量仍然是 42。
- 每根 bar 间隔仍然是 60 秒。
- volume 仍然由 index 周期项和实体长度推导。

`mountPhaseOneChartHarness` 仍然创建同样的 candlestick + volume pane 示例。

## 这一刀的价值

### 1. harness 更像启动壳

内置 demo 的数据构造不再混在 chart runtime 文件底部。

### 2. 示例数据可单独验证

demo 数据虽然不是核心 runtime，但它驱动默认 mount path；独立测试能避免后续改动导致示例退化。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-demo-data`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check -- src/lib/chartx/internal/views/chart-harness.ts src/lib/chartx/internal/views/chart-demo-data.ts tests/unit/chart-demo-data.test.ts docs/chart-workstation-architecture.md tutorials/commit/0194-extract-demo-data.md`

## 还没做

- 没有改 demo chart layout。
- 没有改 public chart API。
- 没有移动 canvas rendering helpers。
