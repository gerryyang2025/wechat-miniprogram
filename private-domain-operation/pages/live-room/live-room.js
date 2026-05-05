const { getLiveRoom } = require("../../mock/live-data");

function decodeValue(value = "") {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

Page({
  data: {
    liveId: "live-private-domain-qa",
    title: "直播间",
    mode: "live",
    statusText: "直播中",
    statusTheme: "live",
    audienceText: "在线 326",
    topic: "今天聚焦：内容变现与学员转化答疑",
    notice: "今晚互动答疑以高频问题为主，直播后会整理重点笔记。",
    replayProgress: "",
    replaySummary: "",
    replayHighlights: [],
    inputPlaceholder: "输入问题或记录想法",
    messages: [
      { id: "msg-1", user: "时昕同学", text: "请问训练营内容和直播节奏怎么衔接？" },
      { id: "msg-2", user: "内容创业者", text: "课程更新后，旧学员会同步看到吗？" },
      { id: "msg-3", user: "Gerry", text: "稍后会重点讲训练营与直播联动的节奏安排。" }
    ]
  },

  onLoad(options = {}) {
    const liveId = decodeValue(options.liveId || "live-private-domain-qa");
    const mode = decodeValue(options.mode || "live");
    const title = decodeValue(options.title || "直播间");
    const isReplay = mode === "replay";
    const room = getLiveRoom(liveId);

    this.setData({
      liveId,
      title,
      mode,
      statusText: isReplay ? "回放中" : "直播中",
      statusTheme: isReplay ? "replay" : "live",
      audienceText: isReplay ? room.replayAudienceText : room.liveAudienceText,
      topic: isReplay ? room.replayTopic : room.liveTopic,
      notice: isReplay ? room.replayNotice : room.liveNotice,
      messages: isReplay ? room.replayMessages : room.liveMessages,
      replayProgress: isReplay ? room.replayProgress : "",
      replaySummary: isReplay ? room.replaySummary : "",
      replayHighlights: isReplay ? room.replayHighlights : [],
      inputPlaceholder: isReplay ? "记录回放笔记或复盘想法" : "输入问题或记录想法"
    });
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onAskTap() {
    wx.showToast({
      title: this.data.mode === "replay" ? "笔记功能后续接入" : "提问功能后续接入",
      icon: "none"
    });
  }
});
