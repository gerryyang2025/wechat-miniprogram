const { fetchLiveManagementPageData } = require("../../services/api/page-data");
const { openPageEntry, toLiveEdit } = require("../../utils/navigation");

Page({
  data: {
    filterTabs: [],
    activeTab: "all",
    liveList: []
  },

  async onLoad() {
    this.setData(await fetchLiveManagementPageData("all"));
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  async onFilterTap(event) {
    const { tabKey } = event.currentTarget.dataset;
    this.setData(await fetchLiveManagementPageData(tabKey));
  },

  onActionTap(event) {
    const { liveId } = event.currentTarget.dataset;
    openPageEntry({ url: toLiveEdit(liveId), method: "navigateTo" }, "编辑直播");
  },

  onCreateTap() {
    openPageEntry({ url: toLiveEdit(""), method: "navigateTo" }, "新建直播");
  }
});
