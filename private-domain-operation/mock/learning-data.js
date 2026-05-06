const { clone } = require("./shared");
const { getLearningCourseMeta } = require("./course-data");
const { getBootcampSummary } = require("./bootcamp-data");
const { getLiveSummary } = require("./live-data");
const {
  buildPageEntry,
  toBootcampDetail,
  toCoursePlayer,
  toLiveDetail,
  toLiveList,
  toProductDetail,
  toProductList
} = require("../utils/navigation");

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
      title: "7天增长营",
      progress: "Day2/7",
      lastLabel: "今日任务",
      lastText: "朋友圈拆解",
      theme: "blue",
      actionLabel: "打卡"
    },
    {
      id: "learn-3",
      type: "直播回放",
      title: "直播答疑回放",
      progress: "23:18/90:00",
      lastLabel: "重点片段",
      lastText: "社群转化节奏",
      theme: "indigo",
      actionLabel: "回看"
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

function compactLearningProgress(text = "") {
  return String(text || "")
    .replace(/^已学\s*/, "")
    .replace(/\s*节$/, "节")
    .replace(/\s+/g, "");
}

function compactLearningSummary(text = "") {
  return String(text || "")
    .replace(/^最近学习：/, "")
    .replace(/^最近学习\s*/, "")
    .replace(/^上次学到：/, "")
    .replace(/^上次学到\s*/, "")
    .trim();
}

function clampLearningSummary(text = "", maxLength = 12) {
  const normalized = String(text || "").trim();

  if (!normalized) {
    return "";
  }

  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}…` : normalized;
}

function buildLearningRecentLesson(text = "") {
  const compactText = compactLearningSummary(text);
  const matched = compactText.match(/^(第\s*\d+\s*节)\s*(.*)$/);

  if (!matched) {
    return {
      lastLabel: "最近学习",
      lastText: clampLearningSummary(compactText)
    };
  }

  return {
    lastLabel: matched[1].replace(/\s+/g, ""),
    lastText: clampLearningSummary(matched[2] || compactText)
  };
}

function getLearningPageData() {
  const bootcampSummary = getBootcampSummary("camp-7day-growth");
  const liveSummary = getLiveSummary("live-private-domain-qa", "replay");
  const learningList = learningCourseConfig.map((item) => {
    const courseMeta = getLearningCourseMeta(item.detailCourseId);
    const recentLesson = buildLearningRecentLesson(courseMeta.last);
    const detailCourseId = getDetailCourseIdByLearningId(item.id);
    const playerCourseId = getPlayerCourseIdByLearningId(item.id);

    return {
      id: item.id,
      type: item.type,
      title: courseMeta.title,
      progress: compactLearningProgress(courseMeta.progress),
      lastLabel: recentLesson.lastLabel,
      lastText: recentLesson.lastText,
      theme: item.theme,
      actionLabel: item.actionLabel,
      detailEntry: detailCourseId ? buildPageEntry(toProductDetail(detailCourseId)) : null,
      continueEntry: playerCourseId ? buildPageEntry(toCoursePlayer(playerCourseId)) : null
    };
  });

  const staticLearningList = clone(learningPageData.learningList).map((item) => ({
    ...item,
    title:
      item.id === "learn-2"
        ? bootcampSummary.title.replace("私域", "")
        : item.id === "learn-3"
          ? "直播答疑回放"
          : item.title,
    progress:
      item.id === "learn-2"
        ? bootcampSummary.progressCompact
        : item.id === "learn-3"
          ? liveSummary.learningProgress
          : item.progress,
    lastLabel:
      item.id === "learn-2"
        ? bootcampSummary.learningLastLabel
        : item.id === "learn-3"
          ? liveSummary.learningLastLabel
          : item.lastLabel,
    lastText:
      item.id === "learn-2"
        ? bootcampSummary.learningLastText
        : item.id === "learn-3"
          ? liveSummary.learningLastText
          : item.lastText,
    detailEntry:
      item.id === "learn-2"
        ? buildPageEntry(toBootcampDetail(getBootcampIdByLearningId(item.id)))
        : item.id === "learn-3"
          ? (() => {
              const targetLive = getLiveEntryByLearningId(item.id);
              return targetLive ? buildPageEntry(toLiveDetail(targetLive.liveId, targetLive.mode)) : null;
            })()
          : null,
    continueEntry:
      item.id === "learn-2"
        ? buildPageEntry(toBootcampDetail(getBootcampIdByLearningId(item.id)))
        : item.id === "learn-3"
          ? (() => {
              const targetLive = getLiveEntryByLearningId(item.id);
              return targetLive ? buildPageEntry(toLiveDetail(targetLive.liveId, targetLive.mode)) : null;
            })()
          : null
  }));

  return {
    metrics: clone(learningPageData.metrics),
    searchEntry: buildPageEntry(toProductList("all")),
    searchFeedback: "原型阶段先通过首页与分类浏览查找课程",
    liveCenterEntry: buildPageEntry(toLiveList()),
    learningList: [...learningList, ...staticLearningList]
  };
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

function getPlayerCourseIdByLearningId(itemId = "") {
  return learningPlayerCourseMap[itemId] || "";
}

function getDetailCourseIdByLearningId(itemId = "") {
  return learningDetailCourseMap[itemId] || "";
}

function getLearningPageMeta() {
  const pageData = getLearningPageData();

  return {
    searchEntry: clone(pageData.searchEntry),
    searchFeedback: pageData.searchFeedback,
    liveCenterEntry: clone(pageData.liveCenterEntry)
  };
}

function getLearningItemEntry(itemId = "", actionType = "detail") {
  const pageData = getLearningPageData();
  const targetItem = pageData.learningList.find((item) => item.id === itemId);

  if (!targetItem) {
    return null;
  }

  return clone(actionType === "continue" ? targetItem.continueEntry : targetItem.detailEntry);
}

module.exports = {
  getLearningItemEntry,
  getLearningPageMeta,
  getLearningPageData,
  getPlayerCourseIdByLearningId,
  getDetailCourseIdByLearningId,
  getBootcampIdByLearningId,
  getLiveEntryByLearningId
};
