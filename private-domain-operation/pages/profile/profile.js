const { fetchProfilePageData } = require("../../services/api/page-data");
const { openPageEntry } = require("../../utils/navigation");

Page({
  data: {
    serviceItems: []
  },

  async onLoad() {
    this.setData(await fetchProfilePageData());
  },

  onFeatureTap(event) {
    const { label } = event.currentTarget.dataset;
    const { memberCard = {}, merchantEntry = {}, serviceItems = [], fallbackFeedback = "" } = this.data;

    if (label === memberCard.actionTarget) {
      openPageEntry(memberCard.entry, "查看权益");
      return;
    }

    if (label === merchantEntry.actionTarget) {
      openPageEntry(merchantEntry.entry, "进入预览");
      return;
    }

    const targetItem = serviceItems.find((item) => item.label === label);
    openPageEntry(targetItem ? targetItem.entry : null, targetItem ? targetItem.feedback : `${label}${fallbackFeedback}`);
  }
});
