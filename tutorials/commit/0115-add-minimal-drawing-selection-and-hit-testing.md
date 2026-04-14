# 0115: 加入最小 drawing selection 与 hit-testing

前两刀已经把 drawing 做成了 chart-owned object，并且能保存/恢复。  
这次往前再推一步：不再只是“对象存在”，而是让 drawing 第一次具有 **运行时交互态**。

## 这次改了什么

- 新增最小 drawing selection API
  - `getSelectedDrawing()`
  - `clearSelectedDrawing()`
  - `subscribeDrawingSelectionChange()`
  - `unsubscribeDrawingSelectionChange()`
- 点击 chart 时会先做 drawing hit-test
  - 命中 `horizontal-line` 或 `trend-line` 时切换当前选中对象
  - 点不到任何 drawing 时清空选中
- 给 drawing 渲染加了最小选中高亮
  - horizontal-line 会有额外高亮带
  - trend-line 会有高亮线和端点圆点
- pointer move 也开始感知 drawing hover
  - 鼠标移到可命中的 drawing 上时，cursor 会从 `crosshair` 切到 `pointer`

## 为什么这样做

如果 drawing 只能“创建/保存/恢复”，但完全没有 runtime 交互态，后面做 toolbar、inspector、属性面板时会很别扭。

这次先立住一个最小事实：

- drawing 有 chart-owned selection state
- selection 是 runtime state，不进 template
- hit-test 和 render highlight 都围绕同一对象模型工作

这比直接冲完整拖拽工具更稳。

## 这次没有做什么

- 没有做拖拽端点
- 没有做多选
- 没有做 hover tooltip
- 没有做 drawing z-order
- 没有做 keyboard delete / escape / selection box
- selection 仍然不进入 snapshot/template

所以它还是“第一条交互线”，不是完整 drawing UX。

## 验证

- `pnpm check`
- `pnpm test:unit`
- `pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "drawing selection" --config /tmp/chartx2.playwright.drawing.config.ts`

## 这一刀的两个知识点

### 1. Selection 是 runtime state，不是 persistence state

图表模板应该保存：

- 有哪些 drawing
- drawing 的几何和样式

但通常不该保存：

- 用户当前正选中了哪一个 drawing

所以这次特意把 selection 放在 chart runtime 上，而没有写进 `chart-template`.

### 2. Hit-testing 要和对象模型共用几何定义

这次 `trend-line` 的命中不是另外写一套坐标逻辑，而是继续复用：

- chart 的统一 `TimeScale`
- pane 的 `PriceScale`
- drawing 自己的几何状态

这样后面做拖拽编辑时，命中、渲染、更新三者才不会互相打架。
