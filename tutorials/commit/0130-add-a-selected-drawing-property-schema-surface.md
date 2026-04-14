# 0130: 给 selected drawing 补一层 property schema

这一刀不是继续加 drawing 交互，而是把 drawing property system 再推进一层元数据边界。

前一版我们已经有：

- `getSelectedDrawingState()`
- `applySelectedDrawingOptions(...)`

这足够让代码“读写当前选中的 drawing”，但还不够支撑真正的 property inspector。  
因为 inspector 还需要知道：

- 当前 drawing 应该分成哪些 section
- 每个 section 该显示哪些字段
- 每个字段更像 `toggle`、`number`、`color` 还是 `select`

如果没有这层 schema，UI 只能继续写成：

- `if (drawing.type === "horizontal-line") ...`
- `if (drawing.type === "trend-line") ...`

这不是一个真正的 property system。

## 这次做了什么

### 1. 增加 drawing property schema 类型

在 `chart-harness.ts` 里新增了：

- `PhaseOneDrawingPropertyField`
- `PhaseOneDrawingPropertyFieldSchema`
- `PhaseOneDrawingPropertySectionSchema`
- `PhaseOneDrawingPropertySchema`

这批类型的作用很直接：  
把“drawing inspector 能编辑什么”从 UI 猜测，提升成 chart runtime 可以直接暴露的结构。

## 2. 给 horizontal-line / trend-line 建第一版 schema

现在两个 drawing 都有了 schema 常量：

- `horizontal-line`
- `trend-line`

并且统一分成三类 section：

- `appearance`
- `geometry`
- `magnet`

例如：

- `horizontal-line`
  - `appearance`: `title` / `color` / `lineWidth` / `visible`
  - `geometry`: `price`
  - `magnet`: `magnetEnabled` / `timeMagnetPolicy` / `magnetSources.*`

- `trend-line`
  - `appearance`: `color` / `lineWidth` / `visible`
  - `geometry`: `startTime` / `startPrice` / `endTime` / `endPrice`
  - `magnet`: 和上面同一批 magnet 字段

重点不是字段多少，而是我们终于把“字段分组”和“控件类型”也收进了统一对象模型。

## 3. 暴露 selected drawing 的 property schema API

新增：

- `getSelectedDrawingPropertySchema()`

它和：

- `getSelectedDrawingState()`
- `applySelectedDrawingOptions(...)`

一起构成了 inspector 的最小后端三件套：

1. 先知道当前选中了什么 drawing
2. 读取它当前的属性值
3. 再读取它的 property schema
4. 按 schema 生成 inspector UI
5. 把用户修改写回 selected drawing

这比“直接 round-trip 整个 chart state”更对，也比“UI 写死字段表”更稳。

## 4. 补浏览器契约

这次测试不只验证：

- horizontal-line 能更新 `title`
- trend-line 能更新 `color`

还验证：

- 选中 `horizontal-line` 时，能拿到带 `appearance / geometry / magnet` 的 schema
- 选中 `trend-line` 时，也能拿到自己的 schema
- schema 里的字段 control 类型符合预期，比如：
  - `title -> text`
  - `color -> color`
  - `price -> number`
  - `startTime -> time`
  - `timeMagnetPolicy -> select`

这样以后谁改 drawing property surface，就不会无声把 inspector 契约搞坏。

## 为什么这一步重要

因为 drawing property system 真正成立，不能只有：

- 状态
- 修改函数

还必须有：

- 元数据

也就是：

- 这个对象有哪些字段
- 字段怎么分组
- 字段在 UI 上应该长什么样

TradingView 这类系统里，property inspector 之所以能不断扩，不是因为 UI 写得多，而是因为对象模型里本来就有足够明确的属性边界。

我们现在这一步，就是把 drawing property system 从：

- “能改”

推进到：

- “知道该怎么改”

## 这次没做什么

还没做：

- 真正的 property inspector UI
- schema 默认值/提示文案/校验规则
- drawing 多选后的 grouped schema
- `horizontal-line` 的直接编辑交互
- z-order / grouping / richer handle metadata

所以这一步是 inspector backend 边界，不是 inspector 成品。

## 验证

已运行：

```bash
pnpm --dir /Users/dev/workspace2/hc_apps/chartx2 check
pnpm --dir /Users/dev/workspace2/hc_apps/chartx2 test:unit
pnpm --dir /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-api.spec.ts -g "selected drawing state can drive a minimal property inspector flow" --config /tmp/chartx2.playwright.drawing.config.ts
```

## 一个给初学者的知识点

很多人第一次做 inspector，会先写 UI，再在点击事件里拼数据。  
这在小 demo 里很快，但对象一多就会崩。

更稳的做法是先把三层边界定清楚：

1. `state`
2. `schema`
3. `commands`

也就是：

- 当前值是什么
- 可以编辑哪些字段
- 如何把修改写回去

只要这三层分开，UI 可以随时重写，底层对象模型不用跟着烂掉。
