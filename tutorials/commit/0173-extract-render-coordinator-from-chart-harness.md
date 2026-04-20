# 0173 - 从 Chart Harness 抽出 Render Coordinator

## 背景

上一刀已经把 source、pane、drawing 三条 ownership 线收成独立 owner，`chart-harness` 不再那么像“什么都自己管”的运行时总控。但当时还剩下一块非常重的 fanout cluster：整条 frame render 主链。

这条主链之前仍然卡在 `chart-harness` 里，主要包括：

- `render()`
- `renderSeriesSource()`
- `buildMainBarSequence()`
- `buildReadout()` / `buildRawReadout()`
- `buildReadoutSeriesForPrimary()` / `buildReadoutSeriesForPane()`
- `formatSeriesReadoutValueForState()`

为什么这块必须作为一整刀来抽，而不是继续拆小 helper？

因为这里的问题已经不再是“某个函数太长”，而是 orchestration ownership 还在 harness 本体里。只要 frame pass、readout、axis dispatch、render tail 还在 harness 里拼接，`chart-harness` 就还不是 adapter，而只是一个把 owner 接好之后继续自己当导演的大类。

## 改动

- 新增 `src/lib/chartx/internal/views/chart-render-coordinator.ts`。
- 把 frame render 主链的组合层收进这个 coordinator：
  - main bar-sequence 选择
  - readout series 组装
  - raw readout / formatted readout 组装
  - primary / secondary pane render orchestration
  - axis render dispatch
  - render tail publish
- `chart-harness.ts` 现在只保留 render coordinator 的装配和方法委托，不再自己内联整个 frame pass。
- 补了 `tests/unit/chart-render-coordinator.test.ts`，锁住：
  - active main source 复用 chart context 的 bar sequence
  - source mismatch 时会触发 bar-sequence rebuild
  - empty plot 分支会走空图 frame，并且不会发布 readout

## 这一刀真正解决了什么

### 1. render 主链终于不再是 harness-local procedure

之前虽然很多 leaf use-case 已经抽出去了，例如：

- render state
- pane render
- axis render
- render surface
- render tail

但这些只是“工具件”被拆出去了，真正把它们编排起来的人还是 harness。也就是说，复杂度只是从“逻辑实现”变成了“逻辑调度”，但 ownership 没变。

这次把调度权也挪进 render coordinator，才算真正把 render 主链从 harness 身上拿走。

### 2. 这一步让后续 adapter-shell 收口更现实

当 source / pane / drawing / render 四条主线都不再由 harness 自己持有时，剩下的 `chart-harness` 更容易继续压成：

- composition root
- invalidation / render trigger adapter
- canvas lifecycle shell
- public API handoff

这就是我们一开始说的目标：不是单纯把文件变短，而是把它降级成一个薄壳。

### 3. 这里不能拆成 primary render owner 和 secondary render owner

这次故意没有把 primary pane render 和 secondary pane render 拆成两个 owner。原因是当前这两个分支仍共享：

- 同一帧的 render pass
- 同一个 `TimeScale`
- 同一个 active pane 判定
- 同一个 readout / axis / tail publish 时序

如果现在强拆，只会把一条本来统一的 frame pass 人为撕成两半，接口数量会变多，但边界不会更真。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-render-coordinator chart-render-state chart-pane-render chart-axis-render chart-render-tail chart-readout chart-readout-series`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 还没做

- `chart-harness` 里仍然还有 adapter-shell cleanup，没有进入最后的极薄壳状态。
- render coordinator 现在已经是组合层，但还没有把更上层的 invalidation policy 一并抽出去。
- restore/public shell 的最终收口还没做，后面仍然需要再看一轮剩余的 harness-local bookkeeping。
