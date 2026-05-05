const filterTabs = [
  { key: "all", label: "全部" },
  { key: "active", label: "高活跃" },
  { key: "camp", label: "训练营成员" },
  { key: "live", label: "直播参与者" }
];

const userList = [
  {
    id: "user-1",
    name: "时昕同学",
    phone: "138 **** 8821",
    activeAt: "今天 09:20",
    progress: "AIGC 视频制作 · 已学 2 / 6 节",
    tags: ["课程学员", "高活跃"],
    typeKeys: ["active"]
  },
  {
    id: "user-2",
    name: "内容创业者",
    phone: "186 **** 1935",
    activeAt: "昨天 21:40",
    progress: "7 天私域增长训练营 · Day 2 / 7",
    tags: ["训练营成员", "高意向"],
    typeKeys: ["camp", "active"]
  },
  {
    id: "user-3",
    name: "视频练习生",
    phone: "139 **** 4432",
    activeAt: "昨天 18:10",
    progress: "内容门诊室直播回放 · 已观看至 10:42",
    tags: ["直播参与者", "会员用户"],
    typeKeys: ["live"]
  },
  {
    id: "user-4",
    name: "训练营同学",
    phone: "150 **** 6628",
    activeAt: "05-04 16:05",
    progress: "个人 IP 内容变现实战课 · 已学 4 / 12 节",
    tags: ["课程学员", "训练营成员"],
    typeKeys: ["camp"]
  }
];

function getFilteredUsers(activeTab = "all") {
  if (activeTab === "all") {
    return userList;
  }

  return userList.filter((item) => item.typeKeys.includes(activeTab));
}

Page({
  data: {
    filterTabs,
    activeTab: "all",
    userList: getFilteredUsers("all")
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onSearchTap() {
    wx.showToast({
      title: "搜索能力后续接入",
      icon: "none"
    });
  },

  onFilterTap(event) {
    const { tabKey } = event.currentTarget.dataset;

    this.setData({
      activeTab: tabKey,
      userList: getFilteredUsers(tabKey)
    });
  },

  onUserTap(event) {
    const { name } = event.currentTarget.dataset;

    wx.showToast({
      title: `查看 ${name}`,
      icon: "none"
    });
  }
});
