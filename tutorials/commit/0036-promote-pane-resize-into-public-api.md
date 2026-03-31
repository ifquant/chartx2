# 0036: 把 pane resize 规则收成明确的 public pane API

这次提交不是再加一种新交互，而是把上一轮已经存在的 pane divider resize 从“内部行为”收成更明确的 public API 规则。

## 为什么要做这一步

如果 divider resize 只能在内部代码里生效，而 pane handle 本身没有对应的 public 选项，那外部调用者就没法声明：

- 这个 pane 能不能被拖拽调高
- 这个 pane 当前的配置是什么
- 我想通过 API 改 pane 的高度和 resizable 状态

这会让 pane system 看起来像“浏览器 demo 有一个行为”，而不是“图表引擎真的有一条可用 contract”。

## 这次做了什么

1. 给 `PhaseOnePaneApi` 增加：
   - `getOptions()`
   - `applyOptions()`
   - `isResizable()`
2. 给 `addPane()` 的 options 增加 `resizable`
3. 让 divider resize 走 pane 的公开 `resizable` 规则，而不是默认所有 secondary pane 都能拖
4. 增加 API 回归，验证 pane options 改动会同步影响公开状态和渲染结果

## 给新人的两个提示

1. 一个交互如果没有公开 contract，通常还不算“产品能力”，更像“实现细节碰巧能工作”。
2. UI 交互和 public API 最好共用一套规则，不然迟早会出现“代码说能拖，API 说不能拖”这种分裂状态。
