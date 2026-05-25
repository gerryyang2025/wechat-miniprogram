const { fetchUserManagementPageData } = require("../../services/api/page-data");

Page({
  data: {
    filterTabs: [],
    activeTab: "all",
    userList: []
  },

  async onLoad() {
    this.setData(await fetchUserManagementPageData("all"));
  },

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

  async onFilterTap(event) {
    const { tabKey } = event.currentTarget.dataset;
    this.setData(await fetchUserManagementPageData(tabKey));
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
