const { getUserManagementPageData } = require("../../mock/merchant-data");

Page({
  data: getUserManagementPageData("all"),

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onSearchTap() {
    wx.showToast({
      title: "搜索能力后续接入",
      icon: "none"
    });
  },

  onFilterTap(event) {
    const { tabKey } = event.currentTarget.dataset;

    this.setData({
      ...getUserManagementPageData(tabKey)
    });
  },

  onUserTap(event) {
    const { name } = event.currentTarget.dataset;

    wx.showToast({
      title: `查看 ${name}`,
      icon: "none"
    });
  }
});
