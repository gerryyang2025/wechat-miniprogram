const { fetchProductManagementPageData } = require("../../services/api/page-data");

Page({
  data: {
    filterTabs: [],
    activeTab: "all",
    productList: []
  },

  async onLoad() {
    this.setData(await fetchProductManagementPageData("all"));
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  async onFilterTap(event) {
    const { tabKey } = event.currentTarget.dataset;
    this.setData(await fetchProductManagementPageData(tabKey));
  },

  onEditTap(event) {
    const { id, title } = event.currentTarget.dataset;

    if (!id) {
      wx.showToast({
        title: title ? `无法编辑 ${title}` : "缺少课程 ID",
        icon: "none"
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/course-edit/course-edit?courseId=${encodeURIComponent(id)}`
    });
  },

  onCreateTap() {
    wx.showToast({
      title: this.data.createFeedback,
      icon: "none"
    });
  }
});
