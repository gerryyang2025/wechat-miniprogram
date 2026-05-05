const { getPlayerCourse } = require("../../mock/course-data");
const {
  getHomePageData,
  getOwnedCoursePlayerCourseId,
  getHomePrimaryLiveEntry
} = require("../../mock/home-data");

Page({
  data: getHomePageData(),

  getLiveEntry() {
    return getHomePrimaryLiveEntry();
  },

  getPlayableCourseByOwnedId(ownedId) {
    return getPlayerCourse(getOwnedCoursePlayerCourseId(ownedId));
  },

  onShow() {
    this.resumeBannerAutoplay();
  },

  onHide() {
    this.pauseBannerAutoplay();
  },

  onUnload() {
    this.pauseBannerAutoplay();
  },

  onSearchTap() {
    wx.navigateTo({
      url: "/pages/product-list/product-list?category=all"
    });
  },

  onOpenCategories() {
    wx.navigateTo({
      url: "/pages/product-categories/product-categories"
    });
  },

  onViewAllOwned() {
    wx.reLaunch({
      url: "/pages/learning/learning"
    });
  },

  onOwnedCourseTap(event) {
    const { ownedId } = event.currentTarget.dataset;
    const targetCourse = this.getPlayableCourseByOwnedId(ownedId);

    if (targetCourse) {
      wx.navigateTo({
        url: `/pages/course-player/course-player?courseId=${encodeURIComponent(targetCourse.id)}`
      });
      return;
    }

    this.onViewAllOwned();
  },

  onCardTap(event) {
    const { courseId } = event.currentTarget.dataset;

    wx.navigateTo({
      url: `/pages/product-detail/product-detail?courseId=${encodeURIComponent(courseId)}`
    });
  },

  onFeatureTap(event) {
    const { label, featureType } = event.currentTarget.dataset;

    if (featureType === "camp") {
      wx.navigateTo({
        url: "/pages/bootcamp-detail/bootcamp-detail?campId=camp-7day-growth"
      });
      return;
    }

    if (featureType === "live") {
      const { liveId, mode } = this.getLiveEntry();

      wx.navigateTo({
        url: `/pages/live-detail/live-detail?liveId=${encodeURIComponent(liveId)}&mode=${encodeURIComponent(mode)}`
      });
      return;
    }

    wx.showToast({
      title: `${label}功能下一步接入`,
      icon: "none"
    });
  },

  onOpenLiveCenter() {
    wx.navigateTo({
      url: "/pages/live-list/live-list"
    });
  },

  onBannerChange(event) {
    this.setData({
      currentBannerIndex: event.detail.current
    });
  },

  pauseBannerAutoplay() {
    if (this.bannerAutoplayTimer) {
      clearTimeout(this.bannerAutoplayTimer);
      this.bannerAutoplayTimer = null;
    }

    this.setData({
      bannerAutoplay: false
    });
  },

  resumeBannerAutoplay() {
    if (this.bannerAutoplayTimer) {
      clearTimeout(this.bannerAutoplayTimer);
      this.bannerAutoplayTimer = null;
    }

    this.setData({
      bannerAutoplay: false
    });

    this.bannerAutoplayTimer = setTimeout(() => {
      this.setData({
        bannerAutoplay: true
      });
      this.bannerAutoplayTimer = null;
    }, 160);
  }
});
