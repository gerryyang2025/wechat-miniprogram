const { clone } = require("./shared");

const liveCatalog = {
  "live-private-domain-qa": {
    id: "live-private-domain-qa",
    title: "今晚 20:00 私域运营直播答疑",
    speaker: "Gerry",
    duration: "预计 90 分钟",
    viewers: "1,286 人已预约",
    upcomingStatus: "今晚 20:00 开播",
    liveStatus: "正在直播中",
    replayStatus: "回放已开放",
    coverHint: "内容变现 / 学员转化 / 日常运营问题",
    intro:
      "围绕个人 IP 内容经营中的高频问题展开答疑，重点讨论内容节奏、私域承接方式、训练营转化和直播后的复盘动作。",
    accessRules: [
      "课程学员可进入直播间观看",
      "训练营成员可同步参与互动答疑",
      "直播结束后会提供精选回放说明"
    ],
    highlights: [
      "如何把直播答疑转成后续内容素材",
      "学员咨询高频问题的统一回答方式",
      "训练营与直播如何形成联动节奏"
    ],
    replaySupport: [
      "支持按照重点片段进行多次回看",
      "已补充图文复盘提示，适合二次整理内容框架",
      "可结合课程目录同步对照学习与复盘"
    ],
    replayMoments: [
      {
        range: "08:20 - 15:40",
        title: "社群转化节奏拆解",
        desc: "适合先回看直播里的节奏设计与转化节点安排。"
      },
      {
        range: "23:18 - 36:50",
        title: "学员提问统一回应方式",
        desc: "集中整理高频咨询问题，便于后续沉淀成标准答复。"
      },
      {
        range: "52:10 - 68:00",
        title: "训练营与直播联动复盘",
        desc: "适合对照训练营任务继续复盘后续内容节奏。"
      }
    ],
    teacherBio:
      "Gerry 长期聚焦个人 IP、知识产品和私域运营实践，擅长将内容表达、产品设计和运营节奏结合起来，帮助创作者建立更稳定的内容经营路径。"
  },
  "live-content-clinic": {
    id: "live-content-clinic",
    title: "内容门诊室：短视频表达即时答疑",
    speaker: "Gerry",
    duration: "预计 60 分钟",
    viewers: "428 人正在观看",
    upcomingStatus: "今晚 21:00 开播",
    liveStatus: "正在直播中",
    replayStatus: "回放整理中",
    coverHint: "口播节奏 / 镜头表达 / 开场结构",
    intro:
      "聚焦短视频表达与镜头状态的即时答疑，围绕开场、节奏、停顿、口播结构等问题进行现场拆解。",
    accessRules: [
      "会员用户可进入直播间观看",
      "课程学员可参与问答互动",
      "直播结束后将整理重点片段说明"
    ],
    highlights: [
      "常见口播问题的现场纠偏方式",
      "短视频开场结构与节奏拆解",
      "直播内容如何沉淀成后续课程素材"
    ],
    replaySupport: [
      "回放会保留高频片段，适合分段复看与模仿练习",
      "建议结合口播练习同步暂停记录表达问题",
      "后续可将重点问题整理到课程学习笔记中"
    ],
    replayMoments: [
      {
        range: "05:10 - 11:30",
        title: "开场结构拆解",
        desc: "适合重点复盘开场逻辑、镜头进入方式与节奏。"
      },
      {
        range: "18:00 - 27:20",
        title: "口播停顿与节奏",
        desc: "适合二次回放时跟读模仿，感受停顿和重音。"
      }
    ],
    teacherBio:
      "Gerry 长期进行内容表达训练与课程交付设计，擅长把短视频创作拆成可练习、可复盘的动作。"
  },
  "live-bootcamp-review": {
    id: "live-bootcamp-review",
    title: "7 天训练营复盘直播回放",
    speaker: "Gerry",
    duration: "45 分钟",
    viewers: "训练营成员专属回放",
    upcomingStatus: "训练营直播已结束",
    liveStatus: "直播已结束",
    replayStatus: "回放已开放",
    coverHint: "打卡复盘 / 作业点评 / 私域节奏整理",
    intro:
      "针对训练营中提交的作业和打卡内容进行集中复盘，帮助学员把日更动作、朋友圈内容和咨询承接真正串起来。",
    accessRules: [
      "训练营成员可观看完整回放",
      "回放期间可对照当天任务继续复盘",
      "重点问题会整理成图文说明补充"
    ],
    highlights: [
      "作业常见问题与修改建议",
      "训练营节奏如何迁移到日常运营",
      "复盘内容如何沉淀为后续内容模板"
    ],
    replaySupport: [
      "支持训练营成员反复回看作业点评与节奏建议",
      "可对照每日任务继续整理自己的复盘清单",
      "后续建议结合训练营打卡页一起查看重点动作"
    ],
    replayMoments: [
      {
        range: "03:40 - 12:20",
        title: "朋友圈作业点评",
        desc: "适合训练营成员对照自己的作业再次复盘表达结构。"
      },
      {
        range: "21:00 - 31:10",
        title: "咨询承接与后续跟进",
        desc: "适合整理训练营结束后的私域承接动作。"
      }
    ],
    teacherBio:
      "Gerry 侧重训练营陪跑与作业复盘，擅长把零散问题整理成可复用的内容交付模板。"
  }
};

