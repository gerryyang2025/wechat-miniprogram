const { getPlayerCourse } = require("../../mock/course-data");
const {
  getLearningPageData,
  getPlayerCourseIdByLearningId,
  getDetailCourseIdByLearningId,
  getBootcampIdByLearningId,
  getLiveEntryByLearningId
} = require("../../mock/learning-data");

Page({
  data: getLearningPageData(),

  onSearchTap() {
    wx.showToast({
      title: "原型阶段暂不支持搜索",
      icon: "none"
    });
  },

  onOpenLiveCenter() {
    wx.navigateTo({
      url: "/pages/live-list/live-list"
    });
  },

  onItemTap(event) {
    const { itemId } = event.currentTarget.dataset;
    const detailCourseId = getDetailCourseIdByLearningId(itemId);
    const targetBootcampId = getBootcampIdByLearningId(itemId);
    const targetLive = getLiveEntryByLearningId(itemId);

    if (detailCourseId) {
      wx.navigateTo({
        url: `/pages/product-detail/product-detail?courseId=${encodeURIComponent(detailCourseId)}`
      });
      return;
    }

    if (targetBootcampId) {
      wx.navigateTo({
        url: `/pages/bootcamp-detail/bootcamp-detail?campId=${encodeURIComponent(targetBootcampId)}`
      });
      return;
    }

    if (targetLive) {
      wx.navigateTo({
        url:
          `/pages/live-detail/live-detail?liveId=${encodeURIComponent(targetLive.liveId)}` +
          `&mode=${encodeURIComponent(targetLive.mode)}`
      });
    }
  },

  onContinueTap(event) {
    const { itemId } = event.currentTarget.dataset;
    const playerCourseId = getPlayerCourseIdByLearningId(itemId);
    const targetCourse = playerCourseId ? getPlayerCourse(playerCourseId) : null;
    const targetBootcampId = getBootcampIdByLearningId(itemId);
    const targetLive = getLiveEntryByLearningId(itemId);

    if (targetCourse) {
      wx.navigateTo({
        url: `/pages/course-player/course-player?courseId=${encodeURIComponent(targetCourse.id)}`
      });
      return;
    }

    if (targetBootcampId) {
      wx.navigateTo({
        url: `/pages/bootcamp-detail/bootcamp-detail?campId=${encodeURIComponent(targetBootcampId)}`
      });
      return;
    }

    if (targetLive) {
      wx.navigateTo({
        url:
          `/pages/live-detail/live-detail?liveId=${encodeURIComponent(targetLive.liveId)}` +
          `&mode=${encodeURIComponent(targetLive.mode)}`
      });
      return;
    }

    wx.showToast({
      title: "视频播放下一步接入",
      icon: "none"
    });
  }
});
