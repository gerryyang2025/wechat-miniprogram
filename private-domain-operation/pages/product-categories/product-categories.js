const { getProductCategories } = require("../../mock/product-browser-data");

Page({
  data: {
    categoryList: getProductCategories()
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onCategoryTap(event) {
    const { categoryKey } = event.currentTarget.dataset;

    wx.navigateTo({
      url: `/pages/product-list/product-list?category=${encodeURIComponent(categoryKey)}`
    });
  },

  onOpenAllTap() {
    wx.navigateTo({
      url: "/pages/product-list/product-list?category=all"
    });
  }
});