const liveListFilterTabs = [
  { key: "all", label: "全部" },
  { key: "upcoming", label: "即将开始" },
  { key: "live", label: "直播中" },
  { key: "replay", label: "回放" }
];

const liveListItems = [
  {
    id: "live-private-domain-qa",
    status: "upcoming",
    title: "今晚 20:00 私域运营直播答疑",
    speaker: "Gerry",
    schedule: "今天 20:00 - 21:30",
    audience: "课程学员 / 训练营成员可观看",
    summary: "聚焦内容变现、训练营承接和直播后复盘动作。",
    actionText: "查看详情"
  },
  {
    id: "live-content-clinic",
    status: "live",
    title: "内容门诊室：短视频表达即时答疑",
    speaker: "Gerry",
    schedule: "正在直播中",
    audience: "会员用户可进入互动",
    summary: "直播中拆解口播节奏、镜头表达和开场结构。",
    actionText: "进入直播间"
  },
  {
    id: "live-private-domain-qa",
    status: "replay",
    title: "私域运营直播答疑回放精选",
    speaker: "Gerry",
    schedule: "回放已开放 · 90 分钟",
    audience: "已购课程用户可反复观看",
    summary: "整理直播中的高频问题，适合复盘内容节奏与用户转化。",
    note: "附重点片段与复盘建议",
    actionText: "继续回看"
  },
  {
    id: "live-bootcamp-review",
    status: "replay",
    title: "7 天训练营复盘直播回放",
    speaker: "Gerry",
    schedule: "回放已开放 · 45 分钟",
    audience: "训练营成员专属回放",
    summary: "围绕朋友圈作业、训练营打卡和咨询转化做集中复盘。",
    note: "附训练营作业点评摘要",
    actionText: "查看回放"
  }
];

