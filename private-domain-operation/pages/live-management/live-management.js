const { fetchLiveManagementPageData } = require("../../services/api/page-data");

Page({
  data: {
    filterTabs: [],
    activeTab: "all",
    liveList: []
  },

  async onLoad() {
    this.setData(await fetchLiveManagementPageData("all"));
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  async onFilterTap(event) {
    const { tabKey } = event.currentTarget.dataset;
    this.setData(await fetchLiveManagementPageData(tabKey));
  },

  onActionTap(event) {
    const { title, action } = event.currentTarget.dataset;
    const targetItem = this.data.liveList.find(
      (item) => item.title === title && item.actionText === action
    );

    wx.showToast({
      title: targetItem ? targetItem.actionFeedback : `${action} · ${title}`,
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
