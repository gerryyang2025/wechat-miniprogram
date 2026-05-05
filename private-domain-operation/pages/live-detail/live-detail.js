const { getLiveDetail } = require("../../mock/live-data");

Page({
  data: {
    live: getLiveDetail("live-private-domain-qa"),
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
    const live = getLiveDetail(liveId);
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
