# 0035: 给 pane architecture 补上拖拽调高基线

这次提交没有继续扩 series，而是把 `pane` 体系往真实图表交互又推进了一步：secondary pane 现在不只可以通过 API 改高度，也可以在浏览器 harness 里直接拖动 divider 调整高度。

## 这一步为什么现在值得做

前面已经有了：

- `addPane() / removePane()`
- `setHeight()`
- `series -> pane` target

如果到这里还没有可见的 divider resize，pane 更像“有 API 的布局数据结构”，不像真正的图表 pane。把拖拽调高补上之后，后面的 indicator pane、volume pane 和更完整工作台交互都会更顺。

## 这次做了什么

1. 在 `pointerdown / move / up` 路径里加入 pane divider hit-test。
2. 当指针压在 pane divider 上时，不再进入平移模式，而是进入 pane resize 模式。
3. resize 时会同时约束上下 pane 的最小高度，避免把主 pane 或 study pane 压扁到不可读。
4. 新增一张 `phase-one-harness-pane-resized.png`，把这个交互固定成视觉基线。

## 两个新人提示

1. 图表里的拖拽交互经常是互斥的：同一条 `pointerdown`，可能是平移、resize、crosshair inspect，必须先做命中判定再决定进入哪条状态机。
2. “最小高度”这类约束不只是 UI 细节，它会直接决定你的布局算法在交互下会不会发散或者抖动。
