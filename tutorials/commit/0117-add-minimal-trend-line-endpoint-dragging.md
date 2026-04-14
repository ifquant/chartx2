# 0117: 给 trend-line 补最小端点拖拽

这次提交把 drawing 从“能选中、能删除”继续推进到“能编辑”。

目标不是一次做完整 drawing editor，而是先补一个最小但真实可用的交互：

- 选中 `trend-line`
- 从线段本体按下并拖动
- 自动拖最近的那个端点

这一步比“必须点到一个很小的端点圈”更实用，也更适合作为第一条浏览器契约。

## 做了什么

### 1. 在 pointer 交互里新增 drawing drag 分支

chart 现在除了：

- pane resize
- chart pan

之外，还多了一条：

- selected trend-line endpoint drag

也就是 `pointerdown -> pointermove -> pointerup` 这套事件流里，drawing 编辑已经不再被迫走 chart pan。

### 2. 允许从 selected line body 进入拖拽

不是只有“点中端点”才算命中。

当前规则是：

- 如果离 start endpoint 更近，就拖 `start`
- 如果离 end endpoint 更近，就拖 `end`
- 只要命中了 selected trend-line 的线段本体，就可以进入这个最近端点拖拽

这让第一版交互更宽容，不会因为端点 hit target 太小而难以使用。

### 3. 拖拽时同时更新 time 和 price

拖拽不是只改价格。

当前实现会把拖拽点同时映射回：

- chart 当前共享 `TimeScale` 上最近的 logical time
- 当前 pane 的 `PriceScale` 上对应的 price

所以 trend-line endpoint 在拖动后，会真实改写：

- `startTime / startPrice`
- 或 `endTime / endPrice`

## 浏览器契约怎么锁

新增了一条定向 Playwright 契约：

1. 建一个带主图和一条 trend-line 的 chart
2. 用真实命中路径把 trend-line 选中
3. 从已命中的 line body 发起拖拽
4. 校验拖拽后至少有一个 endpoint 发生变化
5. 校验 selection 仍然保持在 trend-line 上

这里故意不把第一版契约写成“必须拖 start endpoint”，因为当前交互定义是“拖最近端点”，所以更正确的断言是：

- 至少有一个端点真的被改动

而不是把测试绑死在某个端点名字上。

## 为什么这样切

因为 drawing 编辑的合理最小闭环通常是：

1. create
2. hit-test / select
3. clear / delete
4. drag one editable handle

如果跳过第 4 步，drawing 仍然只是“可管理对象”，不是“可编辑对象”。

## 这次仍然没做

这次**没有**做：

- endpoint 单独可视 hover state
- 拖拽中吸附 / snapping
- 多选
- z-order
- trend-line 整体平移
- 其他 drawing 类型的拖拽编辑

所以这仍然只是最小 trend-line 编辑路径，不是完整 drawing editor。

## 验证

本次实际跑过：

```bash
pnpm check
pnpm test:unit
pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "nearest endpoint from the line body" --config /tmp/chartx2.playwright.drawing.config.ts
```

## 一个小知识点

图表软件里，第一版 drawing 编辑通常不要把命中条件设计得过窄。

如果一开始就要求用户必须精确点到一个很小的 endpoint handle：

- 交互会显得“像坏了”
- 自动化测试也会很脆

先允许“从已选中对象的线段本体进入最近端点编辑”，通常是更稳的第一步。  
等后面有 hover handles、snapping、toolbar 再把交互做细。
