function decodeValue(value = "") {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

Page({
  data: {
    title: "直播间",
    mode: "live",
    statusText: "直播中",
    statusTheme: "live",
    audienceText: "在线 326",
    topic: "今天聚焦：内容变现与学员转化答疑",
    notice: "今晚互动答疑以高频问题为主，直播后会整理重点笔记。",
    messages: [
      { id: "msg-1", user: "时昕同学", text: "请问训练营内容和直播节奏怎么衔接？" },
      { id: "msg-2", user: "内容创业者", text: "课程更新后，旧学员会同步看到吗？" },
      { id: "msg-3", user: "Gerry", text: "稍后会重点讲训练营与直播联动的节奏安排。" }
    ]
  },

  onLoad(options = {}) {
    const mode = decodeValue(options.mode || "live");
    const title = decodeValue(options.title || "直播间");
    const isReplay = mode === "replay";

    this.setData({
      title,
      mode,
      statusText: isReplay ? "回放中" : "直播中",
      statusTheme: isReplay ? "replay" : "live",
      audienceText: isReplay ? "回放观看 518" : "在线 326",
      topic: isReplay ? "当前播放：直播回放精选片段" : "今天聚焦：内容变现与学员转化答疑",
      notice: isReplay
        ? "当前为直播回放示例页，后续会接入真实回放能力和播放进度。"
        : "今晚互动答疑以高频问题为主，直播后会整理重点笔记。"
    });
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onAskTap() {
    wx.showToast({
      title: this.data.mode === "replay" ? "回放页暂不支持提问" : "提问功能后续接入",
      icon: "none"
    });
  }
});
