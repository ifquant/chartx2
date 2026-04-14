# 0140: 给 workbench 画线工具补预览和 Escape 取消

上一刀把左侧的 `horizontal-line / trend-line` 工具真正接通了，但交互上还差一截：用户选了工具以后，图上没有任何创建预览；趋势线点了第一个点以后，也没有一个明确的“取消”出口。

这次就是把这两个缺口补上。

## 这次改了什么

### 1. workbench snapshot 开始携带趋势线未完成创建的锚点像素

之前 snapshot 里只有：

- 当前工具类型
- 是否已经有第一击时间

但没有第一击落点在画布里的像素坐标。  
没有这个坐标，UI 就无法在 workbench 层画出一条正在创建中的趋势线预览。

所以这次把：

- `pendingTrendLineStartPoint`

也放进了 `drawingTool` snapshot 里。

这样 Svelte 页面对引擎一无所知，也能仅凭：

- 第一击点
- 当前鼠标点

画出一个轻量级的 ghost preview。

### 2. 预览没有塞进引擎，而是先放在 workbench UI 层

这次故意没有去改 chart engine 的渲染管线，而是在 `.chart-frame` 上方加了一个绝对定位的 SVG overlay。

原因很直接：

- 这是 demo/workbench 层的创建反馈
- 不是 chart engine 的正式 drawing object
- 先放 UI 层，代价更低，也不会污染底层渲染模型

当前行为是：

- `horizontal-line` 工具激活后，鼠标移动会显示一条水平虚线
- `trend-line` 工具在第一击后，会从锚点到当前鼠标位置显示一条斜向虚线

### 3. `Escape` 现在可以取消当前 tool flow

这次补了一个很重要但很基础的编辑器习惯：

- 如果当前处于 drawing tool 模式
- 按 `Escape`
- 立即清掉当前 tool
- 如果趋势线已经点了第一击，也一并清掉 pending anchor

这件事虽然简单，但它把交互从“只能继续点下去”变成了“有中止路径”。

### 4. 窄布局基线同步更新

因为 chart frame 现在多了一层 preview overlay 容器，workbench 的窄布局视觉基线也跟着发生了轻微漂移。  
这次一起把 `phase-one-harness-narrow.png` 更新到了当前真实界面。

## 为什么这次不把 preview 直接做进引擎

因为这两层东西不是一回事：

- engine 里的 drawing：是正式对象，要参与 hit-test、snapshot、selection、restore
- workbench 里的 tool preview：只是临时视觉反馈，创建完成前根本不该进入对象模型

如果现在为了一个 demo 预览，把它强塞进引擎层，后面反而更难收拾。

所以这次的选择是：

- 正式对象继续走 engine
- 临时预览留在 workbench UI

这个边界是刻意保持的，不是偷懒。

## 这次验证了什么

- `pnpm check`
- `pnpm test`
- 新增 workbench browser contract：
  - trend-line 工具会显示创建预览
  - `Escape` 可以取消未完成趋势线

## 现在还没做什么

这一刀仍然没有补：

- 创建时的价格/时间磁吸预览标签
- 更精细的端点吸附提示
- 连续绘制模式
- 工具级 preset
- 其它左侧工具的真实落地

## 一个给初学者的实现提醒

“可取消”不是锦上添花，它是交互闭环的一部分。

很多半成品工具的问题不在于“能不能开始”，而在于：

- 开始后有没有反馈
- 半途中能不能退出

如果一个工具没有 preview，也没有 cancel path，用户其实是在盲操。  
这次补的就是这两条最基础的编辑器礼仪。
