# 0042: 给 pane snapshot 补上稳定的 series id 和 label

这次提交继续沿 pane snapshot 的 series 元数据往前推，目标不是扩更多字段，而是先把最基础、最稳定的 identity 补齐。

## 为什么这一步重要

如果 snapshot 只有：

- `kind`
- `pointCount`

那 host 层虽然知道这个 pane 里是什么，但还不能稳定地区分“这次事件里的 volume”和“下一次事件里的 volume”是不是同一条 series。做 pane header、legend、状态同步时就会很别扭。

所以这次直接把两样最关键的 identity 信息补进去：

- `id`
- `label`

## 这次做了什么

1. 给每条 series 分配稳定的内部 `id`
2. 基于 kind + 创建顺序生成默认 `label`
3. 把 `id / label / kind / pointCount` 一起放进 pane snapshot 的 `series`
4. 对应测试里补了断言，确保同一条 `volume` series 在多次 pane event 里 `id/label` 都保持稳定

## 给新人的两个提示

1. 做事件 snapshot 时，`kind` 解决“这是什么”，`id` 解决“这是不是同一个东西”，两者用途完全不同。
2. 即使还没开放用户自定义 label，也可以先提供稳定默认 label。很多 host 场景已经够用了，后面再扩展 public options 也更容易。
