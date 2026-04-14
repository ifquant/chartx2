# 0118: 给 trend-line 补最小 hover affordance

这次提交不是再加新的 drawing 类型，而是把已有的 trend-line 编辑体验再往前推半步：

- 鼠标经过已选中 trend-line 的可编辑区域时
- chart 不再只表现得像普通 hover
- 而是给出更明确的“这里可以拖”的信号

## 这次补了什么

### 1. 把 hover 当成运行时交互状态

这次新增的是 runtime state，不是持久化状态：

- `hoveredDrawingId`
- `hoveredDrawingHandle`

它们只在当前鼠标移动过程中存在，不进入 template / snapshot。

这很重要，因为 hover 是交互反馈，不是用户配置。

### 2. 已选中 trend-line 上，hover 会优先解析成“最近端点”

当前规则是：

- 如果鼠标在 selected trend-line 的端点附近，就命中那个端点
- 如果鼠标在 selected trend-line 的线段本体上，就按最近端点解释

这和上一提交的拖拽语义保持一致：

- line body drag = drag nearest endpoint

这样 hover 和 drag 的模型不会打架。

### 3. cursor 从 `pointer` 提升成 `move`

之前 hover drawing 时，canvas 只会变成一般性的 `pointer`。

现在：

- 普通 drawing hover 仍然是 `pointer`
- 但如果 hover 到 selected trend-line 的可编辑区域
  - cursor 会变成 `move`

这让用户能更快区分：

- 这里是“可选中对象”
- 还是“当前就能直接拖的编辑区域”

### 4. 已选中 trend-line 的 hover handle 会画得更明显

对 selected trend-line：

- 之前只有小的端点圆点
- 现在 hover 到当前可编辑 handle 时，会额外画一个更大的白底描边圆

这不是完整 handle 系统，但已经能明显提示“现在命中的是哪一个端点”。

## 浏览器契约怎么锁

这次新增了一条很小但有价值的 Playwright 契约：

1. 建一个带 trend-line 的 chart
2. 先把 trend-line 选中
3. 再把鼠标移动到已命中的编辑区域
4. 校验 canvas cursor 变成 `move`

这条契约不去读像素，而是先锁住最重要的用户感知信号：

- cursor affordance 已经存在

## 为什么先做这个

因为 drawing 编辑的第一版容易出现一个问题：

- 功能上“其实能拖”
- 但用户完全看不出来哪里能拖

所以在完整 hover handles、snapping、toolbar 之前，先把：

- cursor
- 当前 handle 的轻量高亮

做好，是很划算的一步。

## 这次仍然没做

这次**没有**做：

- endpoint hover tooltip
- snapping / magnet
- hover 时的独立事件订阅
- 多 handle 类型
- selection box
- z-order

所以它仍然只是最小 hover affordance，不是完整 editor polish。

## 验证

本次实际跑过：

```bash
pnpm check
pnpm test:unit
pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "move cursor over the nearest endpoint handle|nearest endpoint from the line body" --config /tmp/chartx2.playwright.drawing.config.ts
```

## 一个小知识点

编辑器类产品里，一个常见原则是：

`先让用户知道“这里可编辑”，再继续优化“怎么编辑得更准”。`

如果 affordance 缺失，哪怕底层拖拽已经能工作，用户也会把它理解成“功能不存在”。
