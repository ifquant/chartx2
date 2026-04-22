# 0246: 同步 post-harness 之后的真实路线图

前一轮已经把 `chart-harness` 收成了真正的 phase-one composition root。  
问题变成了另一种：代码已经往前走了，但架构文档还留着一大串历史性的 “remaining shrink work”，后续 agent 很容易继续围着已经完成的抽取打转。

这次不再拆 runtime，而是先把路线图收正。

## 1. 为什么这一步现在必须做

`docs/chart-workstation-architecture.md` 原来在 `Post-harness shrink status` 后面还挂着一整片长清单。  
里面很多条目在今天已经不再是“未来工作”了，而是：

- 已经完成
- 已经被别的 owner/coordinator 吸收
- 或者已经不值得再作为单独目标追

如果继续让这份文档保持这种状态，会有两个直接后果：

1. 新 agent 会继续把已经完成的 harness shrink 当成 backlog  
2. 真正还值得做的方向，反而会被淹没

所以这次目标不是“补更多架构想法”，而是把文档从历史待办堆栈改成当前可执行边界。

## 2. 这次具体改了什么

### A. 精简 architecture note

改了：

- `docs/chart-workstation-architecture.md`

做法是把原来那份超长的 remaining shrink 清单整体收掉，只保留三类高信号信息：

- 什么已经完成
- 什么是文档层的约束
- 什么才是下一阶段真正的 architecture lines

新版本明确写死：

- `chart-harness` 现在应被视为薄的 composition root
- 不要再为了“继续 shrink harness”而继续拆已经稳定的边界
- 新重构必须由真实能力压力、正确性压力、或 engine/workstation boundary 压力驱动

### B. 新增专门的 post-harness roadmap

新增：

- `docs/post-harness-next-lines.md`

这份文档把下一阶段真正值得做的四条主线明确下来：

1. chart runtime container boundary
2. pane/layout model ownership
3. host/workbench contract
4. separate performance-chart family

这样后续再说“继续大粒度推进”，就不需要回到“还能从 harness 再挤出哪个 helper”这种旧思路里。

### C. README 补入口

更新：

- `README.md`

把新的 post-harness roadmap 挂到 repo layout 里，避免它只藏在 `docs/` 深处。

## 3. 这次为什么不继续拆代码

因为当前最容易犯的错误，不是代码还不够碎，而是方向已经偏了。

如果文档继续告诉后续 agent：

- 还有很多 harness shrink 没做完

那么他们就很容易继续做低收益的结构整理，而不是去处理真正下一阶段的边界问题。

在这种情况下，先把路线图收正，比再做一个没有实际收益的小 owner 更重要。

## 4. 这次之后的判断标准

后面如果再继续推进，应该优先问：

- 这一步是否在定义真实 runtime container？
- 这一步是否在加强 pane/layout 的 model ownership？
- 这一步是否在强化 host/workbench contract？
- 这一步是否在保护 `performance-chart` 不要和 market-chart runtime 混成一团？

如果都不是，那大概率就不该再作为 post-harness 主线继续做。

## 验证

- `git diff --check -- README.md docs/chart-workstation-architecture.md docs/post-harness-next-lines.md tutorials/commit/0246-sync-post-harness-roadmap.md`

## 未包含

- 没有继续做新的 runtime owner 抽取
- 没有改动 phase-one public API 或 visual contract
