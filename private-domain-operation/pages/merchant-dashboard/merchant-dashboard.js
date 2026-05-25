const { fetchMerchantDashboardPageData } = require("../../services/api/page-data");
const {
  openPageEntry
} = require("../../utils/navigation");

Page({
  data: {
    metrics: [],
    todos: [],
    shortcuts: [],
    activities: []
  },

  async onLoad() {
    this.setData(await fetchMerchantDashboardPageData());
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onShortcutTap(event) {
    const { label } = event.currentTarget.dataset;
    const targetItem = this.data.shortcuts.find((item) => item.label === label);
    openPageEntry(targetItem ? targetItem.entry : null, targetItem ? targetItem.feedback : `${label}下一步接入`);
  },

  onTodoTap(event) {
    const { title } = event.currentTarget.dataset;
    const targetItem = this.data.todos.find((item) => item.title === title);

    wx.showToast({
      title: targetItem ? targetItem.feedback : title,
      icon: "none"
    });
  }
});
