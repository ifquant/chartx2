# 0134: 把 trend-line 的 cross-field validation 收进 chart runtime

上一刀我们已经在 workbench inspector 里加了第一条 cross-field validation：

- `startTime < endTime`
- 端点不能完全重合

这一步很重要，但还不够。  
因为只要校验还停在 UI 层，就总会存在别的入口绕过去：

- public API
- restore/snapshot 路径
- 未来别的 inspector
- 自动化脚本

换句话说：

- UI 校验只能减少坏输入
- runtime 校验才真正定义“这个对象是否合法”

所以这次的目标就是把同一条约束往引擎层收。

## 这次做了什么

### 1. 增加共享的 trend-line geometry 类型

在 `chart-harness.ts` 里加了：

- `TrendLineGeometry`

它只关心四个核心坐标字段：

- `startTime`
- `startPrice`
- `endTime`
- `endPrice`

这样后面的校验 helper 就不会依赖完整 drawing 对象，只关心几何本身。

## 2. 增加 runtime 校验 helper

新增：

- `assertTrendLineGeometryValid(...)`

当前规则和 UI 那边保持一致：

### 规则 A

端点不能完全重合：

- `startTime === endTime`
- 且 `startPrice === endPrice`

### 规则 B

`startTime` 必须早于 `endTime`

如果不满足，就直接抛错：

- `chartx phase-one trend-line endpoints must not overlap`
- `chartx phase-one trend-line startTime must be before endTime`

这意味着 runtime 自己终于开始知道“什么样的 trend-line 是坏的”。

## 3. create 路径接入 runtime 校验

`createTrendLineDrawing(...)` 现在在注册 drawing 前，会先对初始几何跑：

- `assertTrendLineGeometryValid(state)`

所以：

- 一条坏的 trend-line 不会被创建出来

这一步尤其重要，因为它把“对象一出生就合法”变成了 runtime 约束。

## 4. apply 路径也接入 runtime 校验

`trend-line api.applyOptions(...)` 以前的逻辑是：

1. 哪个字段传了就直接改哪个字段
2. 然后 render

这在 cross-field 约束出现后就不够了，因为：

- 单独看 `endTime` 可能没问题
- 但跟当前 `startTime` 合起来就有问题

所以现在的顺序变成：

1. 先从当前 drawing 读出完整 geometry
2. 用 `nextOptions` 合成一份 `nextGeometry`
3. 先 `assertTrendLineGeometryValid(nextGeometry)`
4. 只有通过，才把 geometry 写回 drawing

这就是 runtime 层真正的对象级校验。

## 5. 补 API 契约

这次新增了一条 API 级浏览器契约，专门验证 runtime 校验，而不是 UI：

### 路径 A

先创建一条合法的 trend-line，然后：

- 选中它
- 调 `applySelectedDrawingOptions({ endTime: startTime })`
- 断言抛出：
  - `chartx phase-one trend-line startTime must be before endTime`

### 路径 B

直接调用：

- `addTrendLineDrawing(...)`

并传入完全重合的端点，断言抛出：

- `chartx phase-one trend-line endpoints must not overlap`

这条测试的意义是：

- 这套约束不再只是 workbench inspector 自己执行
- chart runtime 自己也会拒绝坏对象

## 为什么这一步重要

因为对象系统真正可靠，不是靠“我们希望所有 UI 都写对”，而是靠：

- runtime 自己定义合法边界

如果没有这一步，任何一个新入口都可能重新把坏状态带回来。

现在这条链路终于更完整了：

1. schema 告诉 UI 应该怎么编辑
2. inspector 在交互层先做一遍 cross-field 提示
3. runtime 再做一遍硬边界校验

这两层一起存在才对：

- UI 层负责更友好的反馈
- runtime 层负责最终一致性

## 这次没做什么

还没做：

- restore/applyChartState 时更细颗粒度的 drawing 校验报告
- engine/model 层抽出统一 drawing validator registry
- 更多 drawing type 的 cross-field rule
- richer geometry constraints
- error code / structured validation result

所以这一步仍然只是第一条 drawing runtime validation，不是完整 drawing validation framework。

## 验证

已运行：

```bash
pnpm --dir /Users/dev/workspace2/hc_apps/chartx2 check
pnpm --dir /Users/dev/workspace2/hc_apps/chartx2 test:unit
pnpm --dir /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-api.spec.ts -g "trend-line runtime validation rejects invalid geometry updates"
pnpm --dir /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts -g "drawing inspector driven by selected drawing schema"
```

## 一个给初学者的知识点

UI 校验和 runtime 校验不是重复劳动，它们解决的是不同问题：

- UI 校验：
  - 给人看的
  - 让用户尽早知道哪里错了
- runtime 校验：
  - 给系统看的
  - 保证无论从哪个入口进来，坏对象都进不去

很多系统一开始只做 UI 校验，等第二个入口出现时才发现数据边界根本没真正建立。  
真正稳的做法是：

1. UI 先提示
2. runtime 再兜底

只有这样，对象模型才算真的立住。
