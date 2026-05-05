Page({
  data: {
    notifications: [
      {
        id: "notice-1",
        category: "课程提醒",
        title: "AIGC 视频制作已更新第 2 节内容",
        summary: "新增脚本拆解与镜头说明，适合继续学习时一并查看。",
        time: "今天 09:20"
      },
      {
        id: "notice-2",
        category: "直播回放",
        title: "私域运营直播答疑回放已开放",
        summary: "建议优先回看社群转化节奏和直播答疑结构两个重点片段。",
        time: "昨天 21:40"
      },
      {
        id: "notice-3",
        category: "训练营动态",
        title: "7 天训练营第 3 天任务已发布",
        summary: "本日任务聚焦咨询承接动作，可配合复盘直播一起完成。",
        time: "昨天 08:10"
      }
    ],
    tips: [
      "当前阶段为原型页展示，不接入真实推送通道。",
      "后续接入服务消息后，可在此页查看未读状态与消息分类筛选。"
    ]
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  }
});
