Page({
  data: {
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
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onActionTap(event) {
    const { label } = event.currentTarget.dataset;

    wx.showToast({
      title: label,
      icon: "none"
    });
  }
});
