const { fetchLiveEditPageData } = require("../../services/api/page-data");

function safeDecode(value = "") {
  try {
    return decodeURIComponent(String(value || ""));
  } catch (error) {
    return String(value || "");
  }
}

Page({
  data: {
    loading: true,
    liveId: "",
    live: {}
  },

  async onLoad(options = {}) {
    const liveId = safeDecode(options.liveId);
    const live = liveId ? await fetchLiveEditPageData(liveId) : {};

    this.setData({
      loading: false,
      liveId,
      live
    });
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  }
});
