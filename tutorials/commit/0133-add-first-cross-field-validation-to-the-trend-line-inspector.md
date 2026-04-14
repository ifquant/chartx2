# 0133: 给 trend-line inspector 补第一条 cross-field validation

上一刀我们已经让 drawing inspector 支持了单字段校验：

- `lineWidth >= 1`
- tolerance 不能为负
- 必填字段不能为空
- select 必须落在 schema options 里

但这还只是“字段自己看自己”。  
真正的图形对象经常有更重要的一类约束：

- 两个字段之间的关系

对 `trend-line` 来说，最典型的就是：

- `startTime` 必须早于 `endTime`
- 两个端点不能完全重合

如果这类约束不做，用户虽然每个字段单独都填的是“合法值”，组合起来却还是一个坏对象。

## 这次做了什么

### 1. 增加 trend-line 的 cross-field 校验 helper

在 `+page.svelte` 里新增了几段 inspector 辅助逻辑：

- `mergeSelectedDrawingOptionsPatch(...)`
- `clearInspectorFieldErrors(...)`
- `validateTrendLineCrossFieldOptions(...)`

思路很直接：

1. 先拿当前 selected drawing 的完整 options
2. 把本次表单改动 patch 合并进去
3. 对“合并后的完整对象”做 cross-field 判断

这样校验看的是“对象下一步会变成什么”，而不是只盯着某一个字段。

## 2. 第一条 trend-line cross-field 规则

这次先落两条最关键规则：

### 规则 A

`startTime < endTime`

如果不满足：

- `startTime` 显示 `Start time must be before end time.`
- `endTime` 显示 `End time must be after start time.`

### 规则 B

端点不能完全重合：

- `startTime === endTime`
- 且 `startPrice === endPrice`

如果命中，就给：

- `startTime`
- `endTime`
- `startPrice`
- `endPrice`

都打上 `Trend-line endpoints must not overlap.`

这样对象层面最明显的坏状态第一次被拦住了。

## 3. 只有 cross-field 校验通过，才允许写回 chart

现在 inspector 的更新流程变成：

1. 先做单字段解析/范围检查
2. 再把 patch 合成完整 options
3. 如果是 `trend-line`，做 cross-field validation
4. 只有全部通过，才调用 `applySelectedDrawingOptions(...)`

这很重要，因为这样 chart 永远拿到的是通过面板约束的状态，而不是“先写进去，等出问题再说”。

## 4. 修 workbench 默认 trend-line 的可见性

这次顺手修了一个 demo 层面的实际问题：

之前默认 trend-line 用的是：

- `bars[12]`
- `bars[36]`

而 workbench 初始视口看的是整条大数据序列的尾部，所以这条 trend-line 大概率根本不在屏幕里。

这会直接导致：

- inspector 测试不稳定
- 用户打开 demo 时也不容易选中这条线

所以现在默认 trend-line 改成挂在数据尾部附近的可见区间上。  
这不是“为了测试作弊”，而是把 demo 变回真正可用的演示状态。

## 5. 补 workbench 浏览器契约

这次的 workbench 测试不只验证：

- inspector 能出现
- 单字段最小值错误能出现

还继续验证：

1. 命中一个 drawing
2. 如果不是 `trend-line`，继续扫描直到命中 `trend-line`
3. 找到 geometry 里的两个时间输入
4. 把 `endTime` 改成和 `startTime` 相同
5. 断言面板出现：

- `Start time must be before end time.`

这样 cross-field validation 就不是只存在于 helper 函数里，而是真正被 workbench UI 驱动了。

## 为什么这一步重要

因为很多对象系统一开始都只做“单字段校验”，但真正麻烦的问题通常都发生在字段组合上。

比如 trend-line：

- 一个单独的时间值没错
- 一个单独的价格值也没错

但：

- 起点时间晚于终点时间
- 或者两个端点完全重合

这个对象整体就是不对的。

所以从工程角度看：

- 单字段校验保证“字段看起来像样”
- cross-field 校验才开始保证“对象整体成立”

## 这次没做什么

还没做：

- `startPrice / endPrice` 的更复杂组合约束
- 不同 drawing type 的专属 cross-field rule registry
- engine 层级的同等约束复用
- staged form editing / dirty state
- undo/redo
- 多选后的 grouped cross-field validation

所以这一步还是 inspector 层的第一条 cross-field 规则，不是完整对象验证框架。

## 验证

已运行：

```bash
pnpm --dir /Users/dev/workspace2/hc_apps/chartx2 check
pnpm --dir /Users/dev/workspace2/hc_apps/chartx2 test:unit
pnpm --dir /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts -g "drawing inspector driven by selected drawing schema"
```

## 一个给初学者的知识点

“单字段校验”和“对象校验”不是一回事。

一个很常见的错误是：

- 先把每个字段都验了
- 然后就以为对象一定合法

这在表单系统里经常是错的。

更稳的顺序通常是：

1. 解析字段
2. 校验字段
3. 合成对象
4. 再校验对象之间的关系

只有第 4 步补上，系统才真正开始理解“这个对象是什么”。  
这也是为什么 cross-field validation 往往标志着一个 inspector 开始从 demo 进入产品化。
