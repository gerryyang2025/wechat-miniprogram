const { clone } = require("./shared");
const { getLearningCourseMeta } = require("./course-data");
const {
  buildPageEntry,
  toBootcampDetail,
  toCoursePlayer,
  toLearning,
  toLiveDetail,
  toLiveList,
  toMemberRights,
  toProductCategories,
  toProductDetail,
  toProductList
} = require("../utils/navigation");

const purchasedCourseConfig = [
  {
    id: "owned-course-aigc",
    detailCourseId: "course-aigc-video",
    badge: "录播课",
    action: "学习",
    theme: "cyan",
    monogram: "AI"
  },
  {
    id: "owned-course-wechat-game",
    detailCourseId: "course-wechat-game",
    badge: "录播课",
    action: "学习",
    theme: "indigo",
    monogram: "WX"
  },
  {
    id: "owned-course-1",
    detailCourseId: "course-1",
    badge: "系列课",
    action: "学习",
    theme: "purple",
    monogram: "IP"
  }
];

const homePageData = {
  currentBannerIndex: 0,
  bannerAutoplay: true,
  bannerList: [
    {
      id: "banner-1",
      src: "/assets/home/banner1.jpg"
    },
    {
      id: "banner-2",
      src: "/assets/home/banner2.jpg"
    }
  ],
  recommendedCourses: [
    {
      id: "course-2",
      coverTheme: "cover-blue",
      tag: "视频课",
      title: "短视频表达与节奏训练",
      author: "Gerry",
      meta: "8 节课程 · 口播拍摄训练",
      price: "会员可学",
      hint: "口播结构 / 镜头状态 / 节奏感"
    },
    {
      id: "course-3",
      coverTheme: "cover-indigo",
      tag: "图文课",
      title: "朋友圈内容转化模型",
      author: "Gerry",
      meta: "6 节课程 · 图文成交训练",
      price: "¥129",
      hint: "内容铺垫 / 信任积累 / 转化动作"
    }
  ],
  featureCards: [
    {
      id: "feature-1",
      type: "camp",
      eyebrow: "训练营推荐",
      title: "7 天私域增长训练营",
      desc: "每天一个内容动作，沉淀可复用的私域运营节奏。",
      action: "查看详情"
    },
    {
      id: "feature-2",
      type: "live",
      eyebrow: "直播推荐",
      title: "今晚 20:00 私域运营直播答疑",
      desc: "聚焦内容变现、学员转化和日常运营问题。",
      action: "预约提醒"
    },
    {
      id: "feature-3",
      type: "member",
      eyebrow: "会员推荐",
      title: "年度会员计划",
      desc: "解锁录播课、训练营精选内容和直播回放权益。",
      action: "了解权益"
    }
  ]
};

const ownedCoursePlayerCourseMap = {
  "owned-course-aigc": "player-aigc-video",
  "owned-course-wechat-game": "player-wechat-game",
  "owned-course-1": "player-ip-course"
};

const homePrimaryLiveEntry = {
  liveId: "live-private-domain-qa",
  mode: "upcoming"
};

const HOME_BANNER_RESUME_DELAY = 160;

function compactOwnedSummary(text = "") {
  return text
    .replace(/^最近学习：/, "")
    .replace(/^最近学习\s*/, "")
    .replace(/^上次学到：/, "")
    .replace(/^上次学到\s*/, "")
    .trim();
}

function compactOwnedMeta(text = "") {
  return String(text || "")
    .replace(/^已学\s*/, "")
    .replace(/\s*节$/, "节")
    .replace(/\s+/g, "");
}

