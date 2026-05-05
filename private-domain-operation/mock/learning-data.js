const { clone } = require("./shared");
const { getLearningCourseMeta } = require("./course-data");

const learningCourseConfig = [
  {
    id: "learn-aigc",
    type: "课程",
    detailCourseId: "course-aigc-video",
    theme: "cyan",
    actionLabel: "继续学习"
  },
  {
    id: "learn-wechat-game",
    type: "课程",
    detailCourseId: "course-wechat-game",
    theme: "indigo",
    actionLabel: "继续学习"
  },
  {
    id: "learn-1",
    type: "课程",
    detailCourseId: "course-1",
    theme: "purple",
    actionLabel: "继续学习"
  }
];

const learningPageData = {
  metrics: [
    { label: "今日学习", value: "46 分钟" },
    { label: "累计时长", value: "18.5 小时" },
    { label: "累计天数", value: "12 天" }
  ],
  learningList: [
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
  "learn-wechat-game": "player-wechat-game",
  "learn-1": "player-ip-course"
};

const learningDetailCourseMap = {
  "learn-aigc": "course-aigc-video",
  "learn-wechat-game": "course-wechat-game",
  "learn-1": "course-1"
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
  const learningList = learningCourseConfig.map((item) => {
    const courseMeta = getLearningCourseMeta(item.detailCourseId);

    return {
      id: item.id,
      type: item.type,
      title: courseMeta.title,
      progress: courseMeta.progress,
      last: courseMeta.last,
      theme: item.theme,
      actionLabel: item.actionLabel
    };
  });

  return {
    metrics: clone(learningPageData.metrics),
    learningList: [...learningList, ...clone(learningPageData.learningList)]
  };
}

function getPlayerCourseIdByLearningId(itemId = "") {
  return learningPlayerCourseMap[itemId] || "";
}

function getDetailCourseIdByLearningId(itemId = "") {
  return learningDetailCourseMap[itemId] || "";
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
  getDetailCourseIdByLearningId,
  getBootcampIdByLearningId,
  getLiveEntryByLearningId
};
