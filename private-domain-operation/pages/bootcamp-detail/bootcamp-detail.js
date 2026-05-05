const { getBootcamp } = require("../../mock/bootcamp-data");

Page({
  data: {
    bootcamp: getBootcamp("camp-7day-growth")
  },

  onLoad(options = {}) {
    const campId = decodeURIComponent(options.campId || "camp-7day-growth");

    this.setData({
      bootcamp: getBootcamp(campId)
    });
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onCheckInTap() {
    wx.showToast({
      title: "打卡功能后续接入",
      icon: "none"
    });
  },

  onNoticeTap() {
    wx.showToast({
      title: "公告详情后续接入",
      icon: "none"
    });
  }
});
