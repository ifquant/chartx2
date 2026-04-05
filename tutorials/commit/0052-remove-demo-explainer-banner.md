# 0052: 去掉 demo shell 顶部的解释性横幅

这次改动非常小，但方向上很重要。

之前根页顶部还保留着一块说明性质很强的区域，会告诉用户：

- 这是样例程序
- Workbench 是完整例子
- 其它 tabs 是特性例子

这些信息对设计文档有用，但放在主界面上会让产品看起来像说明页，而不像真正的软件界面。

## 这次改了什么

- 删除了根页顶部那块解释性横幅
- 去掉了相关标题文案依赖
- 把视觉测试锚点改回更朴素的界面结构检查

对应文件：

- [src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/src/routes/+page.svelte)
- [tests/visual/phase-one-harness.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts)

## 为什么要删

因为 `chartx2` 的主界面应该更像一个图表软件，而不是一个“请先阅读这里”的介绍板。

如果用户一进来先看到一段解释，而不是图表本身和工具本身，就会破坏方向感。

## 验证

实际跑过：

- `pnpm test:visual --update-snapshots`

## 给新人的补充知识点

### 1. 设计文案和产品文案不是一回事

写给开发者看的说明，未必适合放进最终界面。

尤其是首页或主工作区，解释性文案越多，越容易把软件做成“展示板”。

### 2. 删除文案时，测试锚点也要一起调整

如果测试是依赖某句提示文案定位页面状态的，那删掉文案时必须同步改测试。

不然你会得到一种假失败：

- 功能没坏
- 测试却因为旧文案消失而挂掉
