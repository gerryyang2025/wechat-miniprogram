const { clone } = require("./shared");
const { getLearningCourseMeta } = require("./course-data");

const purchasedCourseConfig = [
  {
    id: "owned-course-aigc",
    detailCourseId: "course-aigc-video",
    shortTitle: "AIGC视频",
    badge: "录播课",
    action: "学习",
    theme: "cyan",
    monogram: "AI"
  },
  {
    id: "owned-course-wechat-game",
    detailCourseId: "course-wechat-game",
    shortTitle: "小游戏开发",
    badge: "录播课",
    action: "学习",
    theme: "indigo",
    monogram: "WX"
  },
  {
    id: "owned-course-1",
    detailCourseId: "course-1",
    shortTitle: "IP变现课",
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
      id: "course-1",
      coverTheme: "cover-purple",
      tag: "系列课",
      title: "个人 IP 内容变现实战课",
      author: "Gerry",
      meta: "12 节课程 · 适合 0 到 1 搭建",
      price: "¥299",
      hint: "定位 / 选题 / 成交路径"
    },
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

    return {
      id: item.id,
      badge: item.badge,
      title: item.shortTitle || courseMeta.title,
      meta: compactOwnedMeta(courseMeta.progress),
      summary: recentLesson.recentLessonTitle,
      recentLessonIndex: recentLesson.recentLessonIndex,
      action: item.action,
      theme: item.theme,
      monogram: item.monogram
    };
  });

  return {
    currentBannerIndex: homePageData.currentBannerIndex,
    bannerAutoplay: homePageData.bannerAutoplay,
    bannerList: clone(homePageData.bannerList),
    purchasedCourses,
    recommendedCourses: clone(homePageData.recommendedCourses),
    featureCards: clone(homePageData.featureCards)
  };
}

function getOwnedCoursePlayerCourseId(ownedId = "") {
  return ownedCoursePlayerCourseMap[ownedId] || "";
}

function getHomePrimaryLiveEntry() {
  return clone(homePrimaryLiveEntry);
}

module.exports = {
  getHomePageData,
  getOwnedCoursePlayerCourseId,
  getHomePrimaryLiveEntry
};
