Page({
  data: {
    switches: {
      autoplayBanner: true,
      liveReminder: true,
      replayReminder: false
    },
    accountInfo: [
      "当前登录身份：时昕同学",
      "已绑定手机号：138 **** 8821",
      "当前环境：微信小程序原型阶段"
    ]
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
