const { getLiveListTabs, getLiveList } = require("../../mock/live-data");

Page({
  data: {
    filterTabs: getLiveListTabs(),
    activeTab: "all",
    liveList: getLiveList("all")
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onFilterTap(event) {
    const { tabKey } = event.currentTarget.dataset;

    this.setData({
      activeTab: tabKey,
      liveList: getLiveList(tabKey)
    });
  },

  onLiveTap(event) {
    const { liveId, status } = event.currentTarget.dataset;
    const mode = status === "replay" ? "replay" : status === "live" ? "live" : "upcoming";

    wx.navigateTo({
      url:
        `/pages/live-detail/live-detail?liveId=${encodeURIComponent(liveId)}` +
        `&mode=${encodeURIComponent(mode)}`
    });
  }
});
