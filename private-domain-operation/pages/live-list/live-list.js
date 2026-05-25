const { fetchLiveListPageData } = require("../../services/api/page-data");
const { openPageEntry } = require("../../utils/navigation");

Page({
  data: {
    navSubtitle: "",
    filterTabs: [],
    activeTab: "all",
    emptyHint: "",
    liveList: []
  },

  async onLoad() {
    this.setData(await fetchLiveListPageData("all"));
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  async onFilterTap(event) {
    const { tabKey } = event.currentTarget.dataset;
    this.setData(await fetchLiveListPageData(tabKey));
  },

  onLiveTap(event) {
    const { liveId, status } = event.currentTarget.dataset;
    const targetItem = this.data.liveList.find((item) => item.id === liveId && item.status === status);
    openPageEntry(targetItem ? targetItem.entry : null, "查看详情");
  }
});
