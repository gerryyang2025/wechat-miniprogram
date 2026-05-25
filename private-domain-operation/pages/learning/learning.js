const {
  fetchLearningPageData
} = require("../../services/api/page-data");
const {
  openPageEntry
} = require("../../utils/navigation");

Page({
  data: {
    metrics: [],
    learningList: []
  },

  async onShow() {
    this.setData(await fetchLearningPageData());
  },

  onSearchTap() {
    openPageEntry(this.data.searchEntry, this.data.searchFeedback);
  },

  onOpenLiveCenter() {
    openPageEntry(this.data.liveCenterEntry);
  },

  onItemTap(event) {
    const { itemId } = event.currentTarget.dataset;
    const targetItem = this.data.learningList.find((item) => item.id === itemId);
    openPageEntry(targetItem ? targetItem.detailEntry : null, "查看详情");
  },

  onContinueTap(event) {
    const { itemId } = event.currentTarget.dataset;
    const targetItem = this.data.learningList.find((item) => item.id === itemId);
    openPageEntry(targetItem ? targetItem.continueEntry : null, "视频播放下一步接入");
  }
});
