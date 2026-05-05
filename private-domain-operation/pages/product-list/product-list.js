const {
  getProductFilterTabs,
  getFilteredProducts
} = require("../../mock/product-browser-data");

Page({
  data: {
    filterTabs: getProductFilterTabs(),
    activeTab: "all",
    productList: getFilteredProducts("all")
  },

  onLoad(options = {}) {
    const category = decodeURIComponent(options.category || "all");
    const activeTab = ["all", "course", "camp", "member"].includes(category) ? category : "all";

    this.setData({
      activeTab,
      productList: getFilteredProducts(activeTab)
    });
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onFilterTap(event) {
    const { tabKey } = event.currentTarget.dataset;

    this.setData({
      activeTab: tabKey,
      productList: getFilteredProducts(tabKey)
    });
  },

  onProductTap(event) {
    const { productId, productType } = event.currentTarget.dataset;

    if (productType === "course") {
      wx.navigateTo({
        url: `/pages/product-detail/product-detail?courseId=${encodeURIComponent(productId)}`
      });
      return;
    }

    if (productType === "camp") {
      wx.navigateTo({
        url: `/pages/bootcamp-detail/bootcamp-detail?campId=${encodeURIComponent(productId)}`
      });
      return;
    }

    if (productType === "member") {
      wx.navigateTo({
        url: "/pages/member-rights/member-rights"
      });
    }
  }
});
