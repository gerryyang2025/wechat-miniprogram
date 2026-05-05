const { getProfilePageData } = require("../../mock/profile-data");
const {
  toMemberRights,
  toMerchantDashboard,
  toNotifications,
  toConsultation,
  toSettings
} = require("../../utils/navigation");

Page({
  data: getProfilePageData(),

  onFeatureTap(event) {
    const { label } = event.currentTarget.dataset;

    if (label === "会员权益") {
      wx.navigateTo({
        url: toMemberRights()
      });
      return;
    }

    if (label === "商家工作台") {
      wx.navigateTo({
        url: toMerchantDashboard()
      });
      return;
    }

    if (label === "消息通知") {
      wx.navigateTo({
        url: toNotifications()
      });
      return;
    }

    if (label === "咨询反馈") {
      wx.navigateTo({
        url: toConsultation("profile", "咨询反馈")
      });
      return;
    }

    if (label === "系统设置") {
      wx.navigateTo({
        url: toSettings()
      });
      return;
    }

    wx.showToast({
      title: `${label}功能后续接入`,
      icon: "none"
    });
  }
});
