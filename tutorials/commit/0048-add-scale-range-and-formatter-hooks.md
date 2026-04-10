# 0048 - 补上第一版 scale range 和 formatter hooks

这次继续把重心放在 `chartx2` 图表库本体，而不是 demo 外壳。现在和 `lightweight-charts` 的差距里，一个非常关键的问题是：外部虽然能拿到 `timeScale()` 和 `priceScale()`，但还不能真正控制可见范围，也不能接管轴标签格式。这样的 API 更像“能看看状态”，还不像真正的基础设施层。

## 本次做了什么

1. 给 `timeScale()` 补了真正的可见范围控制
   - `getVisibleLogicalRange()`
   - `setVisibleLogicalRange()`

2. 给 `priceScale()` 补了真正的可见范围控制
   - `getVisibleRange()`
   - `setVisibleRange()`

3. 给时间轴和价格轴都补了 formatter hooks
   - `tickMarkFormatter`
   - `priceFormatter`

4. 把轴渲染真正接到了这些 hooks 上
   - 不是只在类型上暴露出来
   - 价格轴标签、时间轴标签、price line 标签都会走 formatter

## 这次踩到的一个真实坑

一开始 `setVisibleLogicalRange()` 看起来像是做完了，但测试里一读范围就不对。原因不是公式错，而是内部还被两个旧约束拦住了：

1. getter 读的是上一次 render 的内部状态  
   所以刚 set 完就读，拿到的是旧值。

2. 显式可见范围 setter 还被 `MAX_BAR_SPACING` 限制  
   这相当于 API 嘴上说“给你这个范围”，实现上却偷偷说“但我最多只给你这么密”。不对。

这次两个都修了，所以现在这条 API 才是真的能用。

## 新人需要知道的两件事

1. “公开 API” 和 “内部下一帧会更新” 不是一回事  
   如果一个 getter 只有在下一次 render 后才返回正确值，那它通常不是一个好 API，至少不是一个稳定的同步 API。

2. 默认交互限制不应该误伤显式 setter  
   像滚轮缩放时保留 `MAX_BAR_SPACING` 很合理，但显式 `setVisibleLogicalRange()` 属于“用户明确命令”。这时候默认上限通常应该让路。

## 这次还没做

- tick 生成策略还是本地最小实现，还没有更接近 upstream 的密度和层次策略
- 还没有 percentage / log / invert / overlay scale 这些更深的 scale 模式
