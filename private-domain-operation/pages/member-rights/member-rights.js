const { getMemberRightsPageData } = require("../../mock/service-data");

Page({
  data: getMemberRightsPageData(),

  onLoad(options = {}) {
    const source = decodeURIComponent(options.source || "");
    this.setData(getMemberRightsPageData(source));
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onPrimaryTap() {
    wx.navigateTo({
      url: "/pages/product-list/product-list?category=member"
    });
  },

  onSecondaryTap() {
    wx.navigateTo({
      url: `/pages/consultation/consultation?scene=member&title=${encodeURIComponent("年度会员计划")}`
    });
  }
});