const liveRoomCatalog = {
  "live-private-domain-qa": {
    liveAudienceText: "在线 326",
    liveTopic: "今天聚焦：内容变现与学员转化答疑",
    liveNotice: "今晚互动答疑以高频问题为主，直播后会整理重点笔记。",
    liveMessages: [
      { id: "msg-1", user: "时昕同学", text: "请问训练营内容和直播节奏怎么衔接？" },
      { id: "msg-2", user: "内容创业者", text: "课程更新后，旧学员会同步看到吗？" },
      { id: "msg-3", user: "Gerry", text: "稍后会重点讲训练营与直播联动的节奏安排。" }
    ],
    replayAudienceText: "回放观看 518",
    replayTopic: "当前播放：社群转化节奏与直播答疑结构",
    replayNotice: "当前为直播回放示例页，建议先按重点片段回看，再记录复盘笔记。",
    replayMessages: [
      { id: "replay-1", user: "重点片段", text: "08:20 - 15:40 社群转化节奏拆解" },
      { id: "replay-2", user: "重点片段", text: "23:18 - 36:50 学员提问统一回应方式" },
      { id: "replay-3", user: "复盘建议", text: "建议结合已购课程中的转化章节一起二次复盘。" }
    ],
    replayProgress: "已观看至 23:18 / 90:00",
    replaySummary: "回放已开放，适合按重点片段复看并同步整理学员咨询的统一答复。",
    replayHighlights: [
      "先回看社群转化节奏，再看提问整理方式",
      "建议边看边记录可复用的直播答疑话术",
      "结合课程目录同步复盘直播后的沉淀动作"
    ]
  },
  "live-content-clinic": {
    liveAudienceText: "在线 214",
    liveTopic: "今天聚焦：短视频开场、口播与镜头表达答疑",
    liveNotice: "当前直播以即时答疑为主，结束后会整理部分重点片段。",
    liveMessages: [
      { id: "msg-1", user: "口播学员", text: "开场前两句总是说不顺，应该怎么调整？" },
      { id: "msg-2", user: "视频创作者", text: "口播停顿总是太碎，有没有练习方法？" },
      { id: "msg-3", user: "Gerry", text: "稍后会先集中讲开场结构，再讲停顿和节奏。" }
    ],
    replayAudienceText: "回放观看 243",
    replayTopic: "当前播放：短视频表达重点片段",
    replayNotice: "建议暂停回放跟读练习，再对照自己的口播稿做调整。",
    replayMessages: [
      { id: "replay-1", user: "重点片段", text: "05:10 - 11:30 开场结构拆解" },
      { id: "replay-2", user: "重点片段", text: "18:00 - 27:20 口播停顿与节奏" }
    ],
    replayProgress: "已观看至 10:42 / 60:00",
    replaySummary: "本场回放更适合分段练习，建议结合暂停和跟读模仿使用。",
    replayHighlights: [
      "优先回看开场结构，再看口播节奏片段",
      "建议边暂停边模仿，强化节奏感"
    ]
  },
  "live-bootcamp-review": {
    liveAudienceText: "在线 168",
    liveTopic: "今天聚焦：训练营作业点评与后续承接复盘",
    liveNotice: "当前直播主要围绕朋友圈作业、咨询承接和节奏复盘展开。",
    liveMessages: [
      { id: "msg-1", user: "训练营成员", text: "朋友圈内容总感觉太像在卖课，怎么调整？" },
      { id: "msg-2", user: "训练营成员", text: "直播结束后怎么继续承接咨询？" },
      { id: "msg-3", user: "Gerry", text: "稍后会先点评作业，再讲私域后续承接动作。" }
    ],
    replayAudienceText: "训练营成员回放 96",
    replayTopic: "当前播放：训练营复盘与作业点评重点",
    replayNotice: "建议边看边对照训练营作业与打卡内容做二次整理。",
    replayMessages: [
      { id: "replay-1", user: "重点片段", text: "03:40 - 12:20 朋友圈作业点评" },
      { id: "replay-2", user: "重点片段", text: "21:00 - 31:10 咨询承接与后续跟进" }
    ],
    replayProgress: "已观看至 12:08 / 45:00",
    replaySummary: "训练营回放更适合对照自己的打卡和作业反复复盘。",
    replayHighlights: [
      "先对照作业点评，再看咨询承接片段",
      "建议同步整理自己的训练营复盘清单"
    ]
  }
};

function getLiveDetail(liveId = "live-private-domain-qa") {
  return clone(liveCatalog[liveId] || liveCatalog["live-private-domain-qa"]);
}

function getLiveListTabs() {
  return clone(liveListFilterTabs);
}

function getLiveList(activeTab = "all") {
  if (activeTab === "all") {
    return clone(liveListItems);
  }

  return clone(liveListItems.filter((item) => item.status === activeTab));
}

function getLiveRoom(liveId = "live-private-domain-qa") {
  return clone(liveRoomCatalog[liveId] || liveRoomCatalog["live-private-domain-qa"]);
}

module.exports = {
  getLiveDetail,
  getLiveListTabs,
  getLiveList,
  getLiveRoom
};
