const { fetchSettingsPageData } = require("../../services/api/page-data");

Page({
  data: {
    switches: {},
    switchItems: []
  },

  async onLoad() {
    this.setData(await fetchSettingsPageData());
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onSwitchChange(event) {
    const { key } = event.currentTarget.dataset;
    const { value } = event.detail;

    this.setData({
      [`switches.${key}`]: value
    });
  }
});
