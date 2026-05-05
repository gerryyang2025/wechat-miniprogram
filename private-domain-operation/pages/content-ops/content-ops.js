const {
  getContentOpsActionFeedback,
  getContentOpsPageData
} = require("../../mock/merchant-data");

Page({
  data: getContentOpsPageData(),

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
