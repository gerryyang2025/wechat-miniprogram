function decodeValue(value = "") {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

const roomCatalog = {
  "live-private-domain-qa": {
    liveAudienceText: "在线 326",
    liveTopic: "今天聚焦：内容变现与学员转化答疑",
    liveNotice: "今晚互动答疑以高频问题为主，直播后会整理重点笔记。",
    liveMessages: [
      { id: "msg-1", user: "时昕同学", text: "请问训练营内容和直播节奏怎么衔接？" },
      { id: "msg-2", user: "内容创业者", text: "课程更新后，旧学员会同步看到吗？" },
      { id: "msg-3", user: "Gerry", text: "稍后会重点讲训练营与直播联动的节奏安排。" }
    ],
    replayAudienceText: "回放观看 518",
    replayTopic: "当前播放：社群转化节奏与直播答疑结构",
    replayNotice: "当前为直播回放示例页，建议先按重点片段回看，再记录复盘笔记。",
    replayMessages: [
      { id: "replay-1", user: "重点片段", text: "08:20 - 15:40 社群转化节奏拆解" },
      { id: "replay-2", user: "重点片段", text: "23:18 - 36:50 学员提问统一回应方式" },
      { id: "replay-3", user: "复盘建议", text: "建议结合已购课程中的转化章节一起二次复盘。" }
    ],
    replayProgress: "已观看至 23:18 / 90:00",
    replaySummary: "回放已开放，适合按重点片段复看并同步整理学员咨询的统一答复。",
    replayHighlights: [
      "先回看社群转化节奏，再看提问整理方式",
      "建议边看边记录可复用的直播答疑话术",
      "结合课程目录同步复盘直播后的沉淀动作"
    ]
  },
  "live-content-clinic": {
    liveAudienceText: "在线 214",
    liveTopic: "今天聚焦：短视频开场、口播与镜头表达答疑",
    liveNotice: "当前直播以即时答疑为主，结束后会整理部分重点片段。",
    liveMessages: [
      { id: "msg-1", user: "口播学员", text: "开场前两句总是说不顺，应该怎么调整？" },
      { id: "msg-2", user: "视频创作者", text: "口播停顿总是太碎，有没有练习方法？" },
      { id: "msg-3", user: "Gerry", text: "稍后会先集中讲开场结构，再讲停顿和节奏。" }
    ],
    replayAudienceText: "回放观看 243",
    replayTopic: "当前播放：短视频表达重点片段",
    replayNotice: "建议暂停回放跟读练习，再对照自己的口播稿做调整。",
    replayMessages: [
      { id: "replay-1", user: "重点片段", text: "05:10 - 11:30 开场结构拆解" },
      { id: "replay-2", user: "重点片段", text: "18:00 - 27:20 口播停顿与节奏" }
    ],
    replayProgress: "已观看至 10:42 / 60:00",
    replaySummary: "本场回放更适合分段练习，建议结合暂停和跟读模仿使用。",
    replayHighlights: [
      "优先回看开场结构，再看口播节奏片段",
      "建议边暂停边模仿，强化节奏感"
    ]
  },
  "live-bootcamp-review": {
    liveAudienceText: "在线 168",
    liveTopic: "今天聚焦：训练营作业点评与后续承接复盘",
    liveNotice: "当前直播主要围绕朋友圈作业、咨询承接和节奏复盘展开。",
    liveMessages: [
      { id: "msg-1", user: "训练营成员", text: "朋友圈内容总感觉太像在卖课，怎么调整？" },
      { id: "msg-2", user: "训练营成员", text: "直播结束后怎么继续承接咨询？" },
      { id: "msg-3", user: "Gerry", text: "稍后会先点评作业，再讲私域后续承接动作。" }
    ],
    replayAudienceText: "训练营成员回放 96",
    replayTopic: "当前播放：训练营复盘与作业点评重点",
    replayNotice: "建议边看边对照训练营作业与打卡内容做二次整理。",
    replayMessages: [
      { id: "replay-1", user: "重点片段", text: "03:40 - 12:20 朋友圈作业点评" },
      { id: "replay-2", user: "重点片段", text: "21:00 - 31:10 咨询承接与后续跟进" }
    ],
    replayProgress: "已观看至 12:08 / 45:00",
    replaySummary: "训练营回放更适合对照自己的打卡和作业反复复盘。",
    replayHighlights: [
      "先对照作业点评，再看咨询承接片段",
      "建议同步整理自己的训练营复盘清单"
    ]
  }
};

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
    const room = roomCatalog[liveId] || roomCatalog["live-private-domain-qa"];

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
