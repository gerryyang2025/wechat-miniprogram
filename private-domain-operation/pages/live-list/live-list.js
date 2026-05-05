const liveList = [
  {
    id: "live-private-domain-qa",
    status: "upcoming",
    title: "今晚 20:00 私域运营直播答疑",
    speaker: "Gerry",
    schedule: "今天 20:00 - 21:30",
    audience: "课程学员 / 训练营成员可观看",
    summary: "聚焦内容变现、训练营承接和直播后复盘动作。",
    actionText: "查看详情"
  },
  {
    id: "live-content-clinic",
    status: "live",
    title: "内容门诊室：短视频表达即时答疑",
    speaker: "Gerry",
    schedule: "正在直播中",
    audience: "会员用户可进入互动",
    summary: "直播中拆解口播节奏、镜头表达和开场结构。",
    actionText: "进入直播间"
  },
  {
    id: "live-private-domain-qa",
    status: "replay",
    title: "私域运营直播答疑回放精选",
    speaker: "Gerry",
    schedule: "回放已开放 · 90 分钟",
    audience: "已购课程用户可反复观看",
    summary: "整理直播中的高频问题，适合复盘内容节奏与用户转化。",
    actionText: "查看回放"
  },
  {
    id: "live-bootcamp-review",
    status: "replay",
    title: "7 天训练营复盘直播回放",
    speaker: "Gerry",
    schedule: "回放已开放 · 45 分钟",
    audience: "训练营成员专属回放",
    summary: "围绕朋友圈作业、训练营打卡和咨询转化做集中复盘。",
    actionText: "查看回放"
  }
];

const filterTabs = [
  { key: "all", label: "全部" },
  { key: "upcoming", label: "即将开始" },
  { key: "live", label: "直播中" },
  { key: "replay", label: "回放" }
];

function getFilteredList(activeTab = "all") {
  if (activeTab === "all") {
    return liveList;
  }

  return liveList.filter((item) => item.status === activeTab);
}

Page({
  data: {
    filterTabs,
    activeTab: "all",
    liveList: getFilteredList("all")
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
      liveList: getFilteredList(tabKey)
    });
  },

  onLiveTap(event) {
    const { liveId, status } = event.currentTarget.dataset;
    const mode = status === "replay" ? "replay" : status === "live" ? "live" : "upcoming";

    wx.navigateTo({
      url:
        `/pages/live-detail/live-detail?liveId=${encodeURIComponent(liveId)}` +
        `&mode=${encodeURIComponent(mode)}`
    });
  }
});
