const { clone } = require("./shared");
const { getMemberPlanSummary } = require("./service-data");
const {
  buildPageEntry,
  toConsultation,
  toMemberRights,
  toMerchantDashboard,
  toNotifications,
  toSettings
} = require("../utils/navigation");

const profilePageData = {
  profileCard: {
    avatarText: "时",
    name: "时昕同学",
    meta: "已绑定手机号 · 138 **** 8821",
    badge: "年度会员"
  },
  memberCard: {
    title: "年度会员计划",
    desc: "查看课程权益、训练营精选内容和直播回放说明。",
    actionLabel: "查看权益",
    actionTarget: "会员权益"
  },
  merchantEntry: {
    title: "商家工作台",
    desc: "查看经营数据、待办事项和内容运营动态原型。",
    actionLabel: "进入预览",
    actionTarget: "商家工作台"
  },
  serviceItems: [
    { label: "消息通知" },
    { label: "咨询反馈" },
    { label: "系统设置" }
  ],
  fallbackFeedback: "功能后续接入"
};

function getProfilePageData() {
  const pageData = clone(profilePageData);
  const memberSummary = getMemberPlanSummary();

  pageData.memberCard.title = memberSummary.title;
  pageData.memberCard.desc = memberSummary.profileDesc;

  pageData.memberCard.entry = buildPageEntry(toMemberRights());
  pageData.merchantEntry.entry = buildPageEntry(toMerchantDashboard());
  pageData.serviceItems = pageData.serviceItems.map((item) => ({
    ...item,
    entry:
      item.label === "消息通知"
        ? buildPageEntry(toNotifications())
        : item.label === "咨询反馈"
          ? buildPageEntry(toConsultation("profile", "咨询反馈"))
          : item.label === "系统设置"
            ? buildPageEntry(toSettings())
            : null,
    feedback: `${item.label}功能后续接入`
  }));

  return pageData;
}

module.exports = {
  getProfilePageData
};
