const { fetchLiveRoomPageData } = require("../../services/api/page-data");
const { parseLiveRoomOptions } = require("../../utils/navigation");

Page({
  data: {
    liveId: "",
    title: "直播间",
    mode: "live",
    messages: [],
    replayHighlights: []
  },

  async onLoad(options = {}) {
    const { liveId, mode, title } = parseLiveRoomOptions(options);

    this.setData({
      ...(await fetchLiveRoomPageData(liveId, mode, title))
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
