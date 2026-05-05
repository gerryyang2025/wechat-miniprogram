const { getMerchantDashboardPageData } = require("../../mock/merchant-data");

Page({
  data: getMerchantDashboardPageData(),

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onShortcutTap(event) {
    const { label } = event.currentTarget.dataset;

    if (label === "商品管理") {
      wx.navigateTo({
        url: "/pages/product-management/product-management"
      });
      return;
    }

    if (label === "直播管理") {
      wx.navigateTo({
        url: "/pages/live-management/live-management"
      });
      return;
    }

    if (label === "用户管理") {
      wx.navigateTo({
        url: "/pages/user-management/user-management"
      });
      return;
    }

    if (label === "内容运营") {
      wx.navigateTo({
        url: "/pages/content-ops/content-ops"
      });
      return;
    }

    wx.showToast({
      title: `${label}下一步接入`,
      icon: "none"
    });
  },

  onTodoTap(event) {
    const { title } = event.currentTarget.dataset;

    wx.showToast({
      title,
      icon: "none"
    });
  }
});
