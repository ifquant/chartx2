# 0320 add share dialog shell v0

## 背景

`Sync Status Shell V0` 之后，workbench 已经有了 import/export、command palette
和 adapter status 这些工作站壳能力，但分享相关的 UI 还没有真正落在页面上。

这次的目标不是直接做云端分享后端，而是先把 `sharing-surface.ts` 这条 public
contract 接到 workbench，让后续宿主可以把真实发布、权限和审核逻辑挂进来。

## 主要目标

- 在 toolbar 的 import/export 附近增加一个稳定的 Share 入口
- 用单独的 dialog shell 承载分享状态，而不是继续塞进 `adapterStatus`
- 保持这次切片 UI-only、fixture-backed、host-adapter-oriented
- 给浏览器测试补上稳定 selector，证明这条 UI seam 已经存在

## 改动概览

- 在 `src/lib/demo/chartx-demo.ts` 中增加 `shareDialog` snapshot 模型、fixture
  `SharingSurfaceHostAdapter`、可切换的 visibility 状态，以及 `share-dialog-publish`
  动作
- 在 `src/lib/demo/components/MarketWorkbenchPanel.svelte` 的 toolbar 里新增
  `data-share-dialog-trigger`，并把 dialog 渲染在 command palette 同一类 overlay
  区域
- 新增 `src/lib/demo/components/ShareDialogShell.svelte`，专门承载分享壳 UI、
  状态展示、visibility 切换和 publish 按钮
- 在 `tests/visual/phase-one-harness.spec.ts` 中增加 focused 浏览器用例，覆盖
  打开 dialog、切换 `public`、发布 fixture link 和 success notice
- 在 `docs/tradingview-alignment-plan.md` 的 sharing 章节补上 `Share Dialog Shell V0`
  的实现说明和边界

## 关键知识

### 1. 为什么不用 `adapterStatus`

`adapterStatus` 更适合表达“某个宿主适配器是否存在、缺失、报错”。分享弹窗不是一个静态
适配器状态，而是一个会经历 `ready -> publishing -> ready/error` 的交互式流程。

所以这里额外给 demo snapshot 加了 `shareDialog`，让分享壳拥有自己的模型和状态机，
避免把不同层次的东西混在一起。

### 2. 为什么用 snapshot 传 dialog，而不是继续改 `+page.svelte`

这次用户给的写入范围主要集中在 demo controller 和 workbench panel。现有
`MarketWorkbenchPanel` 已经拿到了 `snapshot`，因此最窄的做法就是把分享模型挂到
`DemoSnapshot` 上，再由 panel 在本地控制 open/close。

这样可以：

- 保持 `src/routes/+page.svelte` 继续做薄宿主壳
- 不用在这次切片里扩 public `ChartWorkbenchModel`
- 先把 host-adapter seam 证明出来，后面再决定是否需要提升到更公共的 shell contract

## 补充知识

### 1. fixture-backed 不等于随便写假数据

这里的 fixture adapter 仍然遵守 `SharingSurfaceHostAdapter` 的真实接口：
`publishArtifact(request) -> Promise<SharePublishResult>`。

好处是后面接真实宿主时，只需要替换 adapter，不需要重写 dialog shell 的 UI 交互。

### 2. transient notice 的用法

分享成功/失败属于短暂反馈，适合放在 `statusNotice` 里闪一下提醒用户，但不应该长期霸占
workbench 顶部状态区。所以这次加了一个短定时器，让 publish 结果提示会自动清掉。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts --grep "share dialog: toolbar trigger opens a fixture-backed publish shell" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## 未覆盖项

- 还没有 copy link 按钮，也没有浏览器剪贴板流程
- 还没有版本历史、review、permission matrix 或 marketplace 入口
- 真实分享后端、artifact trust policy、跨产品复用策略仍然由宿主和后续切片负责
