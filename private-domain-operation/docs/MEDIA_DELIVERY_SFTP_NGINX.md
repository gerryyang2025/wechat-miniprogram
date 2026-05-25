# Linux SFTP + Nginx HTTPS 课程视频方案

文档版本：`v0.1`

创建日期：`2026-05-23`

关联文档：

- [BACKEND_TECH.md](./BACKEND_TECH.md)
- [FRONTEND_TECH.md](./FRONTEND_TECH.md)
- [API_CONTRACT.md](./API_CONTRACT.md)
- [TODO.md](../TODO.md)

## 1. 结论

`SFTP` 服务不是通过 `Nginx` 实现的。

- `SFTP` 由 Linux 服务器上的 `OpenSSH / sshd` 提供，负责视频、封面、附件的安全上传和维护。
- `Nginx` 负责把服务器磁盘上的媒体文件通过 `HTTPS` 域名对外提供给微信小程序播放。

也就是说，`SFTP` 是上传入口，`Nginx HTTPS` 是播放出口。

## 2. 方案目标

一期优先使用自有 Linux 媒体服务器，减少对 `COS / VOD` 的依赖，先跑通课程视频交付闭环。

目标：

- 支持运维或商家通过 `SFTP` 上传课程视频
- 通过 `Nginx HTTPS` 提供小程序可播放的 `videoUrl`
- 后端保存媒资元数据与播放地址
- 前端只消费后端或 `mock/` 返回的 `videoUrl`
- 后续可平滑切换到 `COS / CDN / VOD`

非目标：

- 不让小程序直接访问 `ftp://` 或 `sftp://` 地址
- 不把视频文件打进小程序代码包
- 不在一期建设复杂媒资后台、转码平台或多清晰度播放体系

## 3. 总体架构

```text
讲师 / 运维 / 商家
        |
        | SFTP 上传
        v
Linux 媒体服务器
/data/pdo-media/
        |
        | 本地文件读取
        v
Nginx 静态资源服务
        |
        | HTTPS
        v
https://media.example.com/courses/aigc/lesson-001.mp4
        |
        | videoUrl
        v
微信小程序 video 组件
```

推荐域名：

```text
media.example.com
```

推荐服务器目录：

```text
/data/pdo-media/
├── courses/
│   └── aigc/
│       └── lesson-001.mp4
├── covers/
│   └── aigc/
│       └── lesson-001.jpg
├── attachments/
└── replays/
```

对外 URL 示例：

```text
https://media.example.com/courses/aigc/lesson-001.mp4
https://media.example.com/covers/aigc/lesson-001.jpg
```

## 4. 组件职责

### 4.1 OpenSSH / SFTP

职责：

- 提供文件上传通道
- 管理上传账号、目录权限和写入范围
- 支持运维通过 `sftp`、`scp` 或图形化 SFTP 工具上传资源

约束：

- 上传账号不允许 shell 登录
- 上传账号限制在媒体目录内
- 不使用 root 账号进行日常上传
- 推荐使用 SSH key 登录，关闭密码登录或至少限制来源 IP

### 4.2 Nginx

职责：

- 读取本地媒体目录
- 通过 `HTTPS` 对外提供静态视频、封面、附件
- 支持视频播放所需的 `Range` 请求
- 提供缓存头、访问日志和基础防盗链能力

约束：

- 对外只暴露 `443`
- 不暴露 SFTP 内部路径
- 不使用 `http://ip:port/video.mp4` 作为正式播放地址
- 播放域名需要配置到微信小程序合法域名

### 4.3 后端服务

职责：

- 维护课程、课节、媒资之间的关系
- 保存 `storage_provider`、`object_key`、`play_url`、`cover_url` 等字段
- 向前端返回统一的 `videoUrl / coverUrl`

后端不直接代理大视频流，避免业务 API 服务承担大文件带宽压力。

### 4.4 微信小程序

职责：

- 通过接口或 `mock/` 获取播放地址
- 使用 `<video src="{{videoUrl}}">` 播放课程视频
- 在视频地址缺失或播放失败时展示兜底状态

