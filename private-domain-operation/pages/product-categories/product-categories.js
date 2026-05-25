const { fetchProductCategories } = require("../../services/api/page-data");
const { toProductList } = require("../../utils/navigation");

Page({
  data: {
    categoryList: []
  },

  async onLoad() {
    this.setData({
      categoryList: await fetchProductCategories()
    });
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
