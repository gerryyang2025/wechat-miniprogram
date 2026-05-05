const { getDetailCourse } = require("../../mock/course-data");
const {
  POSTER_SIZE,
  drawPoster,
  ensureAlbumPermission,
  saveImageToAlbum
} = require("../../utils/poster");

Page({
  data: {
    product: getDetailCourse("course-1"),
    posterSaving: false
  },

  onLoad(options = {}) {
    const courseId = decodeURIComponent(options.courseId || "course-1");
    const product = getDetailCourse(courseId);

    this.setData({
      product
    });
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onPrimaryTap() {
    const { product } = this.data;

    if (product.primaryActionType === "learning") {
      wx.reLaunch({
        url: "/pages/learning/learning"
      });
      return;
    }

    wx.showToast({
      title: "购买流程后续接入",
      icon: "none"
    });
  },

  onSecondaryTap() {
    wx.navigateTo({
      url:
        `/pages/consultation/consultation?scene=course` +
        `&title=${encodeURIComponent(this.data.product.title)}`
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
        .select("#product-poster-canvas")
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
    const { product } = this.data;

    return {
      brand: "时昕有点懒",
      routeLabel: "商品详情海报",
      typeLabel: product.tag || "课程",
      title: product.title,
      subtitle: `讲师 · ${product.author}`,
      meta: `${product.meta} · ${product.price}`,
      summaryLabel: "课程介绍",
      summary: product.description,
      pills: product.suitable || [],
      sectionTitle: "你将获得",
      bullets: product.gains || [],
      footerTitle: "微信打开小程序查看完整课程内容",
      footerText: "包含课程目录、学习进度、直播回放与咨询入口",
      colors: {
        topStart: "#4f74ff",
        topEnd: "#7d5eff",
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
