const { getLiveRoomPageData } = require("../../mock/live-data");
const { parseLiveRoomOptions } = require("../../utils/navigation");

Page({
  data: getLiveRoomPageData("live-private-domain-qa", "live", "直播间"),

  onLoad(options = {}) {
    const { liveId, mode, title } = parseLiveRoomOptions(options);

    this.setData({
      ...getLiveRoomPageData(liveId, mode, title)
    });
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onAskTap() {
    wx.showToast({
      title: this.data.askFeedback,
      icon: "none"
    });
  }
});
