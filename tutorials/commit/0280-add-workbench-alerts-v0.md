# 添加 Workbench Alerts V0

## 背景

Workbench 已经有 symbol open、saved layout 和 indicator catalog 这些工作台能力。Alerts V0 的目标是补上第一条本地提醒链路，但不能把提醒状态塞进 layout，也不能让 demo shell 或 chart runtime 直接变成提醒系统的 owner。

这次 0280 tutorial 合并记录 Alerts V0 的完整切片：公开 V1 提醒状态、demo controller 运行时、Svelte 面板创建入口，以及浏览器测试。Task 3 曾先写过 `0280-create-workbench-price-alert-from-panel.md`，这里用计划文件要求的 `0280-add-workbench-alerts-v0.md` 作为唯一 0280 教程，避免同一个编号出现两个教程。

## 为什么 alerts 要和 layout 分开

Saved layout 负责恢复图表工作区的结构状态，例如 symbol、timeframe、图表快照和面板状态。Alert 是另一类工作台状态：它可能跨 layout 存在，也可能未来接入云端、通知、触发历史、编辑规则和 broker 之外的工作流。

如果把 alert records 写进 layout snapshot，后续会出现几个问题：

- 用户保存或恢复 layout 时会意外覆盖提醒列表。
- alert provider 无法独立替换成本地、云端或账号级存储。
- chart runtime 容易被迫知道提醒持久化细节。
- sidebar 的 `AlertSummaryModel` 会从投影模型退化成持久化源数据。

因此 Alerts V0 新增独立的 `workbench-alerts` 公共模块。Layout 继续管理布局，Alerts 通过自己的 provider 管理提醒记录，再投影到 Workbench sidebar。

## V1 state 和 provider 怎么工作

公开提醒状态使用版本化 schema：

- `WorkbenchAlertsStateV1` 的根对象是 `{ kind: "workbench-alerts", version: 1, alerts }`。
- 每条 `WorkbenchAlertStateV1` 有稳定的 `id`、`label`、`status`、`createdAt`、`updatedAt`，以及可选 `triggeredAt`。
- V0 的 condition 只实现 `kind: "price-crosses"`，字段包括 `symbol`、`timeframe`、`price` 和 `direction`。
- `createWorkbenchAlertsState({ alerts })` 负责生成根状态。
- `isWorkbenchAlertsState(value)` 负责拒绝错误 kind/version、非数组 alerts、空字符串、非法 status/direction、非有限价格和时间戳。
- `toAlertSummaryModel(alert)` 把持久化提醒记录转换成当前 sidebar 需要的 summary model。
- `createLocalStorageWorkbenchAlertsProvider(storage, key?)` 负责 load/save/clear，并把坏 JSON、坏 shape 和 storage 异常限制在 provider 边界内。

这里的关键点是：provider 只知道 V1 alert state，不知道 Svelte UI；sidebar 只拿 summary projection，不反过来定义持久化格式。

## controller 和 UI 创建流程

Demo controller 新增可选 `alertsProvider`，并维护一个内存 alerts 列表。启动时，如果外部传入 provider，就从 provider 读取本地提醒；如果没有 provider，就用确定性的 demo V1 alert records 填充 sidebar。

创建提醒的流程是：

1. Workbench 页面把 localStorage provider 注入 demo controller。
2. `MarketWorkbenchPanel` 通过 `onCreatePriceAlert` prop 接收创建动作，Alerts 卡片右上角的 `＋` 只负责触发这个 prop。
3. `src/routes/+page.svelte` 保持薄壳，只调用 `workbenchController.createPriceAlert?.()`。
4. controller 基于当前 active symbol、active timeframe 和最新 close 生成确定性的 armed price-cross alert。
5. controller 保存到 provider，重新投影 `alertItems`，并写入 activity log，例如 `created alert <symbol> price crosses <price>`。
6. 浏览器测试从 Workbench tab 点击 Alerts 卡片的 `＋`，只在 `.alert-card` 范围内断言新提醒，避免和 watchlist、indicator 或其他 sidebar 文案串扰。

这个结构让 Svelte 面板不需要 import controller，也让页面壳不拥有 alert 规则。真正的提醒创建语义留在 demo controller，未来可以继续替换为更正式的 workbench application service。

## V0 故意不做什么

Alerts V0 只证明本地 price-cross alert 的 public contract、provider、controller creation 和 UI entrypoint。以下能力没有包含在本切片内：

- drawing line cross alerts。
- indicator value cross alerts。
- 多条件 alerts。
- alert 编辑、删除、暂停/恢复 UI。
- 通知投递、声音、弹窗、系统通知或 webhook。
- 云同步、账号级 alert provider 或跨设备状态。
- broker/order 行为，alert 触发不会下单。
- 在图表上绘制 alert line 或 object tree 管理。
- 把顶部 toolbar 的 `Alert` 按钮改成创建入口。

这些都应该在后续切片里继续走独立 alert model/provider/application service，而不是回头把状态塞进 layout snapshot。

## 关键知识

版本化状态的价值在于把“当前 demo 能做什么”和“以后持久化兼容什么”分开。V0 只有 price-cross condition，但根对象已经带 `kind` 和 `version`，所以后续 V2 可以扩展 condition、触发历史或 provider 行为，而不是让旧 localStorage 数据变成隐式约定。

`AlertSummaryModel` 是显示层投影，不是 source of truth。把转换写成 `toAlertSummaryModel(alert)`，可以让 sidebar 文案、badge 或状态颜色迭代时不破坏持久化 schema。

## 验证

- Alerts V0 的 runtime / UI 切片在前序任务中已经用 `pnpm check`、`pnpm test:unit -- tests/unit/workbench-alerts.test.ts` 和 `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "workbench creates a price alert"` 验证过。
- 本次 Task 4 只改 docs/tutorial，实际运行 `git diff --check` PASS。

## 未覆盖项

- 没有改动 runtime code；本次只补齐计划文档和 0280 教程。
- 没有重新运行 Task 4 计划里的完整 final verification 套餐，因为本提交只改 docs/tutorial。
- 没有新增第二个 0280 tutorial；旧的 Task 3 文件已合并为计划命名的 Alerts V0 教程。
