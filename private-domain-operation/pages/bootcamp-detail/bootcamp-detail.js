const {
  getBootcampDetailPageData,
  getBootcampActionMessage
} = require("../../mock/bootcamp-data");
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
      title: getBootcampActionMessage("checkin"),
      icon: "none"
    });
  },

  onNoticeTap() {
    wx.showToast({
      title: getBootcampActionMessage("notice"),
      icon: "none"
    });
  }
});
