const filterTabs = [
  { key: "all", label: "全部" },
  { key: "course", label: "课程" },
  { key: "bootcamp", label: "训练营" },
  { key: "member", label: "会员" }
];

const productList = [
  {
    id: "product-course-ip",
    type: "course",
    typeLabel: "课程",
    title: "个人 IP 内容变现实战课",
    coverHint: "定位 / 内容结构 / 转化节奏",
    status: "已上架",
    updatedAt: "今天 09:40",
    theme: "purple"
  },
  {
    id: "product-course-aigc",
    type: "course",
    typeLabel: "课程",
    title: "AIGC 视频制作",
    coverHint: "脚本 / 口播 / 剪辑流程",
    status: "已上架",
    updatedAt: "昨天 21:10",
    theme: "cyan"
  },
  {
    id: "product-camp-growth",
    type: "bootcamp",
    typeLabel: "训练营",
    title: "7 天私域增长训练营",
    coverHint: "打卡 / 公告 / 作业复盘",
    status: "进行中",
    updatedAt: "昨天 18:20",
    theme: "blue"
  },
  {
    id: "product-member-year",
    type: "member",
    typeLabel: "会员",
    title: "年度会员计划",
    coverHint: "课程权益 / 直播回放 / 内容精选",
    status: "草稿",
    updatedAt: "05-03 16:30",
    theme: "gold"
  }
];

function getFilteredProducts(activeTab = "all") {
  if (activeTab === "all") {
    return productList;
  }

  return productList.filter((item) => item.type === activeTab);
}

Page({
  data: {
    filterTabs,
    activeTab: "all",
    productList: getFilteredProducts("all")
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
      productList: getFilteredProducts(tabKey)
    });
  },

  onEditTap(event) {
    const { title } = event.currentTarget.dataset;

    wx.showToast({
      title: `编辑 ${title}`,
      icon: "none"
    });
  },

  onCreateTap() {
    wx.showToast({
      title: "新建商品流程后续接入",
      icon: "none"
    });
  }
});
