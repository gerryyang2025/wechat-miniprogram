const { clone } = require("./shared");

const learningPageData = {
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
      theme: "cyan",
      actionLabel: "继续学习"
    },
    {
      id: "learn-wechat-game",
      type: "课程",
      title: "微信小游戏开发",
      progress: "已购课程 · 项目实战",
      last: "课程示例：飞机大战项目结构与资源组织",
      theme: "indigo",
      actionLabel: "继续学习"
    },
    {
      id: "learn-1",
      type: "课程",
      title: "个人 IP 内容变现实战课",
      progress: "已学 4 / 12 节",
      last: "最近看到：第 4 节 个人品牌定位",
      theme: "purple",
      actionLabel: "继续学习"
    },
    {
      id: "learn-2",
      type: "训练营",
      title: "7 天私域增长训练营",
      progress: "Day 2 / 7",
      last: "最近任务：朋友圈内容拆解",
      theme: "blue",
      actionLabel: "继续打卡"
    },
    {
      id: "learn-3",
      type: "直播回放",
      title: "私域运营直播答疑回放",
      progress: "已观看至 23:18 / 90:00",
      last: "推荐先回看：社群转化节奏与直播答疑结构",
      theme: "indigo",
      actionLabel: "继续回看"
    }
  ]
};

const learningPlayerCourseMap = {
  "learn-aigc": "player-aigc-video",
  "learn-wechat-game": "player-wechat-game"
};

const learningBootcampMap = {
  "learn-2": "camp-7day-growth"
};

const learningLiveMap = {
  "learn-3": {
    liveId: "live-private-domain-qa",
    mode: "replay"
  }
};

function getLearningPageData() {
  return clone(learningPageData);
}

function getPlayerCourseIdByLearningId(itemId = "") {
  return learningPlayerCourseMap[itemId] || "";
}

function getBootcampIdByLearningId(itemId = "") {
  return learningBootcampMap[itemId] || "";
}

function getLiveEntryByLearningId(itemId = "") {
  if (!learningLiveMap[itemId]) {
    return null;
  }

  return clone(learningLiveMap[itemId]);
}

module.exports = {
  getLearningPageData,
  getPlayerCourseIdByLearningId,
  getBootcampIdByLearningId,
  getLiveEntryByLearningId
};
