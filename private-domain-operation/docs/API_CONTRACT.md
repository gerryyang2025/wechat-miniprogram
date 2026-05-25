# API Contract

文档版本：`v0.1`

更新日期：`2026-05-22`

本文档记录 P0 阶段前后端接口契约草案。当前前端已经新增 `services/api/` 请求层，默认在没有 `baseUrl` 或接口异常时使用 `mock/` 数据兜底。

## 1. 通用约定

### 1.1 基础路径

```text
/api/v1
```

### 1.2 响应结构

```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "request_id": "trace-id"
}
```

说明：

- `code = 0` 表示成功。
- 非 `0` 表示业务错误。
- 小程序前端当前会优先读取 `data` 字段。
- 若接口返回非 `2xx` 或 `code != 0`，并且开启 `mockFallback`，前端会自动回退到本地 Mock 数据。

### 1.3 鉴权

除公开浏览类接口外，后续接口默认通过请求头传递登录态：

```text
Authorization: Bearer <token>
```

P0 阶段优先接入微信登录、用户身份识别、商家角色识别与基础权限校验。

## 2. 用户与身份

### POST /auth/wechat-login

使用微信登录 code 换取业务登录态。

请求：

```json
{
  "code": "wx-login-code"
}
```

响应 `data`：

```json
{
  "token": "session-token",
  "user": {
    "id": "user-1",
    "nickname": "时昕同学",
    "avatar_url": "",
    "phone": "",
    "roles": ["student"]
  }
}
```

### GET /profile

获取我的页数据。

响应 `data` 对齐当前 `mock/profile-data.js` 中 `getProfilePageData()` 的页面结构。

## 3. 首页与运营位

### GET /home

获取首页聚合数据。

响应 `data`：

```json
{
  "bannerList": [],
  "purchasedCourses": [],
  "recommendedCourses": [],
  "featureCards": [],
  "searchEntry": {},
  "categoriesEntry": {},
  "ownedAllEntry": {},
  "liveCenterEntry": {}
}
```

字段当前对齐 `mock/home-data.js` 的 `getHomePageData()`。

### GET /product-categories

获取商品分类入口。

响应 `data`：对齐 `mock/product-browser-data.js` 的 `getProductCategories()`。

## 4. 商品与课程

### GET /products

查询商品列表。

查询参数：

| 参数 | 说明 |
| --- | --- |
| `category` | `all`、`course`、`camp`、`member` |

响应 `data`：对齐 `mock/product-browser-data.js` 的 `getProductListPageData(category)`。

### GET /products/{product_id}

获取商品详情。

响应 `data`：对齐 `mock/course-data.js` 的 `getDetailCourse(product_id)`。

### GET /courses/{course_id}/player

获取课程播放页数据。

响应 `data`：

```json
{
  "id": "player-aigc-video",
  "title": "AIGC 视频制作",
  "videoUrl": "https://cdn.example.com/video.mp4",
  "coverUrl": "https://cdn.example.com/cover.jpg",
  "resourceState": "ready",
  "progressSummary": {},
  "chapters": []
}
```

后端媒资字段应至少包含：

- `media_id`
- `course_id`
- `lesson_id`
- `media_type`
- `storage_provider`
- `object_key`
- `play_url`
- `cover_url`
- `duration_seconds`
- `file_size`
- `status`
- `source_type`

`storage_provider` 一期优先使用 `sftp`，表示视频文件通过 `Linux SFTP` 上传到服务器，并由 `Nginx HTTPS` 域名对外提供播放地址；后续可扩展为 `cos`、`vod` 或 `external`。

## 5. 学习进度

### GET /learning

获取学习中心聚合数据。

响应 `data`：对齐 `mock/learning-data.js` 的 `getLearningPageData()`。

### GET /learning/courses/{course_id}/progress

查询指定课程的学习进度。

响应 `data`：

```json
{
  "course_id": "player-aigc-video",
  "lesson_id": "player-aigc-l2",
  "current_lesson_id": "player-aigc-l2",
  "current_lesson": "第 2 节 AIGC 视频脚本拆解",
  "completed_lessons": 1,
  "total_lessons": 5,
  "progress_percent": 20,
  "progress_seconds": 202,
  "last_position": "上次看到 03:22"
}
```

### POST /learning/courses/{course_id}/progress

上报最近学习位置。

请求：

```json
{
  "lesson_id": "player-aigc-l2",
  "progress_seconds": 202,
  "completed": false
}
```

响应 `data`：

```json
{
  "course_id": "player-aigc-video",
  "lesson_id": "player-aigc-l2",
  "completed_lessons": 1,
  "total_lessons": 5,
  "progress_percent": 20,
  "last_position": "上次看到 03:22"
}
```

## 6. 训练营

### GET /bootcamps/{camp_id}

获取训练营详情页数据。

响应 `data`：对齐 `mock/bootcamp-data.js` 的 `getBootcampDetailPageData(camp_id)`。

## 7. 直播

### GET /live-events

查询直播列表。

查询参数：

| 参数 | 说明 |
| --- | --- |
| `status` | `all`、`upcoming`、`live`、`replay` |

响应 `data`：对齐 `mock/live-data.js` 的 `getLiveListPageData(status)`。

### GET /live-events/{live_id}

获取直播详情。

查询参数：

| 参数 | 说明 |
| --- | --- |
| `mode` | `upcoming`、`live`、`replay` |

响应 `data`：对齐 `mock/live-data.js` 的 `getLiveDetailPageData(live_id, mode)`。

### GET /live-events/{live_id}/room

获取直播间或回放页数据。

查询参数：

| 参数 | 说明 |
| --- | --- |
| `mode` | `live`、`replay` |
| `title` | 页面标题 |

响应 `data`：对齐 `mock/live-data.js` 的 `getLiveRoomPageData(live_id, mode, title)`。

## 8. 会员与基础服务

### GET /member-rights

查询会员权益页数据。

查询参数：

| 参数 | 说明 |
| --- | --- |
| `source` | 来源场景，如 `home`、`course` |

### GET /notifications

查询消息通知页数据。

### GET /settings

查询系统设置页数据。

### GET /consultation

查询咨询反馈页数据。

查询参数：

| 参数 | 说明 |
| --- | --- |
| `scene` | `profile`、`course`、`live`、`member` |
| `title` | 咨询目标标题 |

## 9. 商家工作台

### GET /merchant/dashboard

获取商家工作台首页数据。

### GET /merchant/products

查询商家商品管理列表。

查询参数：

| 参数 | 说明 |
| --- | --- |
| `type` | `all`、`course`、`bootcamp`、`member` |

### GET /merchant/live-events

查询商家直播管理列表。

查询参数：

| 参数 | 说明 |
| --- | --- |
| `status` | `all`、`upcoming`、`live`、`ended` |

### GET /merchant/users

查询商家用户管理列表。

查询参数：

| 参数 | 说明 |
| --- | --- |
| `segment` | `all`、`active`、`camp`、`live` |

### GET /merchant/content-ops

查询内容运营配置数据。

## 10. P0 接入顺序

1. `/auth/wechat-login`
2. `/home`
3. `/products` 与 `/products/{product_id}`
4. `/courses/{course_id}/player`
5. `/learning` 与 `/learning/courses/{course_id}/progress`
6. `/bootcamps/{camp_id}`
7. `/live-events`、`/live-events/{live_id}`、`/live-events/{live_id}/room`
8. `/merchant/dashboard` 和商家端列表接口
