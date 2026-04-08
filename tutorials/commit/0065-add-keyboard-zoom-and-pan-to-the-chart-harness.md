# 0065: 给 chart harness 补上键盘缩放和平移

这次修的是一个很直接的交互缺口：用户按 `↑ / ↓` 时，K 线没有任何缩放反应。

原因不是数据或渲染问题，而是当前底层只接了：

- 鼠标滚轮缩放
- 鼠标拖拽平移
- 页面按钮触发的缩放/平移

却没有把键盘事件接进 chart viewport。

## 这次改了什么

更新文件：

- [chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
- [phase-one-harness.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts)

### 1. 给 canvas 增加键盘事件处理

新增 `keydown` 处理逻辑：

- `ArrowUp`：放大
- `ArrowDown`：缩小
- `ArrowLeft`：向左平移
- `ArrowRight`：向右平移

实现方式和现有 wheel / button 路径保持一致，都是直接作用在：

- `barSpacing`
- `rightOffset`

所以这不是另起一套键盘专用状态，而是复用同一套 viewport 语义。

### 2. 让 canvas 真的能拿到焦点

只监听 `keydown` 还不够，因为 canvas 默认并不能接收键盘事件。

这次补了两件事：

- 如果 canvas 没有 `tabindex`，自动设成 `0`
- 用户在图上 `pointerdown` 时，主动把焦点给 canvas

这样用户点一下图以后，就能直接按 `↑ ↓ ← →` 操作，不需要先额外 tab 聚焦。

### 3. 补自动回归

新增了一个 workbench 视觉测试：

- 点击图表，让 canvas 获得焦点
- 连按两次 `ArrowUp`
- 对结果截图

这样以后如果键盘缩放又被断开，回归会直接抓出来。

## 验证

这次实际跑过并通过：

```bash
pnpm check
pnpm test:visual --update-snapshots
pnpm build
```

## 这次没有做的事

这一步没有引入更复杂的键盘快捷键体系，比如：

- `+ / -`
- `PageUp / PageDown`
- `Shift + Arrow`
- 自定义快捷键映射

当前只先补最直观的箭头键交互，把缺失的底层路径补平。

## 给新人的 2 个知识点

### 1. 为什么 canvas 默认收不到键盘事件

因为普通的 `canvas` 元素不是天然可聚焦元素。  
如果不加 `tabindex`，浏览器不会把键盘事件送给它。

### 2. 为什么要把键盘缩放接到底层，而不是只在页面里写

因为 `Workbench` 和 feature demos 都在复用同一个 chart harness。  
如果只在页面层打补丁：

- `Workbench` 能用
- `Interactions` 或别的示例页可能不能用

把它接进底层后，所有使用这套 public chart path 的页面都会一起受益。
