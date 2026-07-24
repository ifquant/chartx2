# 冻结 row-time focus public seam 实施计划

## 背景

alpha2 Round 6 W4 需要把 canonical fill 的时间定位交给 chartx2 的共享时间轴。
在开始实现前，必须先冻结最小 public seam，避免 alpha2 通过 logical index、
marker 或私有 chart internals 伪造定位。

## 主要目标

记录 `PhaseOneTimeScaleApi.focusTime(...)` 的 owner、输入输出、失败边界和验证门槛，
让后续实现只增加时间轴定位能力，不改变既有公开 API 的裁决。

## 改动概览

- 冻结计划：`focusTime` 由 time scale 持有，`axisBars` 是唯一 active-axis authority；
- 保留 Sol high 的初始 NO-GO、修订项和最终 GO 审查历史；
- 校正教程序号：本计划提交为 0393，实际实现固定使用 0394；
- 明确本提交仅写文档，不实现 resolver、public export、owner wiring 或 packed probe。

## 关键知识

图表的时间轴是 chart-level shared state。把某一笔成交时间映射为 viewport，必须由
`TimeScale` 读取当前 active axis；宿主只提供 canonical time 和其业务容忍度，不能
自己计算 logical index，否则会在 pane、chart type 或未来多 source 组合时形成第二套
图表状态机。

## 补充知识

1. 计划提交也需要占用独立教程编号。这样 implementation 的教程、验证与代码 commit
   不会被预先写入的文档编号混淆。
2. 保留 NO-GO 到 GO 的审查链，比只保留最终结论更有用：后来人能知道为何
   `maxDistance`、fail-closed result 和 packed browser gate 是冻结约束。

## 验证

```bash
git diff --check
wc -l docs/alpha2-row-time-focus-public-seam-plan.md
git diff -- docs/alpha2-row-time-focus-public-seam-plan.md \\
  docs/alpha2-row-time-focus-public-seam-plan-review.md \\
  tutorials/commit/0393-freeze-row-time-focus-public-seam-plan.md
```

预期结果：计划不超过 550 行；三份文档的链接、编号和 implementation tutorial 说明一致。
本提交没有源码或 package 变更，因此没有运行 `pnpm check`、测试、打包或 release gate。

## 未覆盖项

- 不实现 `focusTime`、resolver、public barrel、测试或 tarball consumer；这些属于教程
  0394 的后续 implementation commit。
- 不改 alpha2、Tauri/Rust、DataX2、现有 chart public API 或已存在的三个 ahead commits。
