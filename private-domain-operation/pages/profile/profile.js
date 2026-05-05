Page({
  onFeatureTap(event) {
    const { label } = event.currentTarget.dataset;

    if (label === "咨询反馈") {
      wx.navigateTo({
        url: "/pages/consultation/consultation?scene=profile&title=咨询反馈"
      });
      return;
    }

    wx.showToast({
      title: `${label}功能后续接入`,
      icon: "none"
    });
  }
});
