# 记录 row-time focus seam closure

## 背景

row-time focus 的实现已经经过一次 fresh review 的 NO-GO 和一笔窄修复。最后需要把
计划、审查和实际提交历史收束为可审计的闭环，避免后来人误把“chartx2 seam 已 GO”理解成
“alpha2 已完成产品接入”。

## 主要目标

- 记录 `b4362000 → 00e6eeb → 13b5c57`、教程 0393–0396 与 NO-GO → fix → GO 链。
- 固定 final review 为 P0=P1=P2=0，并保留 release gate、mutation、temp cleanup 与
  tarball hash 证据。
- 明确 source compatibility 的唯一显式迁移点，以及 alpha2 接下来仍必须完成的 consumer
  gate。

## 关键知识

chartx2 的 packed consumer gate 证明的是发布包的 public contract；它不证明 alpha2 的
canonical fill 时间单位、curve tolerance 或 UI 行为。后一层必须由 alpha2 从
`@chartx2/library` 消费同一 tgz 来验证，不能借用 internal import 或 private logical math。

## 验证

```bash
rg -n 'b4362000|00e6eeb|13b5c57|039[3-6]|P0 = 0|ed3dc752|d03227aa' \
  docs/alpha2-row-time-focus-public-seam-*.md \
  tutorials/commit/0396-record-row-time-focus-seam-closure.md
git diff --check
git status --short --branch
```

预期结果：只有本 closure 允许的 plan/review/closure/tutorial 文档变更；不运行 build
或 release command，也不生成或修改 tgz。

## 未覆盖项

- 不改 `focusTime`、package exports、resolver、release verifier 或任何源码。
- 不 push；也不改 alpha2、Tauri/Rust、价格/marker/selection/persistence 设计。
