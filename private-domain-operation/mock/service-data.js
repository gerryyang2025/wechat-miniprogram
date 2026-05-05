const { clone } = require("./shared");
const {
  buildPageEntry,
  toConsultation,
  toProductList
} = require("../utils/navigation");

const memberRightsBaseData = {
  navSubtitle: "查看当前阶段开放的会员内容与说明",
  heroTitle: "时昕有点懒 · 会员内容计划",
  heroDesc: "当前阶段以课程学习、直播回放和训练营精选内容为主，后续会逐步补齐购买、续费与权益管理能力。",
  primaryActionText: "查看会员内容",
  secondaryActionText: "咨询会员",
  rights: [
    {
      id: "right-course",
      title: "课程学习权益",
      desc: "可学习年度会员范围内的精选课程，并持续查看章节更新与回放说明。"
    },
    {
      id: "right-live",
      title: "直播观看权益",
      desc: "可查看会员专场直播、直播回放和精选答疑内容，适合反复复盘。"
    },
    {
      id: "right-camp",
      title: "训练营精选内容",
      desc: "可查看训练营公开任务示例、复盘直播与部分打卡说明。"
    }
  ],
  includedContent: [
    "AIGC 视频制作",
    "微信小游戏开发",
    "个人 IP 内容变现实战课",
    "私域运营直播答疑回放"
  ],
  notes: [
    "会员权益以当前小程序中已开放的内容为准。",
    "训练营陪跑与付费直播购买能力将在后续阶段再接入。",
    "后续接入支付能力后，可在此页查看有效期与续费说明。"
  ]
};

const memberRightsSourceOverrides = {
  home: {
    navSubtitle: "从首页进入会员内容说明与权益承接页",
    heroTitle: "年度会员计划",
    heroDesc: "适合长期跟进课程、直播回放和训练营精选内容，先了解权益范围，再按内容类型继续浏览。"
  }
};

const notificationsPageData = {
  notifications: [
    {
      id: "notice-1",
      category: "课程提醒",
      title: "AIGC 视频制作已更新第 2 节内容",
      summary: "新增脚本拆解与镜头说明，适合继续学习时一并查看。",
      time: "今天 09:20"
    },
    {
      id: "notice-2",
      category: "直播回放",
      title: "私域运营直播答疑回放已开放",
      summary: "建议优先回看社群转化节奏和直播答疑结构两个重点片段。",
      time: "昨天 21:40"
    },
    {
      id: "notice-3",
      category: "训练营动态",
      title: "7 天训练营第 3 天任务已发布",
      summary: "本日任务聚焦咨询承接动作，可配合复盘直播一起完成。",
      time: "昨天 08:10"
    }
  ],
  tips: [
    "当前阶段为原型页展示，不接入真实推送通道。",
    "后续接入服务消息后，可在此页查看未读状态与消息分类筛选。"
  ]
};

const settingsPageData = {
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
};

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
  member: {
    pageTitle: "会员咨询",
    pageSubtitle: "咨询会员权益、当前开放内容与后续接入说明",
    contextLabel: "当前咨询会员",
    submitTitle: "会员咨询已记录",
    submitDesc: "原型阶段先展示会员承接流程，后续接入真实客服、购买和权益管理能力。",
    quickQuestions: ["包含哪些内容", "适合谁加入", "是否支持回放", "后续如何开通"]
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

function getMemberRightsPageData(source = "") {
  const pageData = {
    ...clone(memberRightsBaseData),
    ...(clone(memberRightsSourceOverrides[source] || {})),
    primaryEntry: buildPageEntry(toProductList("member")),
    secondaryEntry: buildPageEntry(toConsultation("member", "年度会员计划"))
  };

  return pageData;
}

function getNotificationsPageData() {
  return clone(notificationsPageData);
}

function getSettingsPageData() {
  return clone(settingsPageData);
}

function getConsultationPageData(scene = "profile", title = "") {
  const sceneKey = consultationSceneMap[scene] ? scene : "profile";
  const sceneConfig = clone(consultationSceneMap[sceneKey]);
  const targetTitle =
    title ||
    (sceneKey === "course"
      ? "课程咨询"
      : sceneKey === "live"
        ? "直播咨询"
        : sceneKey === "member"
          ? "会员咨询"
          : "通用咨询");

  return {
    scene: sceneKey,
    pageTitle: sceneConfig.pageTitle,
    pageSubtitle: sceneConfig.pageSubtitle,
    contextLabel: sceneConfig.contextLabel,
    targetTitle,
    quickQuestions: sceneConfig.quickQuestions,
    draftMessage: "",
    submitTitle: sceneConfig.submitTitle,
    submitDesc: sceneConfig.submitDesc
  };
}

function normalizeConsultationDraft(value = "") {
  return String(value || "").slice(0, 300);
}

function appendConsultationDraft(currentDraft = "", question = "") {
  const nextQuestion = String(question || "").trim();
  const nextDraft = String(currentDraft || "").trim();

  if (!nextQuestion) {
    return normalizeConsultationDraft(nextDraft);
  }

  return normalizeConsultationDraft(nextDraft ? `${nextDraft}\n${nextQuestion}` : nextQuestion);
}

function getConsultationSubmitFeedback(scene = "profile", title = "") {
  const pageData = getConsultationPageData(scene, title);

  return {
    title: pageData.submitTitle,
    desc: pageData.submitDesc
  };
}

module.exports = {
  appendConsultationDraft,
  getConsultationSubmitFeedback,
  getMemberRightsPageData,
  getNotificationsPageData,
  getSettingsPageData,
  getConsultationPageData,
  normalizeConsultationDraft
};
