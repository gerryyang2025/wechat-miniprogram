const { fetchBootcampDetailPageData } = require("../../services/api/page-data");
const { parseBootcampDetailOptions } = require("../../utils/navigation");

Page({
  data: {
    bootcamp: {},
    navSubtitle: "",
    footerTip: "",
    checkInActionLabel: "",
    checkInFeedback: "",
    noticeActionLabel: "",
    noticeFeedback: ""
  },

  async onLoad(options = {}) {
    const { campId } = parseBootcampDetailOptions(options);

    this.setData({
      ...(await fetchBootcampDetailPageData(campId))
    });
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onCheckInTap() {
    wx.showToast({
      title: this.data.checkInFeedback,
      icon: "none"
    });
  },

  onNoticeTap() {
    wx.showToast({
      title: this.data.noticeFeedback,
      icon: "none"
    });
  }
});
