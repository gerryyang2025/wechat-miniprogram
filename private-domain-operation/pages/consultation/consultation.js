function decodeValue(value = "") {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

const consultationSceneMap = {
  course: {
    pageTitle: "课程咨询",
    pageSubtitle: "查看课程问题、学习安排与报名说明",
    contextLabel: "当前咨询课程",
    submitTitle: "课程咨询已记录",
    submitDesc: "原型阶段先展示页面流程，后续接入真实消息与客服能力。",
    quickQuestions: ["适合谁学", "课程目录", "学习方式", "是否有回放"]
  },
  live: {
    pageTitle: "直播咨询",
    pageSubtitle: "咨询直播观看条件、时间安排与回放说明",
    contextLabel: "当前咨询直播",
    submitTitle: "直播咨询已记录",
    submitDesc: "原型阶段先展示页面流程，后续接入真实消息与提醒能力。",
    quickQuestions: ["如何进入直播", "能否回放", "观看条件", "直播时间"]
  },
  profile: {
    pageTitle: "咨询反馈",
    pageSubtitle: "记录你的问题、建议和需要支持的事项",
    contextLabel: "反馈主题",
    submitTitle: "反馈已记录",
    submitDesc: "原型阶段先展示页面流程，后续接入真实反馈与消息通知能力。",
    quickQuestions: ["账号问题", "课程问题", "直播问题", "功能建议"]
  }
};

Page({
  data: {
    scene: "profile",
    pageTitle: "咨询反馈",
    pageSubtitle: "",
    contextLabel: "反馈主题",
    targetTitle: "通用咨询",
    quickQuestions: [],
    draftMessage: ""
  },

  onLoad(options = {}) {
    const scene = decodeValue(options.scene || "profile");
    const sceneConfig = consultationSceneMap[scene] || consultationSceneMap.profile;
    const targetTitle =
      decodeValue(options.title) ||
      (scene === "course" ? "课程咨询" : scene === "live" ? "直播咨询" : "通用咨询");

    this.setData({
      scene,
      pageTitle: sceneConfig.pageTitle,
      pageSubtitle: sceneConfig.pageSubtitle,
      contextLabel: sceneConfig.contextLabel,
      targetTitle,
      quickQuestions: sceneConfig.quickQuestions
    });
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onQuickQuestionTap(event) {
    const { question } = event.currentTarget.dataset;
    const { draftMessage } = this.data;

    this.setData({
      draftMessage: draftMessage ? `${draftMessage}\n${question}` : question
    });
  },

  onInputChange(event) {
    this.setData({
      draftMessage: event.detail.value
    });
  },

  onSubmitTap() {
    const sceneConfig = consultationSceneMap[this.data.scene] || consultationSceneMap.profile;

    wx.showToast({
      title: sceneConfig.submitTitle,
      icon: "none"
    });
  }
});
