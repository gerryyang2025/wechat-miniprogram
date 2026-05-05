const { getSettingsPageData } = require("../../mock/service-data");

Page({
  data: getSettingsPageData(),

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
