const { clone } = require("./shared");
const {
  buildPageEntry,
  toContentOps,
  toLiveManagement,
  toProductManagement,
  toUserManagement
} = require("../utils/navigation");

const merchantDashboardData = {
  metrics: [
    { label: "课程数", value: "6", note: "已发布 4 门" },
    { label: "训练营数", value: "2", note: "进行中 1 个" },
    { label: "直播场次", value: "5", note: "本周 2 场" },
    { label: "学习人数", value: "328", note: "近 7 日 +18" }
  ],
  todos: [
    {
      id: "todo-course",
      tag: "待发布",
      title: "完善《个人 IP 内容变现实战课》第 5 节课程说明",
      note: "建议补充学习目标与课后作业提示"
    },
    {
      id: "todo-live",
      tag: "待配置",
      title: "配置下一场直播的观看范围与回放说明",
      note: "需明确课程学员 / 训练营成员的观看权限"
    },
    {
      id: "todo-feedback",
      tag: "待处理",
      title: "查看最近新增的课程咨询与训练营反馈",
      note: "可优先处理 AIGC 视频制作相关问题"
    }
  ],
  shortcuts: [
    { key: "product", label: "商品管理", hint: "课程 / 训练营 / 会员" },
    { key: "live", label: "直播管理", hint: "直播配置 / 回放说明" },
    { key: "user", label: "用户管理", hint: "学员 / 标签 / 跟进" },
    { key: "content", label: "内容运营", hint: "Banner / 推荐位 / 公告" }
  ],
  activities: [
    {
      id: "activity-1",
      title: "AIGC 视频制作已更新到课程推荐区",
      time: "今天 10:20",
      note: "首页已展示为已购课程与课程推荐示例。"
    },
    {
      id: "activity-2",
      title: "私域运营直播答疑回放状态已完善",
      time: "昨天 21:40",
      note: "直播列表、详情页和直播间已补充回放重点片段提示。"
    },
    {
      id: "activity-3",
      title: "训练营详情页公告区已上线原型",
      time: "昨天 16:05",
      note: "支持展示最新公告、打卡进度和课表预览。"
    }
  ]
};

const productManagementFilterTabs = [
  { key: "all", label: "全部" },
  { key: "course", label: "课程" },
  { key: "bootcamp", label: "训练营" },
  { key: "member", label: "会员" }
];

const productManagementList = [
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

const liveManagementFilterTabs = [
  { key: "all", label: "全部" },
  { key: "upcoming", label: "未开始" },
  { key: "live", label: "直播中" },
  { key: "ended", label: "已结束" }
];

const liveManagementList = [
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

const userManagementFilterTabs = [
  { key: "all", label: "全部" },
  { key: "active", label: "高活跃" },
  { key: "camp", label: "训练营成员" },
  { key: "live", label: "直播参与者" }
];

const userManagementList = [
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

const contentOpsData = {
  banners: [
    {
      id: "banner-home-main",
      title: "首页主 Banner",
      current: "时昕有点懒 · 自媒体学习",
      note: "当前绑定 banner1 / banner2 轮播图"
    }
  ],
  recommendationSlots: [
    {
      id: "slot-course",
      label: "主推课程",
      content: "个人 IP 内容变现实战课",
      action: "调整内容"
    },
    {
      id: "slot-camp",
      label: "训练营推荐",
      content: "7 天私域增长训练营",
      action: "调整内容"
    },
    {
      id: "slot-live",
      label: "直播推荐",
      content: "今晚 20:00 私域运营直播答疑",
      action: "调整内容"
    },
    {
      id: "slot-member",
      label: "会员推荐",
      content: "年度会员计划",
      action: "调整内容"
    }
  ],
  notices: [
    {
      id: "notice-1",
      title: "首页公告文案",
      content: "建议保留一条本周重点更新说明，用于承接课程与直播动态。"
    },
    {
      id: "notice-2",
      title: "训练营公告同步",
      content: "训练营公告建议与直播回放开放状态同步展示。"
    }
  ]
};

const merchantFeedback = {
  productCreate: "新建商品流程后续接入",
  liveCreate: "新建直播流程后续接入",
  userSearch: "搜索能力后续接入",
  contentDefault: "内容运营动作后续接入"
};

function getMerchantDashboardPageData() {
  return {
    ...clone(merchantDashboardData),
    shortcuts: clone(merchantDashboardData.shortcuts).map((item) => ({
      ...item,
      entry:
        item.key === "product"
          ? buildPageEntry(toProductManagement())
          : item.key === "live"
            ? buildPageEntry(toLiveManagement())
            : item.key === "user"
              ? buildPageEntry(toUserManagement())
              : item.key === "content"
                ? buildPageEntry(toContentOps())
                : null,
      feedback: `${item.label}下一步接入`
    })),
    todos: clone(merchantDashboardData.todos).map((item) => ({
      ...item,
      feedback: item.title
    }))
  };
}

function getProductManagementPageData(activeTab = "all") {
  return {
    pageHint: "当前先展示课程、训练营和会员商品的最小管理示例。",
    filterTabs: clone(productManagementFilterTabs),
    activeTab,
    createFeedback: merchantFeedback.productCreate,
    productList: clone(
      activeTab === "all"
        ? productManagementList
        : productManagementList.filter((item) => item.type === activeTab)
    ).map((item) => ({
      ...item,
      statusTone:
        item.status === "草稿" ? "draft" : item.status === "进行中" ? "active" : "published",
      editFeedback: `编辑 ${item.title}`
    }))
  };
}

function getLiveManagementPageData(activeTab = "all") {
  return {
    pageHint: "当前先展示未开始、直播中和已结束三类直播管理示例。",
    filterTabs: clone(liveManagementFilterTabs),
    activeTab,
    createFeedback: merchantFeedback.liveCreate,
    liveList: clone(
      activeTab === "all"
        ? liveManagementList
        : liveManagementList.filter((item) => item.status === activeTab)
    ).map((item) => ({
      ...item,
      statusLabel: item.status === "upcoming" ? "未开始" : item.status === "live" ? "直播中" : "已结束",
      actionFeedback: `${item.actionText} · ${item.title}`
    }))
  };
}

function getUserManagementPageData(activeTab = "all") {
  return {
    pageHint: "当前先展示学员分层、活跃状态和学习摘要的最小原型。",
    filterTabs: clone(userManagementFilterTabs),
    activeTab,
    searchFeedback: merchantFeedback.userSearch,
    userList: clone(
      activeTab === "all"
        ? userManagementList
        : userManagementList.filter((item) => item.typeKeys.includes(activeTab))
    ).map((item) => ({
      ...item,
      avatarText: item.name.slice(0, 1),
      tapFeedback: `查看 ${item.name}`
    }))
  };
}

function getContentOpsPageData() {
  return {
    ...clone(contentOpsData),
    pageHint: "当前先展示 Banner、推荐位和公告配置的最小运营原型。",
    banners: clone(contentOpsData.banners).map((item) => ({
      ...item,
      actionFeedback: "编辑 Banner"
    })),
    recommendationSlots: clone(contentOpsData.recommendationSlots).map((item) => ({
      ...item,
      actionFeedback: item.action
    })),
    notices: clone(contentOpsData.notices).map((item) => ({
      ...item,
      actionFeedback: "编辑公告"
    }))
  };
}

function getContentOpsActionFeedback(label = "") {
  return label || merchantFeedback.contentDefault;
}

module.exports = {
  getContentOpsActionFeedback,
  getMerchantDashboardPageData,
  getProductManagementPageData,
  getLiveManagementPageData,
  getUserManagementPageData,
  getContentOpsPageData
};
