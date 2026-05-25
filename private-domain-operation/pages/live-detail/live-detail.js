const { fetchLiveDetailPageData } = require("../../services/api/page-data");
const { savePosterWithFeedback } = require("../../utils/poster");
const {
  openPageEntry,
  parseLiveDetailOptions
} = require("../../utils/navigation");

Page({
  data: {
    live: {},
    mode: "upcoming",
    isReplay: false,
    posterSaving: false
  },

  async onLoad(options = {}) {
    const { liveId, mode } = parseLiveDetailOptions(options);
    this.setData({
      ...(await fetchLiveDetailPageData(liveId, mode))
    });
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onPrimaryTap() {
    openPageEntry(this.data.primaryEntry, this.data.primaryFeedback || "进入直播间");
  },

  onSecondaryTap() {
    openPageEntry(this.data.secondaryEntry, this.data.secondaryFeedback || "咨询直播");
  },

  async onSavePosterTap() {
    await savePosterWithFeedback(this, {
      selector: "#live-poster-canvas",
      posterOptions: this.buildPosterOptions(),
      savingKey: "posterSaving",
      messages: this.data.posterMessages || {}
    });
  },

  buildPosterOptions() {
    const { live, mode } = this.data;
    const typeLabel = mode === "replay" ? "直播回放" : mode === "live" ? "直播中" : "即将开播";

    return {
      brand: "时昕有点懒",
      routeLabel: "直播详情海报",
      typeLabel,
      title: live.title,
      subtitle: `讲师 · ${live.speaker}`,
      meta: `${live.duration} · ${this.data.statusText}`,
      summaryLabel: mode === "replay" ? "回放说明" : "直播介绍",
      summary: live.intro,
      pills: (mode === "replay" ? live.replaySupport : live.accessRules) || [],
      sectionTitle: mode === "replay" ? "推荐回看重点" : "本场看点",
      bullets:
        (mode === "replay"
          ? (live.replayMoments || []).map((item) => `${item.range} · ${item.title}`)
          : live.highlights) || [],
      footerTitle: mode === "replay" ? "微信打开小程序查看完整回放说明" : "微信打开小程序进入直播详情",
      footerText: mode === "replay" ? "包含重点片段、咨询入口与训练营联动说明" : "包含直播看点、观看条件与咨询入口",
      colors: {
        topStart: "#4658df",
        topEnd: "#7b5bff",
        chipBg: "rgba(255,255,255,0.22)",
        chipText: "#ffffff",
        primaryText: "#202742",
        secondaryText: "#65708f",
        cardBg: "#ffffff",
        softBg: "#f5f7ff",
        accent: "#5d6fff",
        footerBg: "#eef2ff"
      }
    };
  }
});
