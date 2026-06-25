# private-domain-operation 直播管理与准入闭环设计

日期：`2026-06-25`

状态：`已确认设计，待实现计划`

## 1. 背景

`private-domain-operation` 已经完成 SQLite、微信登录、种子课程读取、学习进度、商家课程编辑和学情摘要的第一条真实前后端联调闭环。下一阶段不再优先建设媒体上传交付系统；课程和直播媒体先采用外部 HTTPS 链接方式承接。

本轮设计聚焦直播相关能力，目标是让商家可以管理直播活动、配置观看权限，学员端可以按权限进入直播或回放。微信原生直播、互动消息、订阅提醒和支付购买链路都不进入本阶段。

## 2. 目标

本阶段打通一条直播最小真实闭环：

```text
商家创建/编辑直播
  -> 配置直播/回放 HTTPS 链接
  -> 配置观看权限
  -> 用户端读取直播列表和详情
  -> 用户进入直播前后端准入校验
  -> 有权限则优先 web-view 打开链接
  -> 无权限则展示准入说明和引导入口
```

核心目标：

- 商家可新建、编辑直播活动，并手动覆盖直播状态
- 商家可配置直播链接、回放链接、开播时间和观看权限
- 用户端直播列表、直播详情和直播间读取真实 SQLite 数据
- 后端使用最小授权表做直播观看强校验
- 第一版用 seed 授权跑通课程、训练营、会员权限模型
- 保留 mock fallback，避免后端未启动时用户端原型不可用

## 3. 非目标

本阶段不做以下能力：

- 不接微信原生直播 `roomId`
- 不做直播聊天、提问、笔记等互动数据存储
- 不做订阅消息、开播提醒或预约提醒
- 不做直播删除、复制、批量操作
- 不接订单、支付、分销或购买后自动授权
- 不做视频上传、SFTP 上传 UI 或媒体转码
- 不保证微信业务域名已经审核通过
- 不处理外部直播平台自身稳定性

## 4. 范围

### 4.1 商家端

- 复用现有 `pages/live-management/live-management`
- 新增 `pages/live-edit/live-edit`
- 支持新建直播
- 支持编辑直播基础信息、直播链接、回放链接、时间、状态覆盖、观看权限
- 支持直播列表按状态筛选

### 4.2 用户端

- `pages/live-list/live-list` 接真实直播列表接口
- `pages/live-detail/live-detail` 接真实直播详情接口
- `pages/live-room/live-room` 在进入直播或回放前调用准入校验
- 新增 `pages/web-viewer/web-viewer`，用于优先打开 HTTPS 链接
- 如果 web-view 不可用或链接不符合要求，降级展示复制链接

### 4.3 权限范围

直播观看权限第一版支持：

- 全部用户
- 指定课程学员
- 指定训练营成员
- 指定会员计划

第一版授权来源使用 seed 数据，表结构预留后续订单、手动授权、会员和训练营来源。

## 5. 方案选择

采用方案：`直播管理完整最小闭环`

选择原因：

- 能同时验证商家配置、用户端消费和后端准入校验
- 能承接现有直播管理页、直播列表、直播详情和直播间原型
- 不被微信原生直播资质、订阅消息、实时互动能力卡住
- 与刚完成的课程编辑闭环模式一致，便于复用 API、权限和页面组织方式

未选方案：

- `后端优先闭环`：模型稳，但短期用户端看不到完整产品效果
- `商家端优先闭环`：管理体验可见，但无法验收观看权限配置
- `微信原生直播优先`：平台依赖更强，个人开发者或资质限制可能阻塞

## 6. 数据模型

### 6.1 直播活动

基于现有 `live_events` 表增量补充字段。字段命名在实现计划阶段与当前 migration 对齐。

建议字段：

- `title`
- `summary`
- `speaker`
- `start_at`
- `end_at`
- `status_override`
- `live_url`
- `replay_url`
- `cover_url`
- `visibility`
- `visibility_ref_id`
- `replay_enabled`
- `updated_at`

`status_override` 为空时，由后端按时间推导状态。可选覆盖值：

- `upcoming`
- `live`
- `ended`
- `replay`

`visibility` 可选值：

- `all`
- `course`
- `bootcamp`
- `member`

### 6.2 内容授权表

新增最小授权表 `content_access_grants`。

建议字段：

- `id`
- `user_id`
- `access_type`
- `access_ref_id`
- `source_type`
- `source_id`
- `starts_at`
- `expires_at`
- `status`
- `created_at`
- `updated_at`

`access_type` 可选值：

- `course`
- `bootcamp`
- `member`

