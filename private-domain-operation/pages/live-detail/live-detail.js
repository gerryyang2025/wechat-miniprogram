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

Page({
  data: {
    live: liveCatalog["live-private-domain-qa"],
    mode: "upcoming",
    isReplay: false,
    statusText: "",
    statusPanelTitle: "观看建议",
    statusPanelTag: "",
    statusPanelSummary: "",
    statusPanelItems: [],
    sectionIntroTitle: "准入说明",
    sectionHighlightTitle: "本场看点",
    navSubtitle: "观看条件与直播看点",
    primaryActionText: "进入直播间",
    secondaryActionText: "咨询直播"
  },

  onLoad(options = {}) {
    const liveId = decodeURIComponent(options.liveId || "live-private-domain-qa");
    const mode = decodeURIComponent(options.mode || "upcoming");
    const live = liveCatalog[liveId] || liveCatalog["live-private-domain-qa"];
    const isReplay = mode === "replay";
    const isLive = mode === "live";

    this.setData({
      live,
      mode,
      isReplay,
      statusText: isReplay ? live.replayStatus : isLive ? live.liveStatus || "正在直播中" : live.upcomingStatus,
      navSubtitle: isReplay ? "回放说明与复盘重点" : "观看条件与直播看点",
      statusPanelTitle: isReplay ? "回放状态" : isLive ? "直播提醒" : "开播提醒",
      statusPanelTag: isReplay ? "支持反复观看" : isLive ? "互动进行中" : "建议提前进入",
      statusPanelSummary: isReplay
        ? "本场直播已经整理为回放内容，适合按重点片段复看并同步记录复盘笔记。"
        : isLive
          ? "当前为直播中状态，适合直接进入直播间观看并参与互动。"
          : "建议在开播前 5 分钟进入直播间，提前确认观看环境与互动节奏。",
      statusPanelItems: isReplay ? live.replaySupport || [] : live.accessRules,
      sectionIntroTitle: isReplay ? "回放说明" : "准入说明",
      sectionHighlightTitle: isReplay ? "回放重点" : "本场看点",
      primaryActionText: isReplay ? "查看回放" : "进入直播间",
      secondaryActionText: isReplay ? "咨询回放" : "咨询直播"
    });
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onPrimaryTap() {
    const roomMode = this.data.mode === "replay" ? "replay" : "live";

    wx.navigateTo({
      url:
        `/pages/live-room/live-room?liveId=${encodeURIComponent(this.data.live.id)}` +
        `&mode=${encodeURIComponent(roomMode)}` +
        `&title=${encodeURIComponent(this.data.live.title)}`
    });
  },

  onSecondaryTap() {
    wx.navigateTo({
      url:
        `/pages/consultation/consultation?scene=live` +
        `&title=${encodeURIComponent(this.data.live.title)}`
    });
  }
});
