const {
  getHomePageData,
  getHomeFeatureEntry,
  getHomeOwnedEntry,
  getHomePageMeta,
  getHomeRecommendedEntry
} = require("../../mock/home-data");
const {
  openPageEntry
} = require("../../utils/navigation");

Page({
  data: getHomePageData(),

  onShow() {
    const latestData = getHomePageData();

    this.setData(latestData);
    this.resumeBannerAutoplay();
  },

  onHide() {
    this.pauseBannerAutoplay();
  },

  onUnload() {
    this.pauseBannerAutoplay();
  },

  onSearchTap() {
    openPageEntry(getHomePageMeta().searchEntry);
  },

  onOpenCategories() {
    openPageEntry(getHomePageMeta().categoriesEntry);
  },

  onViewAllOwned() {
    openPageEntry(getHomePageMeta().ownedAllEntry);
  },

  onOwnedCourseTap(event) {
    const { ownedId } = event.currentTarget.dataset;
    openPageEntry(getHomeOwnedEntry(ownedId), "查看全部");
  },

  onCardTap(event) {
    const { courseId } = event.currentTarget.dataset;
    openPageEntry(getHomeRecommendedEntry(courseId), "查看详情");
  },

  onFeatureTap(event) {
    const { featureType } = event.currentTarget.dataset;
    openPageEntry(getHomeFeatureEntry(featureType), "功能下一步接入");
  },

  onOpenLiveCenter() {
    openPageEntry(getHomePageMeta().liveCenterEntry);
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
    const { bannerResumeDelay } = getHomePageMeta();

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
    }, bannerResumeDelay);
  }
});