`source_type` 第一版使用：

- `seed`

后续可扩展：

- `order`
- `manual`
- `membership`
- `campaign`

### 6.3 Seed 数据

第一版 seed 至少提供：

- 1 个未开始直播
- 1 个直播中或可覆盖为直播中的直播
- 1 个带回放链接的直播
- 种子用户的课程授权
- 可选训练营授权
- 可选会员授权

这样可以验收 `all/course/bootcamp/member` 四类准入规则。

## 7. 后端接口设计

后端继续沿用 Gin + service + repository 分层。错误响应沿用现有统一响应格式。

### 7.1 用户端接口

- `GET /api/v1/live-events?status=all|upcoming|live|replay`
  - 返回用户端直播列表
  - 输出后端统一计算的 `effectiveStatus`

- `GET /api/v1/live-events/:live_id`
  - 返回直播详情、讲师、时间、观看范围和当前状态

- `GET /api/v1/live-events/:live_id/room`
  - 返回直播间展示数据
  - 不直接泄露未准入用户的目标链接

- `POST /api/v1/live-events/:live_id/access-check`
  - 登录后调用
  - 校验当前用户是否可进入直播或回放
  - 根据状态返回直播链接或回放链接

准入成功响应示例：

```json
{
  "allowed": true,
  "mode": "live",
  "targetUrl": "https://example.com/live",
  "openMethod": "web_view",
  "fallbackAction": "copy_link"
}
```

准入失败响应示例：

```json
{
  "allowed": false,
  "reason": "需要购买指定课程后观看",
  "requiredAccess": {
    "type": "course",
    "title": "AIGC 视频制作",
    "entry": {
      "url": "/pages/product-detail/product-detail?courseId=course-aigc-video",
      "method": "navigateTo"
    }
  }
}
```

### 7.2 商家端接口

- `GET /api/v1/merchant/live-events?status=all|upcoming|live|ended|replay`
  - 返回商家直播管理列表

- `POST /api/v1/merchant/live-events`
  - 新建直播活动

- `GET /api/v1/merchant/live-events/:live_id/edit`
  - 获取直播编辑页数据

- `PUT /api/v1/merchant/live-events/:live_id`
  - 保存直播标题、简介、讲师、时间、链接、状态覆盖和观看权限

- `GET /api/v1/merchant/access-options`
  - 返回课程、训练营、会员计划选项
  - 用于直播编辑页选择准入范围

## 8. 前端页面设计

### 8.1 商家直播管理页

`pages/live-management/live-management` 改为接口优先：

- 调用 `fetchLiveManagementPageData(activeTab)`
- 保留筛选：全部、未开始、直播中、已结束
- 列表展示标题、状态、时间、观看范围、链接配置状态
- 每个直播卡片提供“编辑”入口
- 底部“新建直播”进入 `pages/live-edit/live-edit`

### 8.2 直播编辑页

新增 `pages/live-edit/live-edit`。

字段区块：

- 基础信息：标题、简介、讲师、封面 URL
- 时间配置：开始时间、结束时间
- 链接配置：直播 HTTPS 链接、回放 HTTPS 链接
- 状态配置：自动、未开始、直播中、已结束、回放可看
- 权限配置：全部用户、指定课程学员、指定训练营成员、指定会员计划

保存行为：

- 新建时调用 `POST /api/v1/merchant/live-events`
- 编辑时调用 `PUT /api/v1/merchant/live-events/:live_id`
- 保存成功后可停留并提示，也可返回列表；实现计划阶段选一种并保持一致

### 8.3 用户直播列表页

`pages/live-list/live-list` 改为接口优先：

- 展示直播状态、时间、讲师、准入说明
- 点击进入直播详情
- 后端不可用时保留 mock fallback

### 8.4 用户直播详情页

`pages/live-detail/live-detail` 改为接口优先：

- 展示标题、简介、讲师、开播时间、观看范围、状态
- 主按钮按状态展示：
  - `upcoming`：等待开播
  - `live`：进入直播
  - `replay`：观看回放
  - `ended`：回放准备中
- 点击进入直播或回放时调用 `access-check`

### 8.5 用户直播间页

`pages/live-room/live-room` 作为准入承接页：

- 如果 `allowed=true`，优先跳转 `pages/web-viewer/web-viewer?url=...`
- 如果 web-view 不可用、链接缺失或链接不是 HTTPS，展示复制链接按钮
- 如果 `allowed=false`，展示准入原因和引导入口
- 保留现有公告、消息、输入栏等静态 UI 展示，不接后端互动

### 8.6 Web-view 承接页

