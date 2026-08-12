# 0408：给 Market Chart 增加可认证的 Marker 激活事件

状态：**SAME Terra-high APPROVED，P0–P3=0 / READY TO COMMIT**。尚未 stage、commit 或 push。

## 背景

`PhaseOneSeriesMarker` 原先只能绘制和显示 tooltip。宿主若想在用户点击成交标记后打开报告，只能自己猜 canvas 坐标，也无法证明点击来自当前数据和当前挂载代际。

## 主要目标

- 每个 marker 使用非空且 model 内唯一的稳定 `markerId`。
- `PhaseOneMarketChartSurface` 只在当前数据已 ready 且持有当前 opaque lifecycle receipt 时发送激活事件。
- 同时提供可预测的 pointer overlap cycling 和完整键盘导航，不破坏 marker 外部的 chart/drawing/virtual-range 交互。

## 改动概览

- `PhaseOneSeriesMarker` 新增必需的 `markerId`，surface model 在渲染前拒绝空值和重复值。
- 新增公开 `PhaseOneMarketChartMarkerActivationEventV1`：包含 `markerId`、`time`、当前 `dataIdentity`、当前 `mountLifecycleReceipt` 和 `pointer | keyboard` 输入类型。
- engine 在真实绘制 marker 的同一 render pass 发布有序 geometry snapshot；只有几何语义变化才递增 revision。surface 只为当前 plot 内可见的 geometry 建立透明 `24×24 CSS px` hit target，不重算 pane、price scale 或 axis inset。
- 右键和拖动不会激活；重叠标记按距离、后绘制顺序和 `markerId` 决胜，相同指针/模型/数据/代际/geometry revision 上的重复点击循环候选。
- marker 使用 roving tabindex：从 viewport 按 Tab 进入，左右按时间与输入顺序移动，上下只在同时间 overlap group 内移动，Home/End 跳首尾，Enter/Space 激活，Esc 返回 viewport。

## 关键知识

Marker 激活事件不能只携带一个字符串 ID。若没有当前 `dataIdentity` 和 opaque receipt，晚到的点击可能被宿主误认为来自已经替换的数据。surface 因此复用已有 lifecycle ready gate，在签发事件时重新检查 marker、数据、chart、axis-ready 与 receipt。

Hit target 的坐标也不能由 surface 根据宽度和价格范围近似计算。marker 的 `aboveBar` / `belowBar` 锚点、多个 pane 的顶部偏移和左右 price axis inset 都属于 engine 绘制事实；surface 订阅同一 render pass 的 immutable snapshot，才能保证可点击区域与屏幕图形重合。crosshair-only 重绘不会制造新 revision，而 pan、wheel、数据或 axis 真的改变坐标时会发布新 revision。

## 补充知识

1. `roving tabindex` 让一组很多按钮在 Tab 顺序中只占一个位置，方向键在组内导航，适合图表标记这类密集对象。
2. overlap cycling 的状态必须在 pointer、model、dataIdentity 或 generation 任一变化时清空，否则下一次点击会从旧候选序列中间开始。

## 验证

- focused unit：最终实现侧 10 files / 31 tests PASS；审查侧最终窄复跑 3 files / 16 tests PASS。
- focused Playwright：真实 Svelte surface、24×24 geometry、offscreen no-target、pointer cycle revision reset、no drag/right-click、keyboard activation、frozen identity、multipane/axis/pan/wheel geometry，以及 chart generation rebuild 同步撤销旧 target，均 PASS。
- `pnpm check`：library 与 example 均 0 errors / 0 warnings。
- `pnpm release:local:check`：PASS（library 601/601、example 16/16、failure cleanup、packed browser consumer）。此前首个 candidate 在 packed consumer identity rotation 超时；修复 empty geometry 重复发布与 engine-authoritative semantic geometry 后，本次唯一 canonical 重跑完整通过。
- `git diff --check`：PASS。
- canonical tgz SHA-256：`38e6e3c833771db8912de17de78d2f05eac6301a0adcb1b55503fb96771f3af7`。
- canonical tgz SHA-512 SRI：`sha512-oPXqGpfZObkkGq3moHYsosVMHErlp00khunBnfGFhDZnJ6yiE3Eq/IPpEz6NllB4U0i/wWyCEnrCCdio9XZYSg==`。

## 审查结论

审查轨迹为：fresh Terra-high review **NOT APPROVED（P1×2）** → SAME fix → **NOT APPROVED（P1×2、P2×2）** → SAME fix → residual **P1×1** → final narrow fix → reviewer **APPROVED，P0/P1/P2/P3=0/0/0/0**。

修复重点包括：geometry 必须来自 engine 实际 draw pass；crosshair-only render 不推进 revision；offscreen marker 不生成 DOM/键盘目标；generation rebuild 先同步撤销旧 geometry；activation 复制并冻结当前 data identity。公共事件名最终冻结为 `PhaseOneMarketChartMarkerActivationEventV1`。

## 未覆盖项

- 本切片不增加 marker 编辑、拖动或持久化；公开 geometry snapshot 只提供 engine 已绘制 marker 的只读中心点与 revision，不暴露 Alpha 侧坐标计算。
- 宿主如何根据 `markerId` 打开业务详情仍由宿主决定。
- 本切片只证明 chartx2 package 与 source-component Browser 边界，不证明 Alpha2 T15-21、visible native Tauri、真实 CTP 或 broker acceptance；这些属于后续 Wave B 集成。
