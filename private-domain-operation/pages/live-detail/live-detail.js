const { getLiveDetailPageData } = require("../../mock/live-data");
const {
  POSTER_SIZE,
  drawPoster,
  ensureAlbumPermission,
  saveImageToAlbum
} = require("../../utils/poster");
const {
  parseLiveDetailOptions,
  toLiveRoom,
  toConsultation
} = require("../../utils/navigation");

Page({
  data: {
    ...getLiveDetailPageData("live-private-domain-qa", "upcoming"),
    posterSaving: false
  },

  onLoad(options = {}) {
    const { liveId, mode } = parseLiveDetailOptions(options);
    this.setData({
      ...getLiveDetailPageData(liveId, mode)
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
      url: toLiveRoom(this.data.live.id, roomMode, this.data.live.title)
    });
  },

  onSecondaryTap() {
    wx.navigateTo({
      url: toConsultation("live", this.data.live.title)
    });
  },

  async onSavePosterTap() {
    if (this.data.posterSaving) {
      return;
    }

    this.setData({
      posterSaving: true
    });

    wx.showLoading({
      title: "海报生成中",
      mask: true
    });

    try {
      const filePath = await this.exportPosterImage();

      wx.hideLoading();
      wx.showLoading({
        title: "正在保存",
        mask: true
      });

      await ensureAlbumPermission();
      await saveImageToAlbum(filePath);

      wx.hideLoading();
      wx.showToast({
        title: "海报已保存",
        icon: "success"
      });
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: "海报保存失败",
        icon: "none"
      });
    } finally {
      this.setData({
        posterSaving: false
      });
    }
  },

  getPosterCanvas() {
    if (this.posterCanvas) {
      return Promise.resolve(this.posterCanvas);
    }

    return new Promise((resolve, reject) => {
      wx.createSelectorQuery()
        .in(this)
        .select("#live-poster-canvas")
        .fields({ node: true, size: true })
        .exec((res) => {
          const canvasRef = res && res[0];

          if (!canvasRef || !canvasRef.node) {
            reject(new Error("poster canvas not found"));
            return;
          }

          this.posterCanvas = canvasRef.node;
          resolve(this.posterCanvas);
        });
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
  },

  async exportPosterImage() {
    const canvas = await this.getPosterCanvas();
    const ctx = canvas.getContext("2d");

    canvas.width = POSTER_SIZE.width;
    canvas.height = POSTER_SIZE.height;

    drawPoster(ctx, this.buildPosterOptions());

    return new Promise((resolve, reject) => {
      wx.canvasToTempFilePath({
        canvas,
        width: POSTER_SIZE.width,
        height: POSTER_SIZE.height,
        destWidth: POSTER_SIZE.width,
        destHeight: POSTER_SIZE.height,
        success: (res) => {
          resolve(res.tempFilePath);
        },
        fail: (error) => {
          reject(error || new Error("canvas export failed"));
        }
      });
    });
  }
});
