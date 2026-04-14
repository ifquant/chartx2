# 0139: 把 workbench 左侧画线栏接成真正可用的创建工具

这次切片解决的是一个很具体但很影响信任感的问题：左侧看起来像“画线工具栏”，但实际上只是静态按钮；图上的线也不是用户画出来的，而是 demo 启动时预置进去的样例对象。

## 这次改了什么

### 1. 给 drawing API 补了最小 `select()` 能力

之前 `addHorizontalLineDrawing()` 和 `addTrendLineDrawing()` 只能创建对象，不能在创建后直接切到选中态。  
这会让 toolbar 创建流很别扭，因为新线出来以后还要用户自己再点一次。

这次给两种 drawing API 都补了 `select()`：

- `horizontal-line.select()`
- `trend-line.select()`

这样 workbench 在创建完 drawing 后，可以立刻把它送进右侧 inspector。

### 2. workbench controller 增加了真正的 drawing tool 状态

之前 workbench 只有：

- 主图类型状态
- 主题状态
- pane 状态
- selected drawing 状态

但没有“当前工具”。

这次新增了：

- `none`
- `horizontal-line`
- `trend-line`

并且 trend line 还额外维护了第一点击锚点，形成一个最小的两段式创建流程：

1. 第一次点图，记录起点
2. 第二次点图，生成趋势线

### 3. chart click 不再只做 readout/event log，也会在 tool mode 下创建 drawing

workbench 之前对 click 的处理只有：

- 记录最后一次点击
- 推 event log
- 发布 snapshot

现在如果当前 tool 不是 `none`，click 会优先进入创建逻辑：

- `horizontal-line`：一次点击直接创建
- `trend-line`：第一次点击存起点，第二次点击创建

同时做了两个实用处理：

- 创建后自动清掉当前 tool，避免连续误画
- trend line 第二次点击如果还在同一根 bar 上，会拒绝创建，避免撞上 runtime 的几何校验

### 4. 左侧工具栏不再是假 UI

这次只接了两个真正支持的工具：

- Horizontal line
- Trend line

其余按钮继续保留位置，但明确降成 disabled，避免继续制造“好像能用”的错觉。

active 状态也同步接上了，所以用户现在能看见：

- 当前是否处于画线模式
- 是水平线模式还是趋势线模式

### 5. 空 inspector 的提示文案会跟着工具模式走

以前右侧空状态永远只会说：

> 点击图上的线来查看属性

这在创建模式下是错的。

现在会根据工具状态显示更正确的提示：

- 水平线模式：提示点击图上放置水平线
- 趋势线模式第一步：提示点击起点
- 趋势线模式第二步：提示点击第二个点完成趋势线

## 为什么这次还改了几条看起来不相关的测试

这次把 toolbar creation 真正接通后，顺手把之前已经漂移但还没收口的测试契约一起修正了：

- 主图切换后的主序列 label 断言
- drawing snapshot 现在会带上 magnet 默认字段
- 多张 visual baseline 已经和当前真实行为重新对齐

这些不是顺手乱改，而是因为完整 `pnpm test` 已经把旧契约暴露出来了。既然这刀已经触到 workbench / drawing / visual regression，就应该一起收干净。

## 这次验证了什么

- `pnpm check`
- `pnpm test`
- 新增 workbench browser contract：
  - 选 `Horizontal line` 工具后单击创建
  - 选 `Trend line` 工具后双击两点创建

## 现在还没做什么

这次只把“创建工具”闭环接通到 workbench，没有把 drawing toolbar 做成完整产品级工具系统，仍然缺：

- 更多 drawing tool 类型
- toolbar 分组与二级菜单
- 创建时的预览 ghost
- 连续绘制模式
- drawing tool preset / remember last tool

## 一个给初学者的实现提醒

当一个 UI “看起来能点”，但后面根本没有状态和行为时，问题不只是功能没做完，而是 **界面在撒谎**。  
这类问题优先级通常比单纯缺一个按钮更高，因为它会直接破坏用户对整个系统的信任。

另外，创建工具这类交互经常不是“多加一个 click handler”就完了，至少要先想清楚 3 个状态：

1. 当前选中的对象
2. 当前启用的工具
3. 当前是否处在半完成创建流程中

这次的 trend-line 两击创建，本质上就是把第 3 个状态补出来了。
