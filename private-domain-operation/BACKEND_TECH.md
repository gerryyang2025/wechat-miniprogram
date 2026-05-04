# 后端技术方案文档

文档版本：`v0.5`

创建日期：`2026-05-04`

关联文档：

- [DESIGN.md](./DESIGN.md)
- [CORE_REQUIREMENTS.md](./CORE_REQUIREMENTS.md)
- [MVP_FEATURES.md](./MVP_FEATURES.md)
- [GLOSSARY.md](./GLOSSARY.md)

## 1. 文档职责

为减少跨文档重复，本文档只承担以下职责：

- 记录后端技术栈与架构建议
- 记录关系型数据库、etcd、COS（Cloud Object Storage）的职责分工
- 记录后端接口、事务、模块划分和存储约束

以下内容不在本文档详细展开：

- 高层产品定位、场景与能力架构：见 [DESIGN.md](./DESIGN.md)
- 核心业务诉求与平台边界：见 [CORE_REQUIREMENTS.md](./CORE_REQUIREMENTS.md)
- 一期功能范围、优先级与验收标准：见 [MVP_FEATURES.md](./MVP_FEATURES.md)
- 缩写、英文术语和专有名词解释：见 [GLOSSARY.md](./GLOSSARY.md)

## 2. 一期后端定位

一期后端负责支撑以下核心闭环：

- 商品上架与内容展示
- 课程学习与进度
- 直播准入与直播互动
- 用户运营与学习档案
- 基础内容与直播数据统计

当前 `MVP` 边界说明：

- 平台审核端功能作为后期实现，不纳入当前一期开发
- 订单、支付、分销佣金、提现等付费相关功能作为后期实现
- 直播室一期优先使用 `微信原生直播能力`，若原生方案无法满足需求，再评估其他方案

## 3. 技术栈要求

- 服务框架：`Golang + Gin（Go Web Framework）`
- Go 版本：建议使用当前稳定版，并在团队内固定主版本
- 业务主数据库：`MySQL 8.0`
- 轻量元数据与协调存储：`etcd`
- 文件资源存储：`COS（Cloud Object Storage）对象存储`
- 直播能力：一期优先接入 `微信原生直播能力`

备选方案：

- 如果后续业务明显转向更重的复杂分析和更灵活的数据扩展，可评估 `PostgreSQL + etcd + COS（Cloud Object Storage）`
- 当前一期默认推荐为 `MySQL 8.0 + etcd + COS（Cloud Object Storage）`

## 4. 为什么需要关系型数据库

当前业务包含以下典型强事务与复杂查询场景：

- 订单创建、支付状态流转
- 课程权限开通与失效
- 分销归因与佣金记录
- 提现申请、审核与状态变更
- 用户购买记录、学习记录、后台筛选与报表统计

如果只使用 `etcd + COS（Cloud Object Storage）`，会在以下方面承担较高复杂度：

- 多条件列表筛选
- 跨实体关联查询
- 事务一致性保障
- 聚合报表与对账
- 运营后台分页与统计分析

因此，一期建议明确引入 `MySQL 8.0` 作为主业务数据库。

## 5. 存储分工

### 5.1 MySQL 8.0

主要承载：

- 用户、商家、讲师、推广员
- 商品、课程、训练营、会员
- 订单、支付记录、退款记录
- 课程权限、学习进度、作业、测验
- 分销关系、佣金记录
- 提现申请、审核记录
- 运营记录与基础统计结果

### 5.2 etcd

主要承载：

- 系统配置
- 轻量业务元数据
- 分布式锁
- 会话短状态
- 直播间短状态
- 观看权限缓存或准入状态
- 资源轻量索引

不建议作为以下数据的唯一真源：

- 订单
- 支付
- 提现
- 分销结算
- 长期学习档案

### 5.3 COS（Cloud Object Storage）

主要承载：

- 视频
- 音频
- 图片
- 课件附件
- 直播回放资源

### 5.4 可选增强：VOD（Video on Demand）

如果后续视频量、转码需求、回放分发需求明显上升，可在 `COS` 之上进一步评估接入 `VOD（云点播）`，承接以下能力：

- 上传管理
- 转码
- 截图与封面处理
- 回放分发
- 防盗链与播放优化

## 6. 媒资数据组织建议

- `COS（Cloud Object Storage）`：保存视频本体、封面、附件、回放文件
- `MySQL 8.0`：保存媒资与课程、讲师、订单权益、直播回放之间的主业务关联
- `etcd`：保存 `COS（Cloud Object Storage）` 对象键、访问地址、封面图、转码结果、时长、大小、权限状态和轻量索引信息

