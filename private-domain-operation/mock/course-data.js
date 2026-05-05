const { clone } = require("./shared");

const detailCourseCatalog = {
  "course-aigc-video": {
    id: "course-aigc-video",
    playerCourseId: "player-aigc-video",
    tag: "录播课",
    title: "AIGC 视频制作",
    author: "Gerry",
    coverTheme: "cover-blue",
    coverHint: "脚本 / 口播 / 剪辑发布",
    meta: "5 节课程 · AI 视频入门实践",
    price: "已购内容",
    access: "支持随时回看 · 适合快速上手",
    description:
      "这是一门围绕 AIGC 视频制作的入门实战课，帮助你从脚本组织、口播表达，到画面生成和剪辑发布，建立一条能快速上手的内容制作流程。",
    gains: [
      "理解 AIGC 视频从脚本到成片的核心流程",
      "掌握口播结构、画面节奏和剪辑思路",
      "建立适合个人 IP 的短视频内容生产方式"
    ],
    suitable: ["AIGC 内容创作者", "想做短视频的讲师", "个人 IP 起步者"],
    progressSummary: {
      status: "已购课程",
      completedLessons: 1,
      totalLessons: 5,
      percent: 20,
      completedDuration: "累计学习 18 分钟",
      currentLessonTitle: "最近学习：第 2 节 AIGC 视频脚本拆解",
      nextLessonTitle: "下一节：第 3 节 口播结构与节奏"
    },
    chapters: [
      {
        id: "course-aigc-chapter-1",
        title: "模块 1 · 选题与脚本",
        summary: "先明确题材方向，再搭起可直接拍摄的脚本结构。",
        lessons: [
          { id: "course-aigc-l1", playerLessonId: "player-aigc-l1", title: "第 1 节 AIGC 视频选题方向", duration: "09:24", status: "completed" },
          { id: "course-aigc-l2", playerLessonId: "player-aigc-l2", title: "第 2 节 AIGC 视频脚本拆解", duration: "03:22", status: "current" }
        ]
      },
      {
        id: "course-aigc-chapter-2",
        title: "模块 2 · 口播与成片",
        summary: "围绕口播表达、画面节奏与发布动作完成第一条作品。",
        lessons: [
          { id: "course-aigc-l3", playerLessonId: "player-aigc-l3", title: "第 3 节 口播结构与节奏", duration: "08:11", status: "upcoming" },
          { id: "course-aigc-l4", playerLessonId: "player-aigc-l4", title: "第 4 节 画面与字幕组织", duration: "06:48", status: "upcoming" },
          { id: "course-aigc-l5", playerLessonId: "player-aigc-l5", title: "第 5 节 发布与复盘动作", duration: "07:35", status: "upcoming" }
        ]
      }
    ],
    note: "当前原型阶段已接入示例视频，可直接从商品详情进入课程播放页。",
    primaryActionType: "player",
    primaryActionTarget: "player-aigc-video",
    primaryActionText: "立即学习",
    secondaryActionText: "咨询课程"
  },
  "course-wechat-game": {
    id: "course-wechat-game",
    playerCourseId: "player-wechat-game",
    tag: "项目实战",
    title: "微信小游戏开发",
    author: "Gerry",
    coverTheme: "cover-indigo",
    coverHint: "目录组织 / 交互循环 / 真机调试",
    meta: "4 节课程 · 飞机大战项目实战",
    price: "已购内容",
    access: "支持示例回看 · 适合开发入门",
    description:
      "围绕微信小游戏项目实战，讲解项目结构、资源组织、交互循环、碰撞检测和真机调试，让你更快理解小游戏开发的基本链路。",
    gains: [
      "理解小游戏项目初始化与资源组织方式",
      "掌握基础交互循环和碰撞检测的实现思路",
      "熟悉真机调试与发布前的最小检查流程"
    ],
    suitable: ["小游戏开发初学者", "前端转小游戏开发", "想做实战型课程的人"],
    progressSummary: {
      status: "已购课程",
      completedLessons: 2,
      totalLessons: 4,
      percent: 50,
      completedDuration: "累计学习 26 分钟",
      currentLessonTitle: "最近学习：第 3 节 飞机大战交互循环",
      nextLessonTitle: "下一节：第 4 节 真机调试与发布"
    },
    chapters: [
      {
        id: "course-wechat-game-chapter-1",
        title: "模块 1 · 项目结构搭建",
        summary: "先把目录、资源和基础场景搭起来。",
        lessons: [
          { id: "course-wechat-game-l1", playerLessonId: "player-wxgame-l1", title: "第 1 节 小游戏初始化与目录组织", duration: "12:06", status: "completed" },
          { id: "course-wechat-game-l2", playerLessonId: "player-wxgame-l2", title: "第 2 节 资源加载与场景布局", duration: "11:10", status: "completed" }
        ]
      },
      {
        id: "course-wechat-game-chapter-2",
        title: "模块 2 · 飞机大战实战",
        summary: "围绕核心交互和发布流程完成一个最小可运行案例。",
        lessons: [
          { id: "course-wechat-game-l3", playerLessonId: "player-wxgame-l3", title: "第 3 节 飞机大战交互循环", duration: "项目演示", status: "current" },
          { id: "course-wechat-game-l4", playerLessonId: "player-wxgame-l4", title: "第 4 节 真机调试与发布", duration: "09:42", status: "upcoming" }
        ]
      }
    ],
    note: "当前原型阶段已接入项目演示视频，可直接从详情页进入播放。",
    primaryActionType: "player",
    primaryActionTarget: "player-wechat-game",
    primaryActionText: "立即学习",
    secondaryActionText: "咨询课程"
  },
  "course-1": {
    id: "course-1",
    playerCourseId: "player-ip-course",
    tag: "系列课",
    title: "个人 IP 内容变现实战课",
    author: "Gerry",
    coverTheme: "cover-purple",
    coverHint: "定位 / 选题 / 成交路径",
    meta: "12 节课程 · 适合 0 到 1 搭建",
    price: "¥299",
    access: "支持随时回看 · 课程持续更新",
    description:
      "这是一门聚焦个人 IP 搭建和内容变现的系统课程，帮助你从定位、选题、表达，到内容产品化和转化路径设计，逐步建立自己的内容经营模型。",
    gains: [
      "明确个人 IP 的定位方式和内容边界",
      "掌握选题、结构和成交内容的组合方法",
      "建立从内容输出到私域转化的基础路径"
    ],
    suitable: ["内容创业者", "知识博主", "教培讲师", "想开始做个人品牌的人"],
    progressSummary: {
      status: "已购课程",
      completedLessons: 4,
      totalLessons: 12,
      percent: 33,
      completedDuration: "累计学习 96 分钟",
      currentLessonTitle: "最近学习：第 4 节 内容成交链路拆解",
      nextLessonTitle: "下一节：第 5 节 朋友圈内容节奏设计"
    },
    chapters: [
      {
        id: "course-1-chapter-1",
        title: "模块 1 · 定位与内容起步",
        summary: "先梳理个人优势，再建立内容边界与表达主题。",
        lessons: [
          { id: "course-1-l1", playerLessonId: "player-ip-l1", title: "第 1 节 个人品牌定位与优势梳理", duration: "14:28", status: "completed" },
          { id: "course-1-l2", playerLessonId: "player-ip-l2", title: "第 2 节 高转化选题的搭建方式", duration: "12:16", status: "completed" },
          { id: "course-1-l3", playerLessonId: "player-ip-l3", title: "第 3 节 内容表达结构与开场设计", duration: "15:02", status: "completed" }
        ]
      },
      {
        id: "course-1-chapter-2",
        title: "模块 2 · 转化路径与私域承接",
        summary: "把内容输出和私域转化节奏真正接起来。",
        lessons: [
          { id: "course-1-l4", playerLessonId: "player-ip-l4", title: "第 4 节 内容成交链路拆解", duration: "11:41", status: "current" },
          { id: "course-1-l5", playerLessonId: "player-ip-l5", title: "第 5 节 朋友圈内容节奏设计", duration: "13:19", status: "upcoming" },
          { id: "course-1-l6", playerLessonId: "player-ip-l6", title: "第 6 节 咨询承接与内容互动动作", duration: "10:08", status: "upcoming" }
        ]
      },
      {
        id: "course-1-chapter-3",
        title: "模块 3 · 日常复盘与内容经营",
        summary: "沉淀你的复盘方法和内容经营节奏。",
        lessons: [
          { id: "course-1-l7", playerLessonId: "player-ip-l7", title: "第 7 节 周更节奏与内容复盘", duration: "09:56", status: "upcoming" },
          { id: "course-1-l8", playerLessonId: "player-ip-l8", title: "第 8 节 产品化表达模板", duration: "11:52", status: "upcoming" },
          { id: "course-1-l9", playerLessonId: "player-ip-l9", title: "第 9 节 咨询服务的内容包装", duration: "08:44", status: "upcoming" }
        ]
      }
    ],
    note: "当前原型阶段以课程目录和学习进度为主，购买与正式交付流程后续接入。",
    primaryActionType: "player",
    primaryActionTarget: "player-ip-course",
    primaryActionText: "继续学习",
    secondaryActionText: "咨询课程"
  },
  "course-2": {
    id: "course-2",
    tag: "视频课",
    title: "短视频表达与节奏训练",
    author: "Gerry",
    coverTheme: "cover-blue",
    coverHint: "口播结构 / 镜头状态 / 节奏感",
    meta: "8 节课程 · 口播拍摄训练",
    price: "会员可学",
    access: "会员内容 · 支持手机反复练习",
    description:
      "聚焦短视频表达能力训练，帮助你建立更自然的镜头感、口播节奏和信息密度控制，让内容表达更稳定、更有记忆点。",
    gains: [
      "提升口播表达的稳定度和节奏控制",
      "理解短视频开头、中段和结尾的结构安排",
      "掌握镜头状态、语气和停顿的基本训练方法"
    ],
    suitable: ["短视频初学者", "口播创作者", "想提升镜头表达的人"],
    chapters: [
      {
        id: "course-2-chapter-1",
        title: "模块 1 · 镜头表达基础",
        summary: "先把开场、停顿和镜头状态稳住。",
        lessons: [
          { id: "course-2-l1", title: "第 1 节 开场 5 秒如何抓住注意力", duration: "08:35", status: "preview" },
          { id: "course-2-l2", title: "第 2 节 口播节奏与停顿训练", duration: "10:24", status: "preview" }
        ]
      },
      {
        id: "course-2-chapter-2",
        title: "模块 2 · 结构化表达训练",
        summary: "从内容结构到结尾动作，建立可复用模板。",
        lessons: [
          { id: "course-2-l3", title: "第 3 节 镜头状态与眼神控制", duration: "09:18", status: "locked" },
          { id: "course-2-l4", title: "第 4 节 结构化表达与复盘方法", duration: "12:05", status: "locked" }
        ]
      }
    ],
    note: "当前为原型示例页，会员权益与试看策略以后续正式实现为准。",
    primaryActionType: "toast",
    primaryActionText: "了解会员权益",
    secondaryActionText: "咨询课程"
  },
  "course-3": {
    id: "course-3",
    tag: "图文课",
    title: "朋友圈内容转化模型",
    author: "Gerry",
    coverTheme: "cover-indigo",
    coverHint: "内容铺垫 / 信任积累 / 转化动作",
    meta: "6 节课程 · 图文成交训练",
    price: "¥129",
    access: "支持图文回看 · 适合日常运营复用",
    description:
      "围绕朋友圈内容的经营节奏，拆解从信任建立、内容铺垫到转化动作设计的关键步骤，帮助你把日常内容做成稳定的私域转化入口。",
    gains: [
      "理解朋友圈内容的长期经营逻辑",
      "学会在不同阶段安排信任型内容和转化型内容",
      "建立适合个人业务的朋友圈内容模板"
    ],
    suitable: ["私域运营人员", "个人咨询服务者", "高频发圈但转化弱的人"],
    chapters: [
      {
        id: "course-3-chapter-1",
        title: "模块 1 · 信任内容设计",
        summary: "先搭好朋友圈的信任底层。",
        lessons: [
          { id: "course-3-l1", title: "第 1 节 朋友圈内容的角色分层", duration: "图文 1", status: "preview" },
          { id: "course-3-l2", title: "第 2 节 信任内容与转化内容的配比", duration: "图文 2", status: "preview" }
        ]
      },
      {
        id: "course-3-chapter-2",
        title: "模块 2 · 转化动作设计",
        summary: "把日常内容和成交动作衔接起来。",
        lessons: [
          { id: "course-3-l3", title: "第 3 节 日常发圈模板与节奏", duration: "图文 3", status: "locked" },
          { id: "course-3-l4", title: "第 4 节 转化动作与成交提醒", duration: "图文 4", status: "locked" }
        ]
      }
    ],
    note: "当前原型页只展示信息结构和目录示例，不包含购买与咨询流程。",
    primaryActionType: "toast",
    primaryActionText: "立即了解",
    secondaryActionText: "咨询课程"
  }
};

