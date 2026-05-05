const { getLiveManagementPageData } = require("../../mock/merchant-data");

Page({
  data: getLiveManagementPageData("all"),

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onFilterTap(event) {
    const { tabKey } = event.currentTarget.dataset;

    this.setData({
      ...getLiveManagementPageData(tabKey)
    });
  },

  onActionTap(event) {
    const { title, action } = event.currentTarget.dataset;

    wx.showToast({
      title: `${action} · ${title}`,
      icon: "none"
    });
  },

  onCreateTap() {
    wx.showToast({
      title: "新建直播流程后续接入",
      icon: "none"
    });
  }
});
