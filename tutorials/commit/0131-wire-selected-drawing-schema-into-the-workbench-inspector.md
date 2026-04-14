# 0131: 把 selected drawing schema 真正接进 workbench inspector

上一刀我们已经有：

- `getSelectedDrawingState()`
- `applySelectedDrawingOptions(...)`
- `getSelectedDrawingPropertySchema()`

但那还只是“引擎和 public API 已经准备好了”。  
如果 demo/workbench 右侧面板还在写死内容，那这套 property system 依然没有真正落地。

所以这次的目标很明确：

- 不再停在 API
- 直接让 workbench UI 消费 drawing schema
- 让 schema 真的驱动 inspector，而不是只当文档存在

## 这次做了什么

### 1. 扩展 workbench snapshot

在 `chartx-demo.ts` 里，`DemoSnapshot` 新增了：

- `selectedDrawing`

其中会同时带：

- `state`
- `schema`

也就是说，workbench 的 UI 快照不再只知道：

- 主题
- 主图类型
- pane 数量

现在还知道：

- 当前有没有选中 drawing
- 当前 drawing 的属性值
- 当前 drawing 的 inspector schema

这让右侧面板不需要自己去猜 chart 内部状态。

## 2. 默认给 workbench 放入两条 drawing

为了让 inspector 有真实对象可选，这次默认 workbench 会创建：

- 一条 `horizontal-line`
- 一条 `trend-line`

这样 demo 一打开就已经具备 drawing 对象，不需要先切到别的 feature 再回来。

## 3. 订阅 drawing selection change

如果不订阅 selection，右侧 inspector 就永远不会跟 chart 上的点击联动。

所以现在 workbench rebuild 后会订阅：

- `subscribeDrawingSelectionChange(...)`

当用户点中一条 drawing 时：

- event log 会追加一条记录
- `publishSnapshot()` 会重新执行
- 右侧 inspector 会从 `None` 切到对应的 drawing schema

## 4. 给 DemoController 增加写回入口

workbench 的 Svelte 页面不是直接碰 chart api，而是通过 controller 工作。

这次 controller 新增：

- `applySelectedDrawingOptions?(...)`

这样右侧表单改值后，可以继续通过 demo controller 写回当前选中的 drawing，而不是把 Svelte 页面和 chart api 紧耦合在一起。

## 5. 右侧 sidebar 改成真正的 drawing inspector

`+page.svelte` 不再用静态卡片冒充 drawing 区域，而是新增了一个真正的 `Drawing` inspector。

它会：

1. 读取 `workbenchSnapshot.selectedDrawing`
2. 如果没有选中 drawing，就显示提示文案
3. 如果选中了 drawing，就按照 schema.sections 渲染：
   - `Appearance`
   - `Geometry`
   - `Magnet`

然后按 field control 生成对应控件：

- `toggle -> checkbox`
- `select -> select`
- `color -> color picker`
- `text -> text input`
- `number/time -> number input`

重点在这里：

UI 不再硬编码“trend-line 就显示这些字段、horizontal-line 就显示那些字段”。  
现在是 schema 决定 UI。

## 6. 补 workbench 级浏览器契约

之前 drawing property 的测试主要还是 API 级。

这次新增了一条真正的 workbench UI 契约：

- 打开 `/`
- 默认 inspector 显示 `None`
- 在 chart canvas 上扫描点击，命中任意默认 drawing
- 断言右侧 inspector 出现：
  - drawing kind
  - `Appearance`
  - `Geometry`
  - `Magnet`

这条测试很重要，因为它验证的是“schema 真的驱动了 workbench UI”，不是只验证 chart api 返回了什么。

## 为什么这一步重要

因为一个对象模型真的成立，不能只停在：

- engine 有状态
- API 能改值

还必须进一步落到：

- UI 能直接消费 engine 暴露出来的 schema

否则 property system 依然只是“工程师脑中的好结构”，不是实际产品能力。

这次以后，drawing property system 终于开始形成完整闭环：

1. drawing runtime state
2. drawing schema metadata
3. drawing update command
4. inspector UI

这四层接上之后，后面再补：

- validation
- grouped editing
- richer handles
- multi-select

都会自然得多。

## 这次没做什么

还没做：

- 更专业的 inspector 布局
- field-level validation / helper text
- 颜色预设、数值 step、快捷输入
- 多选后的 grouped property editing
- `horizontal-line` 的直接拖拽编辑
- z-order / grouping / locking

所以这次是“schema 驱动的最小 inspector UI”，不是完整绘图面板。

## 验证

已运行：

```bash
pnpm --dir /Users/dev/workspace2/hc_apps/chartx2 check
pnpm --dir /Users/dev/workspace2/hc_apps/chartx2 test:unit
pnpm --dir /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts -g "drawing inspector driven by selected drawing schema"
```

## 一个给初学者的知识点

很多 UI 一开始看起来“写死也能跑”，但一旦对象种类增多，就会在页面里到处长出：

- `if type === ...`
- `switch kind`
- `if field === ...`

这类代码最后会让 UI 成为真正的逻辑中心。

更稳的方式是把 UI 退回到“schema consumer”的角色：

- engine 决定字段
- schema 决定控件
- UI 只负责渲染和回写

这样对象系统才能持续扩，不会每加一种 drawing 就把面板重写一遍。
