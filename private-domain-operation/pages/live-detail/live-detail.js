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
    teacherBio:
      "Gerry 侧重训练营陪跑与作业复盘，擅长把零散问题整理成可复用的内容交付模板。"
  }
};

Page({
  data: {
    live: liveCatalog["live-private-domain-qa"],
    mode: "upcoming",
    statusText: "",
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
      statusText: isReplay ? live.replayStatus : isLive ? live.liveStatus || "正在直播中" : live.upcomingStatus,
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
