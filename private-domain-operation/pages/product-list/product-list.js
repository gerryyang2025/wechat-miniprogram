const {
  fetchProductListPageData
} = require("../../services/api/page-data");
const {
  openPageEntry,
  parseProductListOptions,
} = require("../../utils/navigation");

Page({
  data: {
    filterTabs: [],
    activeTab: "all",
    emptyHint: "",
    productList: []
  },

  async onLoad(options = {}) {
    const { category } = parseProductListOptions(options);
    this.setData(await fetchProductListPageData(category));
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  async onFilterTap(event) {
    const { tabKey } = event.currentTarget.dataset;
    this.setData(await fetchProductListPageData(tabKey));
  },

  onProductTap(event) {
    const { productId } = event.currentTarget.dataset;
    const targetItem = this.data.productList.find((item) => item.id === productId);
    openPageEntry(targetItem ? targetItem.entry : null, "查看详情");
  }
});