前端不感知底层是 `SFTP`、`COS`、`VOD` 还是第三方地址。

## 5. Linux 目录与账号设计

推荐用户与组：

```text
用户：pdo_uploader
用户组：pdo-media
```

推荐目录权限：

```text
/data/pdo-media              root:root       755
/data/pdo-media/courses      pdo_uploader:pdo-media 755
/data/pdo-media/covers       pdo_uploader:pdo-media 755
/data/pdo-media/attachments  pdo_uploader:pdo-media 755
/data/pdo-media/replays      pdo_uploader:pdo-media 755
```

示例命令：

```bash
sudo groupadd pdo-media
sudo useradd -g pdo-media -s /usr/sbin/nologin pdo_uploader

sudo mkdir -p /data/pdo-media/{courses,covers,attachments,replays}
sudo chown root:root /data/pdo-media
sudo chmod 755 /data/pdo-media

sudo chown -R pdo_uploader:pdo-media /data/pdo-media/{courses,covers,attachments,replays}
sudo chmod -R 755 /data/pdo-media/{courses,covers,attachments,replays}
```

如果使用 `ChrootDirectory /data/pdo-media`，`/data/pdo-media` 必须归 `root` 所有，真正可写目录放在其子目录。

## 6. SFTP 配置建议

编辑：

```text
/etc/ssh/sshd_config
```

推荐配置：

```sshconfig
Subsystem sftp internal-sftp

Match Group pdo-media
    ChrootDirectory /data/pdo-media
    ForceCommand internal-sftp
    X11Forwarding no
    AllowTcpForwarding no
    PermitTunnel no
```

重启 SSH：

```bash
sudo systemctl restart sshd
```

上传示例：

```bash
sftp pdo_uploader@media.example.com
put lesson-001.mp4 /courses/aigc/lesson-001.mp4
put lesson-001.jpg /covers/aigc/lesson-001.jpg
```

上传后服务器真实路径：

```text
/data/pdo-media/courses/aigc/lesson-001.mp4
/data/pdo-media/covers/aigc/lesson-001.jpg
```

## 7. Nginx HTTPS 配置建议

示例配置：

```nginx
server {
    listen 80;
    server_name media.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name media.example.com;

    ssl_certificate /etc/letsencrypt/live/media.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/media.example.com/privkey.pem;

    root /data/pdo-media;
    access_log /var/log/nginx/pdo-media.access.log;
    error_log /var/log/nginx/pdo-media.error.log;

    location / {
        try_files $uri =404;
        add_header Accept-Ranges bytes;
        add_header Cache-Control "public, max-age=86400";
    }

    location ~* \.(mp4|m4v)$ {
        types {
            video/mp4 mp4 m4v;
        }
        try_files $uri =404;
        add_header Accept-Ranges bytes;
        add_header Cache-Control "public, max-age=86400";
    }

    location ~* \.(jpg|jpeg|png|webp)$ {
        try_files $uri =404;
        add_header Cache-Control "public, max-age=604800";
    }
}
```

证书建议：

- 使用正式 CA 证书，例如 Let's Encrypt
- 不使用自签名证书
- 证书域名必须与 `media.example.com` 一致
- TLS 至少支持 `1.2`

## 8. 后端媒资字段设计

媒资表建议保留存储抽象，不绑定某一种底层方案。

核心字段：

```text
media_id
merchant_id
course_id
lesson_id
media_type
storage_provider
object_key
play_url
cover_url
duration_seconds
file_size
source_type
status
created_at
updated_at
```

字段示例：

```json
{
  "storage_provider": "sftp",
  "object_key": "courses/aigc/lesson-001.mp4",
  "play_url": "https://media.example.com/courses/aigc/lesson-001.mp4",
  "cover_url": "https://media.example.com/covers/aigc/lesson-001.jpg",
  "media_type": "video",
  "source_type": "recorded_course",
  "status": "ready"
}
```

`storage_provider` 枚举建议：

