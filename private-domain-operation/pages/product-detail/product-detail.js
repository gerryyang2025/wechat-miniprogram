const { getDetailCourse } = require("../../mock/course-data");
const { savePosterWithFeedback } = require("../../utils/poster");
const {
  openPageEntry,
  parseProductDetailOptions
} = require("../../utils/navigation");

Page({
  data: {
    product: getDetailCourse("course-1"),
    posterSaving: false
  },

  onLoad(options = {}) {
    const { courseId } = parseProductDetailOptions(options);
    this.currentCourseId = courseId;
    const product = getDetailCourse(courseId);

    this.setData({
      product
    });
  },

  onShow() {
    if (!this.currentCourseId) {
      return;
    }

    this.setData({
      product: getDetailCourse(this.currentCourseId)
    });
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onPrimaryTap() {
    openPageEntry(this.data.product.primaryEntry, this.data.product.primaryFeedback || "购买流程后续接入");
  },

  onSecondaryTap() {
    openPageEntry(this.data.product.secondaryEntry, this.data.product.secondaryFeedback || "咨询课程");
  },

  handleLockedLessonAction() {
    openPageEntry(
      this.data.product.lockedLessonAction && this.data.product.lockedLessonAction.entry,
      (this.data.product.lockedLessonAction && this.data.product.lockedLessonAction.feedback) || "完成上一节后解锁"
    );
  },

  onOutlineLessonTap(event) {
    const { lessonId } = event.currentTarget.dataset;
    const targetLesson = (this.data.product.chapters || [])
      .flatMap((chapter) => chapter.lessons || [])
      .find((lesson) => lesson.id === lessonId);

    if (!targetLesson) {
      wx.showToast({
        title: this.data.product.outlineFallbackFeedback || "当前课节播放后续接入",
        icon: "none"
      });
      return;
    }

    if (targetLesson.status === "locked") {
      this.handleLockedLessonAction();
      return;
    }

    if (!targetLesson.entry) {
      wx.showToast({
        title: targetLesson.feedback || this.data.product.outlineFallbackFeedback || "当前课节播放后续接入",
        icon: "none"
      });
      return;
    }

    openPageEntry(targetLesson.entry, targetLesson.feedback || this.data.product.outlineFallbackFeedback || "当前课节播放后续接入");
  },

  async onSavePosterTap() {
    await savePosterWithFeedback(this, {
      selector: "#product-poster-canvas",
      posterOptions: this.buildPosterOptions(),
      savingKey: "posterSaving",
      messages: this.data.product.posterMessages || {}
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
  }
});
