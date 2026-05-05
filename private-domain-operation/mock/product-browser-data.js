const { clone } = require("./shared");

const productCategories = [
  {
    key: "course",
    label: "课程",
    title: "录播课程",
    desc: "围绕个人 IP、内容表达和私域转化的系统课程。",
    badge: "12 节起",
    theme: "purple"
  },
  {
    key: "camp",
    label: "训练营",
    title: "训练营",
    desc: "按天推进任务、复盘与陪跑，适合短周期训练。",
    badge: "7 天起",
    theme: "blue"
  },
  {
    key: "member",
    label: "会员",
    title: "会员权益",
    desc: "按年度解锁录播内容、直播回放和精选训练营权益。",
    badge: "年度计划",
    theme: "indigo"
  }
];

const productFilterTabs = [
  { key: "all", label: "全部" },
  { key: "course", label: "课程" },
  { key: "camp", label: "训练营" },
  { key: "member", label: "会员" }
];

const productList = [
  {
    id: "course-1",
    type: "course",
    tag: "系列课",
    title: "个人 IP 内容变现实战课",
    subtitle: "12 节课程 · 适合 0 到 1 搭建",
    summary: "定位、选题、内容承接和成交路径一次梳理。",
    price: "¥299",
    actionText: "查看详情",
    coverTheme: "cover-purple"
  },
  {
    id: "course-2",
    type: "course",
    tag: "视频课",
    title: "短视频表达与节奏训练",
    subtitle: "8 节课程 · 口播拍摄训练",
    summary: "聚焦镜头状态、口播节奏和表达结构。",
    price: "会员可学",
    actionText: "查看详情",
    coverTheme: "cover-blue"
  },
  {
    id: "course-3",
    type: "course",
    tag: "图文课",
    title: "朋友圈内容转化模型",
    subtitle: "6 节课程 · 图文成交训练",
    summary: "建立信任内容与转化内容的组合节奏。",
    price: "¥129",
    actionText: "查看详情",
    coverTheme: "cover-indigo"
  },
  {
    id: "camp-7day-growth",
    type: "camp",
    tag: "训练营",
    title: "7 天私域增长训练营",
    subtitle: "7 天训练 · 每天 1 个任务",
    summary: "适合围绕内容节奏、朋友圈表达和私域承接做短期训练。",
    price: "报名开放中",
    actionText: "查看详情",
    coverTheme: "cover-cyan"
  },
  {
    id: "member-annual",
    type: "member",
    tag: "会员",
    title: "年度会员计划",
    subtitle: "年度权益 · 直播回放 + 精选课程",
    summary: "适合长期跟进个人 IP 课程、训练营精选和直播回放。",
    price: "了解权益",
    actionText: "查看权益",
    coverTheme: "cover-gold"
  }
];

function getProductCategories() {
  return clone(productCategories);
}

function getProductFilterTabs() {
  return clone(productFilterTabs);
}

function getProductList() {
  return clone(productList);
}

function getFilteredProducts(activeType = "all") {
  if (!activeType || activeType === "all") {
    return getProductList();
  }

  return clone(productList.filter((item) => item.type === activeType));
}

module.exports = {
  getProductCategories,
  getProductFilterTabs,
  getProductList,
  getFilteredProducts
};
