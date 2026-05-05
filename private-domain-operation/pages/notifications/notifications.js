const { getNotificationsPageData } = require("../../mock/service-data");

Page({
  data: getNotificationsPageData(),

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  }
});
