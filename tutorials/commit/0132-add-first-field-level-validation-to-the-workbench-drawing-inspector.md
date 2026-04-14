# 0132: 给 workbench drawing inspector 补第一层字段校验

上一刀我们已经把 drawing schema 接进了 workbench inspector。  
但当时的 inspector 还只是“能显示字段、能写回值”。

这还不够，因为一个真正能用的 inspector 不能把所有输入都当成裸字符串往 chart 里灌。

例如：

- `lineWidth` 不能是 `0`
- tolerance 不能是负数
- `title` 这种字段如果被要求存在，就不能是空串
- `timeMagnetPolicy` 这种枚举字段，UI 最好直接知道可选项

所以这次不是再补新 drawing，而是把 inspector 的“正确性层”补起来。

## 这次做了什么

### 1. 给 drawing property schema 增加字段约束元数据

在 `chart-harness.ts` 里，`PhaseOneDrawingPropertyFieldSchema` 新增了：

- `required`
- `min`
- `max`
- `step`
- `options`

也就是说，schema 不再只是：

- 字段名
- 标签
- 控件类型

现在还开始告诉 UI：

- 数值最小值是多少
- 推荐步进是多少
- 文本是否必填
- `select` 可选项到底有哪些

这让 schema 更像真正的 property contract，而不只是渲染提示。

## 2. 给现有 drawing 字段补第一版约束

当前最重要的几类约束已经补上了：

- `lineWidth`
  - `min: 1`
  - `step: 1`
- `magnetTolerancePx`
  - `min: 0`
  - `step: 1`
- `timeMagnetTolerancePx`
  - `min: 0`
  - `step: 1`
- `price / startPrice / endPrice`
  - `step: 0.01`
- `startTime / endTime`
  - `step: 60000`
- `title`
  - `required: true`
- `timeMagnetPolicy`
  - `options: nearest / previous / next`

这意味着 inspector 不再需要自己“猜”这些值应该怎么填。

## 3. workbench inspector 真正消费这些 schema 约束

`+page.svelte` 现在不只是按 `control` 选控件，还会继续读取：

- `min`
- `max`
- `step`
- `required`
- `options`

所以：

- `select` 的下拉项改成来自 schema
- number input 的 `min/step/max` 来自 schema
- text input 的 `required` 来自 schema

这样 inspector UI 和 engine schema 的绑定更深了一层。

## 4. 增加字段级错误状态

之前 `updateSelectedDrawingField(...)` 只负责：

- 解析输入
- 然后直接写回

现在会先做最小校验：

- 非法数字 -> `Enter a valid number.`
- 小于最小值 -> `Must be at least X.`
- 大于最大值 -> `Must be at most X.`
- 必填字段为空 -> `This field is required.`
- 枚举值不在 options 里 -> `Select a valid option.`

如果不合法：

- 不写回 chart
- 在 inspector 当前字段下面显示错误文本

也就是说，这次第一次把“输入错误”变成了 UI 可见状态，而不是静默吞掉。

## 5. 补浏览器契约

这次没有只测 metadata，而是测 workbench 真正的交互行为：

1. 打开 workbench
2. 扫描点击 chart，直到命中默认 drawing
3. 在 inspector 里找到 `lineWidth`
4. 把它改成 `0`
5. 断言右侧出现：

- `Must be at least 1.`

这条测试的意义在于：

- schema 里的 `min: 1` 不再只是存在于数据里
- workbench UI 真的执行了它

## 为什么这一步重要

因为 inspector 真正好用，靠的不是“字段都列出来了”，而是：

- 用户输错时，系统知道这错在哪里
- UI 能把错误显式告诉用户
- chart 状态不会被明显无效的输入污染

这一步之后，drawing inspector 的层次终于变成：

1. state
2. schema
3. commands
4. validation feedback

这样后面再补：

- richer widgets
- helper text
- presets
- grouped editing

就有了正确地基。

## 这次没做什么

还没做：

- schema 级默认值提示
- 更强的 cross-field validation
- 时间字段的人类可读格式输入
- debounce / live preview / staged apply
- undo/redo
- 多选后的 grouped validation

所以这次是“第一层字段校验”，不是完整表单系统。

## 验证

已运行：

```bash
pnpm --dir /Users/dev/workspace2/hc_apps/chartx2 check
pnpm --dir /Users/dev/workspace2/hc_apps/chartx2 test:unit
pnpm --dir /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts -g "drawing inspector driven by selected drawing schema"
```

## 一个给初学者的知识点

很多人第一次做配置面板时，会把“字段 schema”和“表单校验”分成两套完全无关的东西：

- 一套在对象模型里
- 一套在 UI 表单里

这样一段时间后，两边一定漂移。

更稳的做法是让 schema 自己携带最基本的约束：

- `required`
- `min/max`
- `step`
- `options`

然后 UI 只是消费 schema。  
这样引擎和表单之间的“真相来源”才是单一的。
