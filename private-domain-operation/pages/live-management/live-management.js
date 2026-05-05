const { getLiveManagementPageData } = require("../../mock/merchant-data");

Page({
  data: getLiveManagementPageData("all"),

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onFilterTap(event) {
    const { tabKey } = event.currentTarget.dataset;
    this.setData(getLiveManagementPageData(tabKey));
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
