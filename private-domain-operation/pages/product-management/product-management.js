const { fetchProductManagementPageData } = require("../../services/api/page-data");

Page({
  data: {
    filterTabs: [],
    activeTab: "all",
    productList: []
  },

  async onLoad() {
    this.setData(await fetchProductManagementPageData("all"));
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  async onFilterTap(event) {
    const { tabKey } = event.currentTarget.dataset;
    this.setData(await fetchProductManagementPageData(tabKey));
  },

  onEditTap(event) {
    const { title } = event.currentTarget.dataset;
    const targetItem = this.data.productList.find((item) => item.title === title);

    wx.showToast({
      title: targetItem ? targetItem.editFeedback : `编辑 ${title}`,
      icon: "none"
    });
  },

  onCreateTap() {
    wx.showToast({
      title: this.data.createFeedback,
      icon: "none"
    });
  }
});
