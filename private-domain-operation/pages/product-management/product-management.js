const { getProductManagementPageData } = require("../../mock/merchant-data");

Page({
  data: getProductManagementPageData("all"),

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onFilterTap(event) {
    const { tabKey } = event.currentTarget.dataset;

    this.setData({
      ...getProductManagementPageData(tabKey)
    });
  },

  onEditTap(event) {
    const { title } = event.currentTarget.dataset;

    wx.showToast({
      title: `编辑 ${title}`,
      icon: "none"
    });
  },

  onCreateTap() {
    wx.showToast({
      title: "新建商品流程后续接入",
      icon: "none"
    });
  }
});
