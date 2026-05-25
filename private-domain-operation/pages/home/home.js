const { fetchHomePageData } = require("../../services/api/page-data");
const {
  openPageEntry
} = require("../../utils/navigation");

Page({
  data: {
    currentBannerIndex: 0,
    bannerAutoplay: false,
    bannerList: [],
    purchasedCourses: [],
    recommendedCourses: [],
    featureCards: [],
    bannerResumeDelay: 160
  },

  async onShow() {
    const latestData = await fetchHomePageData();

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
    openPageEntry(this.data.searchEntry);
  },

  onOpenCategories() {
    openPageEntry(this.data.categoriesEntry);
  },

  onViewAllOwned() {
    openPageEntry(this.data.ownedAllEntry);
  },

  onOwnedCourseTap(event) {
    const { ownedId } = event.currentTarget.dataset;
    const targetItem = this.data.purchasedCourses.find((item) => item.id === ownedId);
    openPageEntry(targetItem ? targetItem.entry : null, "查看全部");
  },

  onCardTap(event) {
    const { courseId } = event.currentTarget.dataset;
    const targetItem = this.data.recommendedCourses.find((item) => item.id === courseId);
    openPageEntry(targetItem ? targetItem.entry : null, "查看详情");
  },

  onFeatureTap(event) {
    const { featureType } = event.currentTarget.dataset;
    const targetItem = this.data.featureCards.find((item) => item.type === featureType);
    openPageEntry(targetItem ? targetItem.entry : null, "功能下一步接入");
  },

  onOpenLiveCenter() {
    openPageEntry(this.data.liveCenterEntry);
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
    const { bannerResumeDelay } = this.data;

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
