const filterTabs = [
  { key: "all", label: "全部" },
  { key: "upcoming", label: "未开始" },
  { key: "live", label: "直播中" },
  { key: "ended", label: "已结束" }
];

const liveList = [
  {
    id: "merchant-live-qa",
    status: "upcoming",
    title: "今晚 20:00 私域运营直播答疑",
    coverHint: "内容变现 / 训练营承接 / 回放说明",
    schedule: "今天 20:00 - 21:30",
    audience: "课程学员 / 训练营成员可观看",
    actionText: "准入配置",
    theme: "purple"
  },
  {
    id: "merchant-live-clinic",
    status: "live",
    title: "内容门诊室：短视频表达即时答疑",
    coverHint: "口播节奏 / 镜头表达 / 开场结构",
    schedule: "正在直播中",
    audience: "会员用户可进入互动",
    actionText: "编辑",
    theme: "blue"
  },
  {
    id: "merchant-live-review",
    status: "ended",
    title: "7 天训练营复盘直播回放整理",
    coverHint: "作业点评 / 打卡复盘 / 咨询承接",
    schedule: "已结束 · 待补充回放说明",
    audience: "训练营成员专属回放",
    actionText: "补回放",
    theme: "indigo"
  }
];

function getFilteredLiveList(activeTab = "all") {
  if (activeTab === "all") {
    return liveList;
  }

  return liveList.filter((item) => item.status === activeTab);
}

Page({
  data: {
    filterTabs,
    activeTab: "all",
    liveList: getFilteredLiveList("all")
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onFilterTap(event) {
    const { tabKey } = event.currentTarget.dataset;

    this.setData({
      activeTab: tabKey,
      liveList: getFilteredLiveList(tabKey)
    });
  },

  onActionTap(event) {
    const { title, action } = event.currentTarget.dataset;

    wx.showToast({
      title: `${action} · ${title}`,
      icon: "none"
    });
  },

  onCreateTap() {
    wx.showToast({
      title: "新建直播流程后续接入",
      icon: "none"
    });
  }
});
