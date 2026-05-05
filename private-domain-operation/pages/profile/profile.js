Page({
  onFeatureTap(event) {
    const { label } = event.currentTarget.dataset;

    if (label === "会员权益") {
      wx.navigateTo({
        url: "/pages/member-rights/member-rights"
      });
      return;
    }

    if (label === "消息通知") {
      wx.navigateTo({
        url: "/pages/notifications/notifications"
      });
      return;
    }

    if (label === "咨询反馈") {
      wx.navigateTo({
        url: "/pages/consultation/consultation?scene=profile&title=咨询反馈"
      });
      return;
    }

    if (label === "系统设置") {
      wx.navigateTo({
        url: "/pages/settings/settings"
      });
      return;
    }

    wx.showToast({
      title: `${label}功能后续接入`,
      icon: "none"
    });
  }
});