```text
sftp
cos
vod
external
```

一期默认：

```text
storage_provider = sftp
```

## 9. API 返回约定

后端对前端返回统一字段，不暴露 SFTP 内部细节。

课程播放接口示例：

```json
{
  "id": "player-aigc-video",
  "title": "AIGC 视频制作",
  "videoUrl": "https://media.example.com/courses/aigc/lesson-001.mp4",
  "coverUrl": "https://media.example.com/covers/aigc/lesson-001.jpg",
  "resourceState": "ready",
  "duration": "03:22"
}
```

前端只使用：

```text
videoUrl
coverUrl
resourceState
```

## 10. 微信小程序约束

正式环境要求：

- 播放地址使用 `HTTPS`
- 使用域名，不使用 IP
- 域名配置到小程序后台合法域名
- 证书有效、可信、链路完整
- 不使用 `http://ip:port/video.mp4`
- `video` 的 `poster` 需要使用网络地址；如果只有本地封面，不要传给 `<video poster>`

开发阶段可以临时开启开发者工具的域名校验跳过，但不能作为上线依据。

## 11. 上传与入库流程

### 11.1 讲师上传工具建议

讲师侧不建议直接使用命令行 `sftp`。一期应优先提供图形化 SFTP 客户端方案，让讲师通过拖拽方式上传课程视频。

推荐工具：

| 使用场景 | 推荐工具 | 说明 |
| --- | --- | --- |
| Windows 讲师 | `WinSCP` | Windows 上成熟的图形化 SFTP 客户端，适合讲师拖拽上传 |
| macOS 讲师 | `Cyberduck` | Mac 上常用的 SFTP 客户端，界面简单 |
| 跨平台统一教程 | `FileZilla Client` | 支持 Windows / macOS / Linux，便于统一培训 |
| 高频上传 | `Mountain Duck` | 可把 SFTP 目录挂载成本地磁盘，适合经常上传资源的讲师或运营 |
| 运维批量同步 | `rclone` / 命令行 `sftp` | 适合技术人员做批量同步、校验和自动化脚本 |

推荐讲师连接信息模板：

```text
协议：SFTP
主机：media.example.com
端口：22
用户名：teacher_001
认证方式：密码或 SSH 私钥
上传目录：/courses/teacher_001/incoming/
```

讲师只需要理解“上传目录”，不需要理解服务器真实路径和 Nginx 对外播放路径。

讲师上传后的路径示例：

```text
SFTP 上传目录：
/courses/teacher_001/incoming/lesson-001.mp4

服务器真实路径：
/data/pdo-media/courses/teacher_001/incoming/lesson-001.mp4

审核通过后的播放地址：
https://media.example.com/courses/teacher_001/ready/lesson-001.mp4
```

账号与权限建议：

- 每位讲师使用独立账号，不共用上传账号
- 讲师账号只能写入自己的 `incoming/` 目录
- 讲师不直接写入 `ready/` 正式播放目录
- 运营或后台服务审核后再移动文件到 `ready/`
- 讲师账号不允许 shell 登录，不允许访问其他讲师目录

目录建议：

```text
/data/pdo-media/courses/
└── teacher_001/
    ├── incoming/
    ├── ready/
    └── rejected/
```

讲师操作流程：

1. 安装指定 SFTP 客户端，例如 `WinSCP`、`Cyberduck` 或 `FileZilla Client`
2. 按平台提供的连接信息登录
3. 将视频文件拖拽到 `incoming/` 目录
4. 上传完成后通知运营或在后台提交审核
5. 运营审核视频命名、格式、大小和内容
6. 审核通过后移动到 `ready/`，并写入后端媒资表

讲师侧说明重点：

- 不使用 `ftp://`、`sftp://` 地址给小程序播放
- 不把上传目录当成播放地址
- 视频文件名避免中文、空格和特殊符号
- 推荐使用小写英文、数字和短横线，例如 `lesson-001.mp4`
- 上传完成后不要反复改名，避免播放地址失效

### 11.2 上传与入库步骤

