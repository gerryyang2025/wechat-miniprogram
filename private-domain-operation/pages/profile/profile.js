Page({
  onFeatureTap(event) {
    const { label } = event.currentTarget.dataset;

    wx.showToast({
      title: `${label}功能后续接入`,
      icon: "none"
    });
  }
});
