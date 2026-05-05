const { getProductCategories } = require("../../mock/product-browser-data");
const { toProductList } = require("../../utils/navigation");

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
      url: toProductList(categoryKey)
    });
  },

  onOpenAllTap() {
    wx.navigateTo({
      url: toProductList("all")
    });
  }
});
