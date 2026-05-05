const { clone } = require("./shared");

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
  ]
};

function getProfilePageData() {
  return clone(profilePageData);
}

module.exports = {
  getProfilePageData
};
