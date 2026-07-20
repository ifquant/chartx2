# 修复打包 Svelte 组件的 optional 参数

## 背景

仓库内 `svelte-check` 和 unit tests 能正确处理 `<script lang="ts">`，但外部
consumer 安装本地 tarball 后，Vite 在 SSR 加载 package 内的 Svelte 组件时看到
了 `function toneClass(tone?)`。这个残留不是合法 JavaScript，导致 package
release verification 失败。

## 主要目标

保留 helper 接受 `undefined` 的类型语义，同时让 Svelte package 编译稳定移除
TypeScript 类型，不把 optional 参数语法泄漏给外部 JavaScript parser。

## 改动概览

- `MarketPanelShell` 将 `tone?: MarketPanelTone` 改为显式
  `tone: MarketPanelTone | undefined`；
- `TradingLedgerPanel` 同步采用显式 union，避免修复第一个文件后在下一个组件
  重复失败；
- 不改变任何调用点、CSS class 或 UI 行为。

## 关键知识

`parameter?: T` 与 `parameter: T | undefined` 对调用语义非常接近，但它们不是
相同的源码语法。package pipeline 若没有正确擦除 `?`，显式 union 更容易被
TypeScript/Svelte 转译阶段稳定处理。

## 补充知识

只在源码仓库内运行单测不足以证明 package 可消费。必须把 tarball 安装到独立
临时项目，再走真实的 Vite/SSR parser，才能发现这类发布边界问题。

## 验证

```bash
pnpm release:local:check
```

## 未覆盖项

- 不改变 market panel 或 trading ledger 的业务行为；
- 不修改 package layout、exports 或依赖版本；
- 不属于 market-chart-surface host-control 功能。