## 7. 服务架构建议

一期后端采用 `单体模块化` 架构，先保证交付效率，再为后续拆分预留边界。

`Gin（Go Web Framework）` 主要承担：

- 路由
- 中间件
- 鉴权
- 请求编排
- 统一响应

复杂业务逻辑不直接堆在 handler 中。

推荐按以下分层组织：

- `handler`：HTTP（HyperText Transfer Protocol）路由、参数解析、响应格式化
- `service`：业务编排、事务边界、幂等控制
- `domain`：核心领域对象与领域规则
- `repository`：数据库、etcd、COS（Cloud Object Storage）访问封装
- `integration`：微信支付、消息通知、云存储、直播服务等外部集成
- `jobs`：异步任务、补偿任务、统计聚合任务

可参考的目录结构：

```text
backend/
├── cmd/
├── internal/
│   ├── handler/
│   ├── service/
│   ├── domain/
│   ├── repository/
│   ├── integration/
│   ├── jobs/
│   ├── middleware/
│   └── pkg/
├── configs/
└── migrations/
```

## 8. 领域模块划分建议

业务模块至少按以下领域拆分：

- 用户
- 商家
- 商品
- 订单
- 学习
- 直播
- 营销
- 分销
- 提现
- 运营
- 统计

建议的一期优先级：

- `P0（Priority 0）领域`
  - 用户
  - 商品
  - 学习
  - 直播
  - 运营
  - 统计
- `P1（Priority 1）领域`
  - 订单
  - 营销
  - 分销
  - 提现
  - 深度统计

## 9. 核心数据模型建议

### 9.1 账号与权限

建议至少包含：

- 用户表
- 商家表
- 角色表
- 用户角色关系表
- 登录会话表或登录记录表

### 9.2 商品与内容

建议至少包含：

- 商品表
- 商品 SKU（Stock Keeping Unit）或价格配置表
- 课程表
- 课程章节表
- 训练营表
- 训练营任务表
- 会员权益表
- 媒资表

### 9.3 交易与支付

以下数据模型为后期支付链路保留设计，不纳入当前 MVP 开发范围。

建议至少包含：

- 订单表
- 订单项表
- 支付单表
- 支付回调记录表
- 售后或退款记录表
- 权益发放记录表

### 9.4 学习与直播

建议至少包含：

- 学习进度表
- 最近学习位置表
- 作业表
- 作业提交表
- 测验记录表
- 直播房间表
- 直播场次表
- 直播观看权限规则表
- 直播回放表

### 9.5 分销与提现

以下数据模型为后期资金链路保留设计，不纳入当前 MVP 开发范围。

建议至少包含：

- 推广员表
- 分销关系表
- 佣金记录表
- 提现账户表
- 提现申请表
- 提现审核记录表

## 10. 关键业务链路建议

### 10.1 下单与支付

该链路作为后期实现保留设计，不纳入当前 MVP。

建议链路：

1. 校验商品状态、价格、用户身份与购买资格
2. 创建订单与订单项
3. 创建支付单
4. 调用微信支付下单
5. 接收支付回调并做签名校验
6. 更新订单、支付单状态
7. 发放课程 / 训练营 / 会员权益
8. 写入后续异步任务，例如消息通知、统计聚合

### 10.2 学习进度

建议链路：

1. 播放或学习行为上报
2. 更新最近学习位置
3. 计算章节完成状态
4. 更新课程整体进度
5. 异步刷新学习统计看板

### 10.3 直播准入

建议链路：

1. 查询直播房间的准入规则
2. 校验用户是否具备进入资格，例如是否属于指定课程、训练营或角色范围
3. 生成短期准入状态，可写入 `etcd`
4. 进入直播间时做二次校验

一期建议：

- 优先基于 `微信原生直播能力` 实现直播间
- 当前 MVP 的准入规则优先采用课程范围、训练营范围、账号身份等非支付条件
- 若后续出现更复杂的互动、推流、回放或准入要求，再评估切换其他直播技术方案

### 10.4 提现

该链路作为后期实现保留设计，不纳入当前 MVP。

建议链路：

1. 校验提现主体与可提现余额
2. 创建提现申请
3. 进入审核流程
4. 审核通过后发起打款或结算
5. 回写打款结果、失败原因和状态变更记录