function clampOwnedSummary(text = "", maxLength = 10) {
  const normalized = String(text || "").trim();

  if (!normalized) {
    return "";
  }

  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}…` : normalized;
}

function buildOwnedRecentLesson(text = "") {
  const compactText = compactOwnedSummary(text);
  const matched = compactText.match(/^(第\s*\d+\s*节)\s*(.*)$/);

  if (!matched) {
    return {
      recentLessonIndex: "最近学习",
      recentLessonTitle: clampOwnedSummary(compactText)
    };
  }

  return {
    recentLessonIndex: matched[1].replace(/\s+/g, ""),
    recentLessonTitle: clampOwnedSummary(matched[2] || compactText)
  };
}

function getHomePageData() {
  const purchasedCourses = purchasedCourseConfig.map((item) => {
    const courseMeta = getLearningCourseMeta(item.detailCourseId);
    const recentLesson = buildOwnedRecentLesson(courseMeta.last);
    const playerCourseId = getOwnedCoursePlayerCourseId(item.id);

    return {
      id: item.id,
      badge: item.badge,
      title: courseMeta.title,
      meta: compactOwnedMeta(courseMeta.progress),
      summary: recentLesson.recentLessonTitle,
      recentLessonIndex: recentLesson.recentLessonIndex,
      action: item.action,
      theme: item.theme,
      monogram: item.monogram,
      entry: playerCourseId
        ? buildPageEntry(toCoursePlayer(playerCourseId))
        : buildPageEntry(toLearning(), "reLaunch")
    };
  });

  return {
    currentBannerIndex: homePageData.currentBannerIndex,
    bannerAutoplay: homePageData.bannerAutoplay,
    bannerList: clone(homePageData.bannerList),
    searchEntry: buildPageEntry(toProductList("all")),
    categoriesEntry: buildPageEntry(toProductCategories()),
    ownedAllEntry: buildPageEntry(toLearning(), "reLaunch"),
    liveCenterEntry: buildPageEntry(toLiveList()),
    bannerResumeDelay: HOME_BANNER_RESUME_DELAY,
    purchasedCourses,
    recommendedCourses: clone(homePageData.recommendedCourses).map((item) => ({
      ...item,
      entry: buildPageEntry(toProductDetail(item.id))
    })),
    featureCards: clone(homePageData.featureCards).map((item) => ({
      ...item,
      entry:
        item.type === "camp"
          ? buildPageEntry(toBootcampDetail("camp-7day-growth"))
          : item.type === "live"
            ? buildPageEntry(toLiveDetail(homePrimaryLiveEntry.liveId, homePrimaryLiveEntry.mode))
            : item.type === "member"
              ? buildPageEntry(toMemberRights("home"))
              : null
    }))
  };
}

function getOwnedCoursePlayerCourseId(ownedId = "") {
  return ownedCoursePlayerCourseMap[ownedId] || "";
}

function getHomeOwnedEntry(ownedId = "") {
  const pageData = getHomePageData();
  const targetItem = pageData.purchasedCourses.find((item) => item.id === ownedId);
  return targetItem ? clone(targetItem.entry) : buildPageEntry(toLearning(), "reLaunch");
}

function getHomeRecommendedEntry(courseId = "") {
  const pageData = getHomePageData();
  const targetItem = pageData.recommendedCourses.find((item) => item.id === courseId);
  return targetItem ? clone(targetItem.entry) : null;
}

function getHomeFeatureEntry(featureType = "") {
  const pageData = getHomePageData();
  const targetItem = pageData.featureCards.find((item) => item.type === featureType);
  return targetItem ? clone(targetItem.entry) : null;
}

function getHomePageMeta() {
  const pageData = getHomePageData();

  return {
    searchEntry: clone(pageData.searchEntry),
    categoriesEntry: clone(pageData.categoriesEntry),
    ownedAllEntry: clone(pageData.ownedAllEntry),
    liveCenterEntry: clone(pageData.liveCenterEntry),
    bannerResumeDelay: HOME_BANNER_RESUME_DELAY
  };
}

module.exports = {
  HOME_BANNER_RESUME_DELAY,
  getHomeFeatureEntry,
  getHomePageData,
  getHomePageMeta,
  getHomeOwnedEntry,
  getHomeRecommendedEntry
};
