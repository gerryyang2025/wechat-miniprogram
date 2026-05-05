const { getPlayerCourse } = require("../../mock/course-data");

Page({
  data: {
    bootcampMap: {
      "learn-2": "camp-7day-growth"
    },
    liveMap: {
      "learn-3": {
        liveId: "live-private-domain-qa",
        mode: "replay"
      }
    },
    playableCourses: [
      {
        id: "learn-aigc",
        playerCourseId: "player-aigc-video"
      },
      {
        id: "learn-wechat-game",
        playerCourseId: "player-wechat-game"
      }
    ],
    metrics: [
      { label: "今日学习", value: "46 分钟" },
      { label: "累计时长", value: "18.5 小时" },
      { label: "累计天数", value: "12 天" }
    ],
    learningList: [
      {
        id: "learn-aigc",
        type: "课程",
        title: "AIGC 视频制作",
        progress: "已购课程 · 随时学习",
        last: "课程示例：AI 视频脚本、口播和剪辑流程",
        theme: "cyan"
      },
      {
        id: "learn-wechat-game",
        type: "课程",
        title: "微信小游戏开发",
        progress: "已购课程 · 项目实战",
        last: "课程示例：飞机大战项目结构与资源组织",
        theme: "indigo"
      },
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

  onOpenLiveCenter() {
    wx.navigateTo({
      url: "/pages/live-list/live-list"
    });
  },

  onContinueTap(event) {
    const { itemId } = event.currentTarget.dataset;
    const targetCourse = this.data.playableCourses.find((course) => course.id === itemId);
    const targetBootcampId = this.data.bootcampMap[itemId];
    const targetLive = this.data.liveMap[itemId];

    if (targetCourse) {
      const playerCourse = getPlayerCourse(targetCourse.playerCourseId);

      if (!playerCourse) {
        wx.showToast({
          title: "课程资源准备中",
          icon: "none"
        });
        return;
      }

      wx.navigateTo({
        url: `/pages/course-player/course-player?courseId=${encodeURIComponent(playerCourse.id)}`
      });
      return;
    }

    if (targetBootcampId) {
      wx.navigateTo({
        url: `/pages/bootcamp-detail/bootcamp-detail?campId=${encodeURIComponent(targetBootcampId)}`
      });
      return;
    }

    if (targetLive) {
      wx.navigateTo({
        url:
          `/pages/live-detail/live-detail?liveId=${encodeURIComponent(targetLive.liveId)}` +
          `&mode=${encodeURIComponent(targetLive.mode)}`
      });
      return;
    }

    wx.showToast({
      title: "视频播放下一步接入",
      icon: "none"
    });
  }
});
