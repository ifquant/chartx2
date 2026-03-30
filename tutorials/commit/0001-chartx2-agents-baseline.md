# 0001 建立 chartx2 协作规则基线

## 背景

`chartx2` 的目标已经明确不是普通的 Tauri 模板程序，而是一个逐步逼近 TradingView 图表体验的图表套件样例程序。但当前仓库里仍然保留了大量模板痕迹，例如 `README.md`、`src/routes/+page.svelte`、`src-tauri/src/lib.rs`，以及一个指向缺失模块的 `chart-model.ts`。如果没有一份贴近现状的协作规则，后续 AI 很容易把模板代码、历史规划和真实实现混在一起。

## 主要目标

这次改动的目标不是实现图表功能，而是先把 `chartx2` 的协作边界写清楚，让之后的开发、提交和教程产出都能围绕真实目标运行。

## 改动概览

- 重写 `chartx2/AGENTS.md`，让它继承父级提交规则，同时补充 `chartx2` 自己的产品定位、目录导航、测试命令和高风险边界。
- 重写 `README.md`，把模板说明替换成 `chartx2` 当前真实方向、目录结构和验证命令。
- 明确说明当前仓库里哪些内容仍是模板或历史草稿，避免后续代理把它们当成稳定 API 或最终架构。
- 建立 `tutorials/commit/` 目录，并添加 `0001` 作为后续教程的格式样例。

## 关键知识

`AGENTS.md` 在这个仓库里不是泛泛而谈的说明文档，而是给未来代理执行任务时用的“局部协作合同”。它最重要的价值不是介绍项目，而是减少误判。对 `chartx2` 来说，最容易误判的地方有三类：

1. 把模板代码当成正式实现。
2. 把 `docs/develop.md` 里的历史规划当成已经落地的目录结构。
3. 把“最终想做 TradingView 级别图表”误读成“现在已经需要一次性铺开全部模块”。

所以本次规则重点不是写抽象原则，而是把真实路径、真实命令、真实缺口和“需要先确认”的情况固定下来。

## 补充知识

- `AGENTS.md` 最有用的写法通常不是重复全局规范，而是补充“这个子项目独有、最容易踩坑的事实”。这样后续代理在进入目录时才能快速建立正确心智模型。
- 当一个项目同时有“历史规划文档”和“当前磁盘现状”时，写规则时要优先以可验证的现状为准，再把规划明确标记为 planned。这样能减少代理根据旧文档胡乱创建目录或脚本。

## 验证

- 手工检查 `chartx2/package.json` 中存在的脚本，确认可写入 `AGENTS.md` 的真实命令为 `pnpm check`、`pnpm build`、`pnpm tauri dev`
- 手工检查 `chartx2/src-tauri/Cargo.toml`，确认 Rust/Tauri 侧至少可引用 `cargo check`、`cargo test`
- 手工检查 `chartx2/src/routes/+page.svelte` 与 `chartx2/src-tauri/src/lib.rs`，确认当前实现仍是模板壳
- 手工检查 `chartx2/docs/develop.md`，确认其中存在比当前磁盘更超前的历史规划，需要在规则中标记为可能漂移
- 手工检查 `README.md`，确认原文件仍是 Tauri 模板文案，已不适合作为仓库首页说明
- `pnpm check` (`FAIL`: 缺少 `/Users/dev/workspace2/hc_apps/chartx2/node_modules/@sveltejs/kit/svelte-kit.js`，当前前端依赖状态不完整)
- `cargo check` (`PASS`)

## 未覆盖项

- 没有修复 `chart-model.ts` 指向缺失模块的问题，只是在规则里标记它当前不应被当成稳定接口
- 没有更新模板首页或 Tauri 示例命令
- 没有为未来真正的 chart engine 包结构写更细的子级 `AGENTS.md`
