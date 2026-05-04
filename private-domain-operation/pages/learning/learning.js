Page({
  data: {
    metrics: [
      { label: "今日学习", value: "46 分钟" },
      { label: "累计时长", value: "18.5 小时" },
      { label: "累计天数", value: "12 天" }
    ],
    learningList: [
      {
        id: "learn-1",
        type: "课程",
        title: "个人 IP 内容变现实战课",
        progress: "已学 4 / 12 节",
        last: "最近看到：第 4 节 个人品牌定位",
        theme: "purple"
      },
      {
        id: "learn-2",
        type: "训练营",
        title: "7 天私域增长训练营",
        progress: "Day 2 / 7",
        last: "最近任务：朋友圈内容拆解",
        theme: "blue"
      },
      {
        id: "learn-3",
        type: "直播回放",
        title: "私域运营直播答疑回放",
        progress: "观看至 23:18",
        last: "最近片段：社群转化节奏",
        theme: "indigo"
      }
    ]
  },

  onSearchTap() {
    wx.showToast({
      title: "原型阶段暂不支持搜索",
      icon: "none"
    });
  },

  onContinueTap() {
    wx.showToast({
      title: "视频播放下一步接入",
      icon: "none"
    });
  }
});
