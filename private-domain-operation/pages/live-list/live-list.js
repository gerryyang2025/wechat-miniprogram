const { getLiveListPageData } = require("../../mock/live-data");
const { openPageEntry } = require("../../utils/navigation");

Page({
  data: getLiveListPageData("all"),

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onFilterTap(event) {
    const { tabKey } = event.currentTarget.dataset;
    this.setData(getLiveListPageData(tabKey));
  },

  onLiveTap(event) {
    const { liveId, status } = event.currentTarget.dataset;
    const targetItem = this.data.liveList.find((item) => item.id === liveId && item.status === status);
    openPageEntry(targetItem ? targetItem.entry : null, "查看详情");
  }
});
