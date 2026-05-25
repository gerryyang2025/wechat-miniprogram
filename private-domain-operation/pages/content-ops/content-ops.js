const {
  getContentOpsActionFeedback,
} = require("../../mock/merchant-data");
const { fetchContentOpsPageData } = require("../../services/api/page-data");

Page({
  data: {
    banners: [],
    recommendationSlots: [],
    notices: []
  },

  async onLoad() {
    this.setData(await fetchContentOpsPageData());
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onActionTap(event) {
    const { label } = event.currentTarget.dataset;

    wx.showToast({
      title: getContentOpsActionFeedback(label),
      icon: "none"
    });
  }
});
