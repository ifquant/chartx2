# 0031: 增加第一版 pane lifecycle surface

这次提交把 `chartx2` 的 pane 能力从“内部已经能画双 pane”推进到了“public API 终于开始能管理 pane”。

重点不是直接做完任意多 series + 任意多 pane，而是先把生命周期这条路打通：

- 列出 pane
- 新增 pane
- 删除空 pane
- 调整 secondary pane 高度
- 把 volume series 显式挂到某个 secondary pane

## 这次做了什么

- 新增 `panes()`、`addPane()`、`removePane()` 这组 chart-level API
- 新增 pane handle，支持：
  - `paneIndex()`
  - `getHeight()`
  - `setHeight()`
  - `isPrimary()`
  - `hasSeries()`
  - `remove()`
- 把 `addVolumeSeries()` 扩成可指定目标 pane
- 默认 browser harness 改成通过真实的 `addPane()` 创建 volume pane
- 增加 pane lifecycle 的 public API 验证场景和快照

## 为什么这样做

因为“能画两个 pane”还不等于“有 pane lifecycle”。

如果 pane 还是内部硬编码出来的，那么后面做：

- 新指标 pane
- pane resize
- pane 删除
- pane 重排

都会重新拆一次结构。

这次先把 lifecycle surface 建起来，后面才能继续往更通用的 pane 系统扩。

## 两个实现知识点

### 1. 先把 pane 做成对象，再谈 pane 系统

很多时候一上来就想做“pane manager”，但更稳的路径是先让 pane 在 public API 里有稳定句柄。

只要用户能拿到 pane handle，后面的：

- resize
- remove
- attach series

才有可持续扩展的接口基础。

### 2. secondary pane 高度最好用“偏好高度”而不是直接写死最终像素

因为实际可用高度还会受到：

- 整体 chart 高度
- pane 间 gap
- primary pane 最小高度

影响。  
所以内部更稳的做法通常是记住 secondary pane 的偏好高度，再在布局阶段统一分配。

## 这次没有做什么

- 还没有通用的 `addSeries(..., { pane })`
- 还没有任意 series 都能挂到 secondary pane
- 还没有 pane reorder
- 还没有拖拽式 pane resize
- 还没有 pane-local public scale handles
