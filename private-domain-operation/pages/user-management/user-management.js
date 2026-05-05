const { getUserManagementPageData } = require("../../mock/merchant-data");

Page({
  data: getUserManagementPageData("all"),

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onSearchTap() {
    wx.showToast({
      title: this.data.searchFeedback,
      icon: "none"
    });
  },

  onFilterTap(event) {
    const { tabKey } = event.currentTarget.dataset;
    this.setData(getUserManagementPageData(tabKey));
  },

  onUserTap(event) {
    const { name } = event.currentTarget.dataset;
    const targetItem = this.data.userList.find((item) => item.name === name);

    wx.showToast({
      title: targetItem ? targetItem.tapFeedback : `查看 ${name}`,
      icon: "none"
    });
  }
});
