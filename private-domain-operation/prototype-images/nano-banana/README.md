# Nano Banana 原型图目录

本文目录用于存放通过 `Nano Banana AI` 生成的产品原型交互图，便于后续评审、替换、切图和前端实现参考。

## 1. 保存目录规则

保存原型图时，统一遵循以下规则：

- 所有原型图统一存放在 `prototype-images/nano-banana/`
- 按页面类型分目录保存，不要把用户端、基础服务页、商家工作台页面混放
- 文件名前缀使用两位序号，并与 [PROTOTYPE_PROMPTS.md](../../docs/PROTOTYPE_PROMPTS.md) 中的推荐出图顺序保持一致
- 文件名使用英文短横线命名，避免空格、中文和特殊字符
- 初次生成建议先存 `v1` 版本，精修后再追加 `v2`、`v3` 或 `final`
- 每张页面图只保存单页，不保存多页面拼图

## 2. 目录结构

目录结构：

- `01-user-core/`
  - 用户主路径核心页面
  - 建议存放：首页、商品详情页、课程播放页、学习页、训练营详情页、直播详情页、直播间页、我的页
  - `banner/`
    - 首页 Banner 素材图
- `02-user-support/`
  - 用户基础服务页面
  - 建议存放：消息通知页、咨询反馈页、系统设置页
- `03-merchant-console/`
  - 商家工作台页面
  - 建议存放：商家工作台首页、商品管理页、直播管理页、用户管理页、内容运营页

## 3. 命名规则

基础命名规则：

- `01-home.png`
- `02-product-detail.png`
- `03-course-player.png`
- `04-learning.png`
- `05-bootcamp-detail.png`
- `06-live-detail.png`
- `07-live-room.png`
- `08-profile.png`
- `09-notifications.png`
- `10-feedback.png`
- `11-settings.png`
- `12-merchant-dashboard.png`
- `13-product-management.png`
- `14-live-management.png`
- `15-user-management.png`
- `16-content-ops.png`

版本命名建议：

- 初稿：`01-home-v1.png`
- 第二轮调整：`01-home-v2.png`
- 确认稿：`01-home-final.png`

## 4. 与提示词文档对应关系

以下命名与 [PROTOTYPE_PROMPTS.md](../../docs/PROTOTYPE_PROMPTS.md) 中的页面提示词一一对应。

| 优先级序号 | 提示词章节 | 页面名称 | 保存目录 | 建议文件名 |
| --- | --- | --- | --- | --- |
| 01 | `3.1` | 首页 | `01-user-core/` | `01-home.png` |
| 02 | `3.4` | 商品详情页 | `01-user-core/` | `02-product-detail.png` |
| 03 | `3.5` | 课程播放页 | `01-user-core/` | `03-course-player.png` |
| 04 | `3.2` | 学习页 | `01-user-core/` | `04-learning.png` |
| 05 | `3.6` | 训练营详情页 | `01-user-core/` | `05-bootcamp-detail.png` |
| 06 | `3.7` | 直播详情页 | `01-user-core/` | `06-live-detail.png` |
| 07 | `3.8` | 直播间页 | `01-user-core/` | `07-live-room.png` |
| 08 | `3.3` | 我的页 | `01-user-core/` | `08-profile.png` |
| 09 | `3.9` | 消息通知页 | `02-user-support/` | `09-notifications.png` |
| 10 | `3.10` | 咨询反馈页 | `02-user-support/` | `10-feedback.png` |
| 11 | `3.11` | 系统设置页 | `02-user-support/` | `11-settings.png` |
| 12 | `4.1` | 商家工作台首页 | `03-merchant-console/` | `12-merchant-dashboard.png` |
| 13 | `4.2` | 商品管理页 | `03-merchant-console/` | `13-product-management.png` |
| 14 | `4.3` | 直播管理页 | `03-merchant-console/` | `14-live-management.png` |
| 15 | `4.4` | 用户管理页 | `03-merchant-console/` | `15-user-management.png` |
| 16 | `4.5` | 内容运营页 | `03-merchant-console/` | `16-content-ops.png` |

## 5. 使用说明

- 输出图统一使用 [PROTOTYPE_PROMPTS.md](../../docs/PROTOTYPE_PROMPTS.md) 中的参数要求
- 如需保留多轮版本，建议追加版本后缀，如 `01-home-v1.png`、`01-home-v2.png`
- 如需保留精修稿，可增加 `-final` 后缀，如 `01-home-final.png`