## 11. 接口规范建议

### 11.1 API（Application Programming Interface）组织

- 推荐统一前缀，如 `/api/v1`
- 按领域分组，例如：
  - `/auth`
  - `/products`
  - `/orders`
  - `/learning`
  - `/live`
  - `/distribution`
  - `/withdrawals`

### 11.2 响应规范

- 统一返回结构
- 统一错误码
- 统一分页参数
- 统一请求追踪字段，如 `request_id`

### 11.3 幂等与补偿

- 下单、支付回调、权益发放、提现申请等接口需具备幂等能力
- 支付成功但权益发放失败时，应有异步补偿任务
- 提现打款失败时，应保留重试或人工处理状态

## 12. 数据库与索引建议

- 每张核心业务表都应明确主键、创建时间、更新时间、状态字段
- 订单、支付、分销、提现等高频查询表，应优先设计联合索引
- 列表筛选字段如 `merchant_id`、`user_id`、`status`、`created_at` 应尽早纳入索引设计
- 学习进度类表需避免高频覆盖式大事务更新，必要时拆分“最近位置”和“聚合进度”
- 统计报表类查询与交易主链路解耦，必要时通过异步汇总表承接

## 13. 配置、观测与安全建议

### 13.1 配置管理

- 环境配置、第三方密钥、回调地址和开关项统一管理
- 敏感配置不写死在代码仓库
- 通过 `etcd` 或配置中心承接可热更新的轻量配置

### 13.2 观测能力

- 统一接入访问日志
- 关键业务链路记录审计日志
- 为支付、提现、分销、直播准入等关键动作埋点
- 为异步任务提供重试、告警和死信处理能力

### 13.3 安全要求

- 支付回调必须做签名校验
- 上传与访问 COS（Cloud Object Storage）资源时应控制权限、时效和防盗链策略
- 直播准入、课程权限、推广员身份和提现资格都应服务端校验
- 对后台管理接口、资金接口和数据导出接口做更严格的权限控制

## 14. 接口与事务约束

- 接口形态以 `HTTP（HyperText Transfer Protocol） JSON（JavaScript Object Notation） API（Application Programming Interface）` 为主
- 统一处理鉴权、幂等、审计日志、错误码和分页规范
- 订单、支付、权益发放、提现等链路必须以事务一致性为核心设计
- 统计分析与经营报表优先基于 `MySQL 8.0` 业务数据生成，不依赖对 `etcd` 的大范围直接扫描

## 15. 特殊场景建议

### 15.1 直播准入

- 直播观看权限的最终业务规则应基于主业务数据判断
- `etcd` 可作为直播间准入短状态或缓存层

### 15.2 提现

- 个人与公司提现都应有明确的账户信息、申请状态、审核记录和打款结果记录
- 提现相关主流程数据建议全部落在 `MySQL 8.0`

### 15.3 分销

- 分销归因、佣金计算、提现关系和结算记录建议全部使用关系型数据建模

## 16. 关键参考特性指引

### 16.1 Gin

- 文档总览：
  https://gin-gonic.com/en/docs/
- 特性介绍：
  https://gin-gonic.com/en/docs/introduction/

### 16.2 MySQL 8.0

- InnoDB 存储引擎与 ACID（Atomicity, Consistency, Isolation, Durability）能力：
  https://dev.mysql.com/doc/refman/8.0/en/innodb-introduction.html
- InnoDB 事务模型：
  https://dev.mysql.com/doc/refman/8.0/en/innodb-transaction-model.html
- 事务隔离级别：
  https://dev.mysql.com/doc/refman/8.0/en/innodb-transaction-isolation-levels.html
- JSON（JavaScript Object Notation）能力：
  https://dev.mysql.com/doc/refman/8.0/en/json-functions.html
- JSON_TABLE 能力：
  https://dev.mysql.com/doc/mysql/8.0/en/json-table-functions.html
- 索引创建：
  https://dev.mysql.com/doc/mysql/8.0/en/create-index.html

### 16.3 etcd

- Key-Value API 与数据单元：
  https://etcd.io/docs/v3.7/learning/api/
- 存储与请求限制：
  https://etcd.io/docs/v3.6/dev-guide/limit/

### 16.4 COS

- 对象存储产品概览：
  https://cloud.tencent.com/document/product/436
- 对象概述：
  https://cloud.tencent.com/document/product/436/13324

### 16.5 VOD

- 云点播产品概述：
  https://cloud.tencent.com/document/product/266/2833
