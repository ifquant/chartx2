# 0407：统一公共图表的 DOM 与 Canvas 视觉合同

状态：**coordinated APPROVED，P0–P3=0 / READY TO COMMIT**。尚未 stage、commit 或 push。

## 背景

Alpha2 需要用自己的交易终端主题承载 chartx2，但不能 deep-import renderer，也不能每帧读取 CSS。旧版图表默认暖白 Canvas，嵌入深色宿主时会形成白色孤岛。

## 主要目标

发布 `@chartx2/library@0.2.0`，提供中立的 `ChartxVisualTheme`、`ChartxMessages`、provider、resolver 和 `chart.applyVisualTheme()`。

## 改动概览

- resolver 只在 mount 或显式 `themeRevision` 变化时读取 CSS variables。
- DOM 与 Canvas 消费同一 resolved theme；应用主题只原地更新 renderer inputs 并 redraw。
- 默认消息不再泄露 host、adapter、fixture 等实现词。
- 发布 failure test 从 package metadata 派生 tgz 名。

## 关键知识

主题 revision 是视觉失效信号，不是行情 revision。把两者分开，才能避免 tick 更新进入 `getComputedStyle` 热路径。

## 补充知识

1. CSS variables 适合 DOM 继承；Canvas 必须先解析成 typed palette 才能绘制。
2. tgz 原子发布要先在 staging 验证，再替换 artifact，失败时保留旧包。

## 验证

- `pnpm release:local:check`：PASS（library 595，example 16）。
- packed browser consumer：PASS。
- `git diff --check 189310ef30b2ba395a1eeaed818e61adf42a9898`：PASS（当前 worktree 相对冻结 chartx2 baseline）。
- tgz SHA-256：`cfc9085207a32ed2857a3ef91c63206c7f50106b7e0d967a10e3ae9d1a981f50`。
- tgz SHA-512 SRI：`sha512-5eqinpUY1M5Mi9NMFVgPrLp2GGKr70VgnEFkcHkum+31EvfASn7oJNILrVO1DrfLFgvNrf3SzOcI8tww3FAH1A==`。

## 审查结论与提交顺序

审查轨迹为：fresh coordinated review **NOT APPROVED（P1×3、P2×1）** → SAME fix → **NOT APPROVED（P1×2）** → SAME narrow fix → coordinated reviewer **APPROVED，P0/P1/P2/P3=0/0/0/0**。

当前 tgz 与哈希属于未提交 candidate。先提交 chartx2；随后必须从该 commit 重新执行 canonical pack。若 commit 后 tgz 哈希变化，先刷新 Alpha2 的 lock、SRI、public-boundary receipt 和 closure 证据，再提交 Alpha2 1873/1874。

## 未覆盖项

- 未做 native Tauri 人工视觉验收。
- Alpha2 产品级主题选择仍由宿主偏好流程决定。