一期人工或半自动流程：

1. 讲师录制课程视频
2. 运维压缩并命名文件
3. 通过 `SFTP` 上传到媒体服务器
4. 通过浏览器或 `curl` 验证 HTTPS 地址可访问
5. 在后端媒资表或 `mock/media-data.js` 写入 `play_url / cover_url`
6. 小程序播放页按接口返回地址播放

后续自动化流程：

1. 后台生成上传目录和媒资记录
2. 商家上传文件
3. 后端异步校验文件存在、大小和格式
4. 自动生成 `play_url`
5. 媒资状态从 `uploading` 更新为 `ready`

## 12. 命名规范

推荐路径：

```text
courses/{course_slug}/{lesson_slug}.mp4
covers/{course_slug}/{lesson_slug}.jpg
attachments/{course_slug}/{file_name}.pdf
replays/{live_slug}/{replay_slug}.mp4
```

示例：

```text
courses/aigc-video/lesson-001.mp4
covers/aigc-video/lesson-001.jpg
```

建议：

- 避免中文路径
- 避免空格
- 使用小写英文、数字和短横线
- 文件名稳定后不要随意改动
- 大量资源时可以增加日期或商家 ID 前缀

## 13. 安全策略

SFTP：

- 独立上传账号
- 禁止 shell 登录
- 限制 Chroot 目录
- 推荐 SSH key
- 可限制来源 IP
- 定期轮换密钥

Nginx：

- 只开放 `80 / 443`
- `80` 强制跳转 `443`
- 开启访问日志
- 后续可加 `valid_referers` 或签名 URL
- 不开放目录列表

后端：

- 课程权限由服务端判断
- 前端拿到的 `videoUrl` 不等于拥有课程权限
- 后续会员/付费内容应支持短时签名 URL 或鉴权播放

## 14. 运维检查清单

上传检查：

```bash
sftp pdo_uploader@media.example.com
ls /courses/aigc/
```

文件检查：

```bash
ls -lh /data/pdo-media/courses/aigc/
```

HTTPS 检查：

```bash
curl -I https://media.example.com/courses/aigc/lesson-001.mp4
```

需要关注：

```text
HTTP/2 200
Content-Type: video/mp4
Accept-Ranges: bytes
```

Range 检查：

```bash
curl -I -H "Range: bytes=0-1023" https://media.example.com/courses/aigc/lesson-001.mp4
```

理想返回：

```text
HTTP/2 206
Accept-Ranges: bytes
Content-Range: bytes 0-1023/...
```

Nginx 检查：

```bash
sudo nginx -t
sudo systemctl reload nginx
tail -f /var/log/nginx/pdo-media.access.log
```

## 15. 风险与限制

相比 `COS / VOD`，自建 `SFTP + Nginx` 需要自己承担：

- 磁盘扩容
- 备份
- 带宽峰值
- 弱网播放体验
- 防盗链
- 权限控制
- 转码与多清晰度
- 可用性与容灾

因此，一期可以先用该方案降成本和减少外部依赖；当课程视频变多、播放量变大或版权保护要求提高时，应升级到 `COS / CDN / VOD`。

## 16. 后续演进

平滑迁移策略：

- 前端继续只消费 `videoUrl`
- 后端继续保留 `storage_provider`
- `object_key` 不绑定某个厂商格式
- 切换存储时只更新媒资表，不改小程序页面

演进路径：

```text
阶段 1：Linux SFTP + Nginx HTTPS
阶段 2：Nginx 前加 CDN
阶段 3：迁移到 COS + CDN
阶段 4：视频量上升后接入 VOD
```

## 17. 一期验收标准

- 能通过 `SFTP` 上传视频到指定目录
- 能通过 `https://media.example.com/...` 访问视频
- 小程序 `<video>` 可播放课程视频
- 支持视频拖动进度条
- 后端媒资记录中 `storage_provider = sftp`
- 前端无 `http://ip:port/video.mp4` 正式地址
- 微信小程序后台已配置媒体合法域名
