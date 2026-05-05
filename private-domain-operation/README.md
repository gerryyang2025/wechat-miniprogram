# private-domain-operation

这是一个面向 `个人 IP（Personal Brand）`、课程交付、直播互动与私域运营的微信小程序原型项目，包含当前可运行的前端原型实现以及配套的产品、技术和实现文档。

当前阶段以 `微信小程序` 为一期实现平台，目标是帮助讲师、教培机构、品牌主理人和内容创业者在微信生态内完成：

- 个人 IP 展示与品牌承接
- 课程、训练营、会员等知识商品上架与售卖
- 学员学习、直播互动、用户沉淀
- 分销推广、私域转化、提现结算
- 商家经营分析与运营复盘

## 系统定位

这套系统主要用于打造 `个人 IP` 和私域经营闭环，不只是一个单纯的卖课工具，而是围绕以下四类能力展开：

- 内容交付：课程、训练营、直播、回放、资料附件
- 私域运营：用户标签、学习档案、线索跟进、直播准入
- 交易变现：下单、支付、分销、推广员、提现
- 经营管理：商品管理、订单管理、学情统计、经营复盘

## 一期平台范围

- 前端：微信小程序原生技术栈
- 后端：`Golang + Gin（Go Web Framework）`
- 主业务数据库：`MySQL 8.0`
- 轻量元数据与协调存储：`etcd（分布式键值存储）`
- 大文件资源存储：`COS（Cloud Object Storage）`

## 主要功能

一期 MVP 当前重点覆盖：

- 核心需求对应的产品原型页面
- 课程商品上架与内容展示
- 听课进度显示
- 直播授课与直播观看权限控制
- 优先接入微信原生直播能力
- 商家工作台与基础数据分析
- 训练营与基础学习交付能力

当前 MVP 实施策略：

- 先完成核心需求相关的页面原型、信息布局和主路径跳转
- 再按模块逐步接入视频播放、直播观看、学习进度、训练营打卡等具体功能
- 直播和视频播放优先实现最小可用版本，再逐步增强互动与细节体验

当前代码实现进度：

- 已完成 `首页 / 学习 / 课程播放 / 我的` 四个用户端原型页
- 已接入两门可播放示例课程：`AIGC 视频制作`、`微信小游戏开发`
- 首页 `Banner` 自动轮播、已购课程摘要和学习页继续学习主路径已可直接体验
- 更细的实现状态与下一步计划见 [IMPLEMENTATION_TRACKER.md](./docs/IMPLEMENTATION_TRACKER.md)

文档目录约定：

- 项目根目录只保留当前入口 [README.md](./README.md)
- 其余主设计、需求、技术与跟踪文档统一收纳在 [`docs/`](./docs/)

后期规划：

- 平台审核端功能
- 支付、订单与售后闭环
- 分销 / 推广员体系
- 个人 / 公司提现

## 文档导航

- [README.md](./README.md)
  - 顶层入口文档，说明系统定位、主要功能、技术栈和文档结构
- [DESIGN.md](./docs/DESIGN.md)
  - 产品总设计文档，记录产品定位、能力架构、平台策略与演进方向
- [CORE_REQUIREMENTS.md](./docs/CORE_REQUIREMENTS.md)
  - 产品核心需求文档，记录当前最明确的业务诉求与平台边界
- [MVP_FEATURES.md](./docs/MVP_FEATURES.md)
  - 一期 `MVP（Minimum Viable Product）` 功能范围、优先级与验收清单
- [IA_PAGES.md](./docs/IA_PAGES.md)
  - 页面 `IA（Information Architecture）` 文档，记录页面结构图、页面清单与跳转关系
- [PROTOTYPE_PROMPTS.md](./docs/PROTOTYPE_PROMPTS.md)
  - 页面原型提示词文档，记录使用 `Nano Banana AI` 生成交互图的页面提示词
- [FRONTEND_TECH.md](./docs/FRONTEND_TECH.md)
  - 前端技术方案文档，记录微信小程序前端技术栈与实现约束
- [BACKEND_TECH.md](./docs/BACKEND_TECH.md)
  - 后端技术方案文档，记录后端架构、数据库、存储与事务设计
- [REFERENCE.md](./docs/REFERENCE.md)
  - GitHub 开源项目参考文档，记录相似项目排名、借鉴方向与实现参考价值
- [GLOSSARY.md](./docs/GLOSSARY.md)
  - 术语与缩写表，统一解释 `MVP`、`SCRM`、`CTA`、`SDK`、`API` 等容易歧义的术语
- [IMPLEMENTATION_TRACKER.md](./docs/IMPLEMENTATION_TRACKER.md)
  - 实现跟踪文档，记录当前已完成功能、待实现功能与下一步修改计划

## 术语说明

为避免歧义，文档中的缩写、专有名词和英文术语统一维护在：

- [GLOSSARY.md](./docs/GLOSSARY.md)

## 当前建议的研发路线

1. 先用产品文档统一定位、核心需求和一期范围。
2. 先完成核心需求相关的页面原型和交互走查。
3. 再基于页面 `IA` 和技术文档输出接口清单、表结构草案和模块接入顺序。
4. 最后进入微信小程序与后端工程的实际搭建。
