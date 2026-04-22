# 0250: 把 render runtime access 也收进 container

前几刀已经把 runtime container 推到了：

- 对象创建
- context/source access
- pane/scale/registry structural access

但 `chart-harness.ts` 里还留着最后一类很显眼的直接入口：

- `runtime.renderers.*`
- `runtime.secondaryScales()[0]...`

这说明 container 虽然存在，但 harness 还在直接摸内部字段和数组形态。

## 1. 这次的目标

继续把这类 render/scale read access 压成显式 container surface，而不是让 harness 继续知道内部数据怎么排布。

这次不扩成大改造，只收两块：

1. renderer runtime access
2. secondary visible-range read

## 2. container 这次新增了什么

改了：

- `src/lib/chartx/internal/views/chart-runtime-container.ts`

新增/明确的入口：

- `rendererRuntime()`
- `drawGrid(...)`
- `secondaryVisibleRange()`

这样 container 不只暴露 renderer bag，还开始提供更接近调用意图的 access surface。

## 3. harness 这次怎么变

改了：

- `src/lib/chartx/internal/views/chart-harness.ts`

具体变化：

- `renderCallbackOwner.getRendererRuntime` 现在直接走 `runtime.rendererRuntime()`
- `drawGrid` 现在走 `runtime.drawGrid(...)`
- `scaleOwner.getSecondaryVisibleRange` 现在走 `runtime.secondaryVisibleRange()`

这看起来只是几行改动，但它进一步收紧了一个边界：

- harness 不再知道 grid renderer 要从哪个 bag 里取
- harness 不再知道 secondary visible range 目前是从 `secondaryScales()[0]` 这个实现细节里读出来的

## 4. 为什么这一步还值得单独做

因为 runtime container 如果只是“把大对象装起来”，但 harness 还继续直接掏内部字段，那么边界其实并不稳。

这一步继续把调用语义写成 container surface，后面再继续推进 container ownership 时，就不用先回头清理这些低层访问模式。

## 5. 测试和验证

延续同一组验证：

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-runtime-container.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

其中这次还顺手让 unit test 继续锁住 `secondaryVisibleRange()` 的空态 contract。

## 未包含

- 没有把所有 renderer 调用都改写成更高层的 render use-case
- 没有开始 pane/layout model ownership 主线
- 没有把完整 owner graph 吸进 runtime container
