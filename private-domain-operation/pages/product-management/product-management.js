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
    this.setData(getProductManagementPageData(tabKey));
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
