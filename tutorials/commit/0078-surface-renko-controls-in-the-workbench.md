# 背景

上一提交已经把 `Renko` 的第一版 runtime 参数接进了公共 API：主序列 `applyOptions()` 现在支持 `renkoBoxSize` 和 `renkoBoxSizeMode`。

但这还停留在“代码里能调”的层面。对于这个项目当前的目标来说，这还不够，因为你需要在主界面里快速感受到不同 builder 参数带来的结构变化。

所以这一步不再扩展引擎契约，而是把已存在的 `Renko` 参数真正抬到 workbench UI 上。

# 主要目标

- 让 workbench 在 `Renko` 主图下显示 builder 控制条
- 支持直接切 `Auto / Fixed` 和固定 box size 档位
- 用浏览器测试锁定这组交互入口

# 改动概览

- 更新 [src/lib/demo/chartx-demo.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts)
  - 新增 workbench 级 `renkoMode` 和 `renkoFixedBoxSize`
  - 当主图类型为 `renko` 时：
    - rebuild 会把当前 `Renko` 参数同步到 chart runtime
    - actions 会额外暴露 `renko-option` 分组
  - 新增 workbench 动作：
    - `Renko Auto`
    - `Box 2`
    - `Box 4`
    - `Box 8`
  - snapshot metrics 在 `Renko` 模式下会显示当前 builder 状态
- 更新 [src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/src/routes/+page.svelte)
  - workbench 现在会把 actions 分成：
    - `chart-type`
    - `renko-option`
    - `chart-action`
  - 在 footer 中新增只在 `Renko` 主图下出现的 `mode-strip`
  - 当前激活的 `Renko` 参数按钮会高亮
- 更新 [tests/visual/phase-one-harness.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts)
  - 新增 workbench 浏览器测试
  - 断言：
    - 切到 `Renko` 后 `mode-strip` 可见
    - 默认 `Renko Auto` 激活
    - 点击 `Box 2` 后 UI 文案切到 `Fixed 2`

# 关键知识

这次并没有增加新的图表引擎能力，但它把“已有能力是否可感知”这件事补上了。

对 chartx2 这种“图表引擎 + demo 工作台”项目来说，这很关键。因为如果一个 builder 参数只能在测试里改、在页面上看不到，那它就很难成为稳定的产品反馈入口。

# 补充知识

- Demo shell 的价值不只是“展示图已经画出来了”，而是把 runtime API 变成一个可以快速观察和对比的控制台。
- 这次把 `Renko` 参数单独放成 `renko-option` 分组，而不是塞进已有 action strip，是为了让“主图类型切换”和“当前主图的专属参数”在 UI 结构上分开。这个区分以后也能复用到 `Kagi / Line Break / P&F`。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 目前 `Renko` 控件仍是离散档位按钮，还没有自由输入 box size
- `Heikin Ashi` 和后续其他 chart types 还没有自己的专属控制条
- workbench 目前只显示参数状态，还没有独立的 builder diagnostics 面板
