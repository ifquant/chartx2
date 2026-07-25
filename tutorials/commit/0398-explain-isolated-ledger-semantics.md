# 解释隔离的 ledger 实例语义

## 背景

`TradingLedgerPanel` 是公共组件，同一页面可以同时出现多个实例。例如打包后的外部 consumer
会同时挂载 legacy ledger 和 heterogeneous ledger。早期实现只用 tab 的数组下标构造 HTML
`id`，单个组件看起来正确，但两个实例都会生成 `trading-ledger-tab-0`。这会让屏幕阅读器把
一个实例的 tab 错误地关联到另一个实例的 panel。

本教程记录提交 `c9680a4` 的修复思路：它没有扩展交易领域能力，而是让已有的呈现和可访问性
契约在多实例页面中仍然成立。

## 主要目标

- 使用稳定的、每个组件实例独有的前缀生成 tab 和 panel 的 DOM ID。
- 保证每个 `role="tab"` 的 `aria-controls` 精确指向自己的 `role="tabpanel"`，并让 panel 的
  `aria-labelledby` 反向指回同一个 tab。
- 让 active panel 承担行选择与焦点管理，并从真实 packed consumer 证明 Snippet 和键盘行为。

## 改动概览

- `TradingLedgerPanel.svelte` 从 legacy `export let` props 转成 Svelte 5 `$props()` 读取方式，
  保持 `model`、`onSelectTab`、`onSelectRow` 的公共 prop 形状不变。
- 组件在顶层调用 `$props.id()`。这是 Svelte 根据组件树生成的稳定 instance ID，SSR 输出和
  hydration 会得到相同前缀；它不是随机数，也不需要增加 host-provided public ID prop。
- 每个 tab 保留对应的 panel 节点，因此所有 `aria-controls` 都能解析到实际 DOM 元素。只有
  active panel 渲染表格行和 detail，避免 hidden panel 重复绑定同一 `rowButtons` 数组，导致
  Arrow 键把焦点送到不可见行。
- `verify-chartx2-local-release-consumer.mjs` 同页 mount 两种 ledger，断言全局 ID 无重复、每一对
  tab/panel 双向关联准确；还验证 `editor` only、`actions` only、both Snippet replacement 与
  tab/row Arrow、Home、End 的 callback、`aria-selected` 和 focus 结果。

## 关键知识

### 为什么不能自己递增或随机生成 ID

浏览器端递增计数器会随 mount 顺序变化，随机数则更不可能在服务器渲染和客户端 hydration 时重现。
这种差异会造成 hydration 警告，甚至把 ARIA 属性指向不存在的节点。`$props.id()` 正是 Svelte
为组件级稳定 ID 提供的机制：它既不泄漏为 API，也不要求宿主协调编号。

### active panel 与焦点为什么必须共同收敛

tab 的 callback 会先由 host 更新 `model.activeTabId`，然后 active panel 才成为可见内容。若
每个 hidden panel 也绑定行按钮，组件内部保存的按钮引用可能落到最后一个 hidden panel，键盘
事件虽选择了正确的数据却无法把焦点留在用户看见的行。只在 active panel mount rows，可以让
selection、ARIA state 和 DOM focus 代表同一份当前呈现。

## 补充知识

- `editor` 和 `actions` 是两个独立的 `Snippet` replacement seam。测试 both case 不足以证明
  单侧 replacement 没有意外删除另一侧默认 UI，因此 packed consumer 需要分别 mount
  editor-only、actions-only 和 both。
- unit/type check 可以检查源代码与类型；workspace 外 tgz consumer 还能覆盖 package-root export、
  声明文件、实际 Svelte 编译、浏览器 DOM 和键盘事件，因此适合验证公共组件的交互契约。

## 验证

本提交只增加解释文档；没有重新宣称或执行 authoritative release。提交前执行：

```bash
git diff --check
git diff -- tutorials/commit/0398-explain-isolated-ledger-semantics.md
git status --short
```

实现提交 `c9680a4` 已实际运行过以下检查，供读者追踪而非由本文重复执行：

```bash
pnpm check
pnpm test:unit
pnpm release:local:verify
```

## 未覆盖项

- 本文不改 `TradingLedgerPanel`、public types、ticket Snippet、consumer script 或任何测试。
- 不新增第三条 public seam，不接入 alpha2，不引入订单/账户/经纪商命令、Tauri 或持久化协议。
- `pnpm release:local:check` 的 authoritative committed-HEAD gate 仍须在 fresh review GO 后单独执行
  和记录。
