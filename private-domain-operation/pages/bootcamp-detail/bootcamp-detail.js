const { getBootcampDetailPageData } = require("../../mock/bootcamp-data");
const { parseBootcampDetailOptions } = require("../../utils/navigation");

Page({
  data: getBootcampDetailPageData("camp-7day-growth"),

  onLoad(options = {}) {
    const { campId } = parseBootcampDetailOptions(options);

    this.setData({
      ...getBootcampDetailPageData(campId)
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