新增 `pages/web-viewer/web-viewer`：

- 只接收编码后的 HTTPS URL
- 使用小程序 `web-view` 打开
- URL 为空或非 HTTPS 时，展示错误和复制链接兜底
- 文档注明：实际内嵌打开需要微信小程序业务域名配置

## 9. 权限与状态规则

### 9.1 权限判断

直播活动的 `visibility` 决定准入方式：

- `all`：登录用户可看
- `course`：用户必须存在有效课程授权
- `bootcamp`：用户必须存在有效训练营授权
- `member`：用户必须存在有效会员授权

有效授权条件：

- `status='active'`
- `starts_at` 为空或不晚于当前时间
- `expires_at` 为空或晚于当前时间

第一版要求登录后观看，避免匿名访问影响后续学习行为归因。

### 9.2 状态推导

后端统一输出 `effectiveStatus`：

- 如果 `status_override` 非空，优先使用覆盖状态
- 当前时间早于 `start_at`：`upcoming`
- 当前时间位于 `start_at` 和 `end_at` 之间：`live`
- 当前时间晚于 `end_at` 且 `replay_enabled=true` 且 `replay_url` 非空：`replay`
- 当前时间晚于 `end_at` 且无可用回放：`ended`

保存直播时必须校验：

- `end_at` 晚于 `start_at`
- `live_url` 如果填写，必须以 `https://` 开头
- `replay_url` 如果填写，必须以 `https://` 开头
- 不自动改写或归一化 URL

## 10. 错误处理

建议错误码：

- `40003`：直播 ID 非法
- `40004`：直播编辑参数非法
- `40101`：未登录
- `40301`：商家权限不足
- `40302`：无直播观看权限
- `40404`：直播不存在
- `50004`：直播服务不可用

前端处理：

- 商家保存失败：toast 展示简短错误
- 用户无权限：页面展示准入说明和跳转入口
- 链接不可用：展示复制链接兜底
- 后端不可用：读接口保留 mock fallback，写接口显示失败

## 11. 测试与验收

### 11.1 后端测试

测试重点：

- Migration 创建新增直播字段和 `content_access_grants`
- Seed 写入直播活动和授权数据
- 商家新建直播成功
- 商家编辑直播链接、时间、权限、状态覆盖成功
- 非 HTTPS 直播或回放链接被拒绝
- `end_at <= start_at` 被拒绝
- 无覆盖时状态按时间推导
- 覆盖状态优先于时间推导
- `all/course/bootcamp/member` 权限判断正确
- 过期授权不可用
- 用户端直播列表和详情返回 SQLite 数据
- `access-check` 有权限返回 `allowed=true` 和目标链接
- 无权限返回稳定的失败响应
- 商家直播接口要求 merchant token
- 普通用户不能调用商家直播接口

### 11.2 前端验证

自动检查：

- `services/api/page-data.js` 导出直播管理、保存、准入校验相关函数
- `app.json` 注册 `pages/live-edit/live-edit`
- `app.json` 注册 `pages/web-viewer/web-viewer`
- 新页面 JS 通过 `node -c`
- 新页面 JSON 可解析

手动验收：

1. 商家登录
2. 进入商家工作台
3. 打开直播管理
4. 新建一场直播，填写 HTTPS 直播链接
5. 设置权限为指定课程学员
6. 保存后在直播管理列表看到该直播
7. 切换状态覆盖为直播中
8. 学员账号进入直播列表
9. 打开直播详情
10. 点击进入直播
11. 有权限时进入 web-view 或看到复制链接兜底
12. 无授权用户访问时看到无权限说明和引导入口
13. 配置回放链接后，回放状态可进入回放

## 12. 实现顺序建议

实现计划阶段建议按以下顺序拆任务：

1. 数据库 migration 和 seed 授权数据
2. 后端 domain/repository/service：直播编辑、状态推导、准入校验
3. 后端 handler/API：用户端直播读取、商家端直播管理、准入检查
4. 前端 API 函数和商家直播管理入口
5. 新增直播编辑页
6. 用户端直播列表、详情、直播间接真实数据
7. 新增 web-viewer 页和复制链接兜底
8. README 与任务清单更新，以及端到端验证

## 13. 自检

- 本设计聚焦直播管理与准入闭环，没有引入支付、订单、分销或原生直播依赖。
- 媒体方式明确为普通 HTTPS 链接，不做上传和转码。
- 观看权限有后端强校验，不停留在展示文案。
- 状态推导由后端统一处理，前端只消费 `effectiveStatus`。
- 所有新增能力都有测试和验收路径。
