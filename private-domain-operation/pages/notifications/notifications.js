const { fetchNotificationsPageData } = require("../../services/api/page-data");

Page({
  data: {
    notificationList: []
  },

  async onLoad() {
    this.setData(await fetchNotificationsPageData());
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  }
});
