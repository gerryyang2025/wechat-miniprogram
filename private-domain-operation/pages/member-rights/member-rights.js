Page({
  data: {
    rights: [
      {
        id: "right-course",
        title: "课程学习权益",
        desc: "可学习年度会员范围内的精选课程，并持续查看章节更新与回放说明。"
      },
      {
        id: "right-live",
        title: "直播观看权益",
        desc: "可查看会员专场直播、直播回放和精选答疑内容，适合反复复盘。"
      },
      {
        id: "right-camp",
        title: "训练营精选内容",
        desc: "可查看训练营公开任务示例、复盘直播与部分打卡说明。"
      }
    ],
    includedContent: [
      "AIGC 视频制作",
      "微信小游戏开发",
      "个人 IP 内容变现实战课",
      "私域运营直播答疑回放"
    ],
    notes: [
      "会员权益以当前小程序中已开放的内容为准。",
      "训练营陪跑与付费直播购买能力将在后续阶段再接入。",
      "后续接入支付能力后，可在此页查看有效期与续费说明。"
    ]
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  }
});