const playerCourseCatalog = {
  "player-ip-course": {
    id: "player-ip-course",
    title: "个人 IP 内容变现实战课",
    coverUrl: "/assets/home/banner1.jpg",
    duration: "内容更新中",
    sourceLabel: "系列课",
    videoUrl: "",
    description: "聚焦个人 IP 的定位、选题、内容成交链路和私域承接节奏，帮助你建立系统的内容变现路径。",
    outlineText: "当前课程主线已接入到课程播放页，视频资源仍在整理中，你可以先查看学习进度和课程目录，再从后续资源中继续学习。",
    progressSummary: {
      completedLessons: 4,
      totalLessons: 12,
      percent: 33,
      lastPosition: "最近学习 第 4 节 内容成交链路拆解",
      currentLessonTitle: "当前课节：第 4 节 内容成交链路拆解",
      nextLessonTitle: "下一节：第 5 节 朋友圈内容节奏设计"
    },
    chapters: [
      {
        id: "player-ip-chapter-1",
        title: "模块 1 · 定位与内容起步",
        lessons: [
          { id: "player-ip-l1", title: "第 1 节 个人品牌定位与优势梳理", duration: "14:28", status: "completed" },
          { id: "player-ip-l2", title: "第 2 节 高转化选题的搭建方式", duration: "12:16", status: "completed" },
          { id: "player-ip-l3", title: "第 3 节 内容表达结构与开场设计", duration: "15:02", status: "completed" }
        ]
      },
      {
        id: "player-ip-chapter-2",
        title: "模块 2 · 转化路径与私域承接",
        lessons: [
          { id: "player-ip-l4", title: "第 4 节 内容成交链路拆解", duration: "11:41", status: "current" },
          { id: "player-ip-l5", title: "第 5 节 朋友圈内容节奏设计", duration: "13:19", status: "upcoming" },
          { id: "player-ip-l6", title: "第 6 节 咨询承接与内容互动动作", duration: "10:08", status: "upcoming" }
        ]
      },
      {
        id: "player-ip-chapter-3",
        title: "模块 3 · 日常复盘与内容经营",
        lessons: [
          { id: "player-ip-l7", title: "第 7 节 周更节奏与内容复盘", duration: "09:56", status: "upcoming" },
          { id: "player-ip-l8", title: "第 8 节 产品化表达模板", duration: "11:52", status: "upcoming" },
          { id: "player-ip-l9", title: "第 9 节 咨询服务的内容包装", duration: "08:44", status: "upcoming" }
        ]
      }
    ]
  },
  "player-aigc-video": {
    id: "player-aigc-video",
    title: "AIGC 视频制作",
    coverUrl: "/assets/home/banner1.jpg",
    duration: "03:22",
    sourceLabel: "录播课程",
    videoUrl: "http://106.55.160.81:8080/brad_pitt_vs_tom_cruise_1773333936.mp4",
    description: "聚焦 AIGC 视频创作流程，从脚本构思、口播表达，到成片剪辑与发布节奏。",
    outlineText: "本节内容将快速带你了解 AIGC 视频制作的基础链路，包括选题、脚本组织、画面表达和成片发布。",
    progressSummary: {
      completedLessons: 1,
      totalLessons: 5,
      percent: 20,
      lastPosition: "上次看到 03:22",
      currentLessonTitle: "当前课节：第 2 节 AIGC 视频脚本拆解",
      nextLessonTitle: "下一节：第 3 节 口播结构与节奏"
    },
    chapters: [
      {
        id: "player-aigc-chapter-1",
        title: "模块 1 · 从选题到脚本",
        lessons: [
          { id: "player-aigc-l1", title: "第 1 节 AIGC 视频选题方向", duration: "09:24", status: "completed" },
          { id: "player-aigc-l2", title: "第 2 节 AIGC 视频脚本拆解", duration: "03:22", status: "current" }
        ]
      },
      {
        id: "player-aigc-chapter-2",
        title: "模块 2 · 口播与成片",
        lessons: [
          { id: "player-aigc-l3", title: "第 3 节 口播结构与节奏", duration: "08:11", status: "upcoming" },
          { id: "player-aigc-l4", title: "第 4 节 画面与字幕组织", duration: "06:48", status: "upcoming" },
          { id: "player-aigc-l5", title: "第 5 节 发布与复盘动作", duration: "07:35", status: "upcoming" }
        ]
      }
    ]
  },
  "player-wechat-game": {
    id: "player-wechat-game",
    title: "微信小游戏开发",
    coverUrl: "/assets/home/banner2.jpg",
    duration: "项目演示",
    sourceLabel: "项目实战",
    videoUrl: "http://106.55.160.81:8080/wechat-plane-game.mov",
    description: "围绕微信小游戏实战，讲解项目结构、交互循环、资源组织与真机调试流程。",
    outlineText: "本节内容聚焦飞机大战小游戏示例，重点说明场景搭建、角色移动、碰撞检测、资源管理与发布调试。",
    progressSummary: {
      completedLessons: 2,
      totalLessons: 4,
      percent: 50,
      lastPosition: "最近完成 项目结构与资源组织",
      currentLessonTitle: "当前课节：第 3 节 飞机大战交互循环",
      nextLessonTitle: "下一节：第 4 节 真机调试与发布"
    },
    chapters: [
      {
        id: "player-wxgame-chapter-1",
        title: "模块 1 · 项目结构搭建",
        lessons: [
          { id: "player-wxgame-l1", title: "第 1 节 小游戏初始化与目录组织", duration: "12:06", status: "completed" },
          { id: "player-wxgame-l2", title: "第 2 节 资源加载与场景布局", duration: "11:10", status: "completed" }
        ]
      },
      {
        id: "player-wxgame-chapter-2",
        title: "模块 2 · 飞机大战示例实战",
        lessons: [
          { id: "player-wxgame-l3", title: "第 3 节 飞机大战交互循环", duration: "项目演示", status: "current" },
          { id: "player-wxgame-l4", title: "第 4 节 真机调试与发布", duration: "09:42", status: "upcoming" }
        ]
      }
    ]
  }
};

function getDetailCourse(courseId = "course-1") {
  return clone(detailCourseCatalog[courseId] || detailCourseCatalog["course-1"]);
}

function getPlayerCourse(courseId = "") {
  if (!playerCourseCatalog[courseId]) {
    return null;
  }

  return clone(playerCourseCatalog[courseId]);
}

module.exports = {
  detailCourseCatalog,
  playerCourseCatalog,
  getDetailCourse,
  getPlayerCourse
};
