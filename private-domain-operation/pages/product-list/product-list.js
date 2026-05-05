const {
  getProductListPageData
} = require("../../mock/product-browser-data");
const {
  openPageEntry,
  parseProductListOptions,
} = require("../../utils/navigation");

Page({
  data: getProductListPageData("all"),

  onLoad(options = {}) {
    const { category } = parseProductListOptions(options);
    this.setData(getProductListPageData(category));
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onFilterTap(event) {
    const { tabKey } = event.currentTarget.dataset;
    this.setData(getProductListPageData(tabKey));
  },

  onProductTap(event) {
    const { productId } = event.currentTarget.dataset;
    const targetItem = this.data.productList.find((item) => item.id === productId);
    openPageEntry(targetItem ? targetItem.entry : null, "查看详情");
  }
});
