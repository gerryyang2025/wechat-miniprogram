const {
  getLearningItemEntry,
  getLearningPageMeta,
  getLearningPageData,
} = require("../../mock/learning-data");
const {
  openPageEntry
} = require("../../utils/navigation");

Page({
  data: getLearningPageData(),

  onShow() {
    this.setData(getLearningPageData());
  },

  onSearchTap() {
    const { searchEntry, searchFeedback } = getLearningPageMeta();
    openPageEntry(searchEntry, searchFeedback);
  },

  onOpenLiveCenter() {
    openPageEntry(getLearningPageMeta().liveCenterEntry);
  },

  onItemTap(event) {
    const { itemId } = event.currentTarget.dataset;
    openPageEntry(getLearningItemEntry(itemId, "detail"), "查看详情");
  },

  onContinueTap(event) {
    const { itemId } = event.currentTarget.dataset;
    openPageEntry(getLearningItemEntry(itemId, "continue"), "视频播放下一步接入");
  }
});
