Page({
  data: {
    playableCourses: [
      {
        id: "learn-aigc",
        title: "AIGC 视频制作",
        videoUrl: "http://106.55.160.81:8080/brad_pitt_vs_tom_cruise_1773333936.mp4",
        coverUrl: "/assets/home/banner1.jpg",
        duration: "03:22",
        description: "聚焦 AIGC 视频创作流程，从脚本构思、口播表达，到成片剪辑与发布节奏。",
        outlineText: "本节内容将快速带你了解 AIGC 视频制作的基础链路，包括选题、脚本组织、画面表达和成片发布。"
      },
      {
        id: "learn-wechat-game",
        title: "微信小游戏开发",
        videoUrl: "http://106.55.160.81:8080/wechat-plane-game.mov",
        coverUrl: "/assets/home/banner2.jpg",
        duration: "项目演示",
        description: "围绕微信小游戏实战，讲解项目结构、交互循环、资源组织与真机调试流程。",
        outlineText: "本节内容聚焦飞机大战小游戏示例，重点说明场景搭建、角色移动、碰撞检测、资源管理与发布调试。"
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

  onContinueTap(event) {
    const { itemId } = event.currentTarget.dataset;
    const targetCourse = this.data.playableCourses.find((course) => course.id === itemId);

    if (targetCourse) {
      const { title, videoUrl, coverUrl, duration, description, outlineText } = targetCourse;

      wx.navigateTo({
        url:
          `/pages/course-player/course-player?title=${encodeURIComponent(title)}` +
          `&videoUrl=${encodeURIComponent(videoUrl)}` +
          `&coverUrl=${encodeURIComponent(coverUrl)}` +
          `&duration=${encodeURIComponent(duration)}` +
          `&description=${encodeURIComponent(description)}` +
          `&outlineText=${encodeURIComponent(outlineText || "")}`
      });
      return;
    }

    wx.showToast({
      title: "视频播放下一步接入",
      icon: "none"
    });
  }
});
