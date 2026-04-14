# 0116: 给 drawing selection 补最小键盘命令

本次提交把 drawing 从“能选中”推进到“能最小管理”。

之前 chart 已经支持：

- `horizontal-line` / `trend-line` drawing
- 点击命中后的 selection
- selection change 订阅

但还缺一个很基础的对象命令面：

- 选中后如何快速取消选择
- 选中后如何直接删除对象

这次补的是最小键盘命令，不碰更重的拖拽编辑或 z-order。

## 做了什么

### 1. 给 selected drawing 接上 `Escape`

当 canvas 已经聚焦且当前有 selected drawing 时：

- `Escape`
  - 清空当前 selection
  - 触发 selection change
  - 保持 drawing 实体不删除

这让 selection 不再只能靠点击空白处消失。

### 2. 给 selected drawing 接上 `Delete / Backspace`

当当前有 selected drawing 时：

- `Delete`
- `Backspace`

都会删除当前选中的 drawing。

这里直接复用已有的 drawing remove 路径，而不是单独再写一套删除逻辑，这样可以确保：

- drawing registry 一致
- selection 会被清空
- canvas 会重新渲染

### 3. 增加浏览器契约测试

新增的 visual/API 测试覆盖了：

1. 点击命中并选中 `trend-line`
2. 按 `Escape` 后 selection 变成 `null`
3. 再次选中 `trend-line`
4. 按 `Delete` 后 drawing 数量减少
5. 剩余 drawing 确认还是 `horizontal-line`

这条测试把“selection 不是只有视觉高亮，而是真正能被命令系统消费”锁住了。

## 为什么先做这一步

因为 drawing 要变成真正对象，最小闭环通常是：

1. 创建
2. 命中 / 选中
3. 删除 / 取消
4. 再往后才是拖拽和编辑

如果第 3 步缺失，selection 只是一个 UI 状态，不是对象系统的一部分。

## 当前仍未解决

这次**没有**做：

- trend-line 端点拖拽
- drawing 多选
- drawing z-order
- drawing grouping
- drawing toolbar / command palette

所以它仍然只是最小对象命令面，不是完整 drawing editor。

## 验证

本次实际跑过：

```bash
pnpm check
pnpm test:unit
pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "drawing selection responds to escape and delete keys" --config /tmp/chartx2.playwright.drawing.config.ts
```

## 一个小知识点

很多图表软件里，`selection` 和 `persistence` 是两条线：

- drawing 本身需要进入 template / snapshot
- selection 往往只是运行时交互状态，不应该直接持久化

这次的键盘命令仍然遵守这个边界：  
删除的是 drawing 对象，清空的是运行时 selection。
