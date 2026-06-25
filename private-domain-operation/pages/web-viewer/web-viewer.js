function safeDecode(value = "") {
  try {
    return decodeURIComponent(String(value || ""));
  } catch (error) {
    return String(value || "");
  }
}

function isHttpsUrl(value = "") {
  return /^https:\/\//.test(String(value || ""));
}

Page({
  data: {
    title: "直播",
    url: "",
    valid: false
  },

  onLoad(options = {}) {
    const url = safeDecode(options.url);
    this.setData({
      title: safeDecode(options.title) || "直播",
      url,
      valid: isHttpsUrl(url)
    });
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onCopyTap() {
    if (!this.data.url) {
      wx.showToast({
        title: "暂无可复制链接",
        icon: "none"
      });
      return;
    }
    wx.setClipboardData({
      data: this.data.url
    });
  }
});
