# 0002 修复 pnpm 依赖安装状态

## 背景

在 `chartx2` 的首个基线提交之后，`pnpm check` 仍然失败。错误不是来自业务代码，而是来自前端依赖安装状态本身：`svelte-kit sync` 在启动时找不到 `node_modules/@sveltejs/kit/svelte-kit.js`。

这类问题很常见，尤其是在目录曾经被不同包管理器碰过的时候。表面上 `node_modules/.bin/svelte-kit` 还在，但真正的包目录已经坏掉了，结果就是脚本入口存在，实际实现文件不存在。

## 主要目标

让 `pnpm` 重新接管 `chartx2` 的前端依赖树，恢复一个可用的安装状态，并让 `pnpm check` 真正通过。

## 改动概览

- 重新运行 `pnpm install`，让 `pnpm` 把之前由其他包管理器留下的依赖移到 `.ignored` 后重建依赖树。
- 生成并保留 `pnpm-lock.yaml`，把当前可工作的依赖解析结果固定下来。
- 复跑 `pnpm check`，确认 `svelte-kit sync` 和 `svelte-check` 都能正常执行。

## 关键知识

`pnpm check` 失败时，不一定是源码有错。先看报错位置很重要。

这次报错是：

- 找不到 `node_modules/@sveltejs/kit/svelte-kit.js`

这说明问题出在安装产物，而不是某个 Svelte 组件或 TypeScript 类型。也就是说，先修依赖状态，比盲改代码更对路。

另一个关键信号是 `pnpm install` 的告警里明确写了：

- 某些包是由不同包管理器安装的
- `pnpm` 把它们移动到了 `node_modules/.ignored`

这基本就把根因说透了，目录之前的包管理器状态混了。

## 补充知识

- 当脚本命令还在 `.bin/`，但包目录已经空了或者缺文件时，优先怀疑 `node_modules` 污染，不要先怀疑源码。
- 对这种基于 `pnpm` 的项目，`pnpm-lock.yaml` 不是可有可无的缓存文件，而是“当前这套依赖解析是可工作的”这一事实的记录。

## 验证

- `pnpm install --reporter append-only` (`PASS`)
- `pnpm check` (`PASS`, `svelte-check found 0 errors and 0 warnings`)

## 未覆盖项

- 没有处理 `.trae/`、`.vscode/`、`a`、`b`、`chart-model.ts`、`temp_page.html` 这些仍未入库的文件
- 没有替换当前模板级的 `src/routes/+page.svelte` 或 `src-tauri/src/lib.rs`
