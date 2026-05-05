function decodeValue(value = "") {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

Page({
  data: {
    title: "课程播放",
    videoUrl: "",
    coverUrl: "",
    duration: "",
    description: "",
    outlineText: "",
    isVideoError: false
  },

  onLoad(options = {}) {
    this.setData({
      title: decodeValue(options.title) || "课程播放",
      videoUrl: decodeValue(options.videoUrl),
      coverUrl: decodeValue(options.coverUrl),
      duration: decodeValue(options.duration),
      description: decodeValue(options.description),
      outlineText: decodeValue(options.outlineText) || decodeValue(options.description) || "当前课程内容正在整理中。"
    });
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onVideoError() {
    this.setData({
      isVideoError: true
    });
  }
});
