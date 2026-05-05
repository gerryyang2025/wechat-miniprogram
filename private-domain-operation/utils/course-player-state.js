const DEFAULT_COVER_URL = "/assets/home/banner1.jpg";
const VIDEO_URL_PATTERN = /^https?:\/\//i;

const DEFAULT_PLAYER_PAGE_DATA = {
  title: "课程播放",
  pageSubtitle: "继续学习当前内容",
  pageTag: "课程学习",
  playerVideoUrl: "",
  videoUrl: "",
  coverUrl: "",
  isFallbackCover: false,
  duration: "",
  sourceLabel: "录播课程",
  description: "",
  outlineText: "",
  progressSummary: null,
  chapters: [],
  currentLessonId: "",
  currentLessonTitle: "",
  currentLessonDuration: "",
  previousLessonId: "",
  previousLessonTitle: "",
  nextLessonId: "",
  nextLessonTitle: "",
  isVideoError: false,
  isVideoReady: false,
  statusType: "preparing",
  statusTitle: "内容准备中",
  statusText: "当前课节暂未上线，先看看目录和学习进度。",
  statusActionText: "咨询课程"
};

function buildPlayerStatus(payload = {}, hasVideoError = false) {
  const videoUrl = (payload.videoUrl || "").trim();
  const resourceState = payload.resourceState || "";

  if (hasVideoError) {
    return {
      statusType: "error",
      statusTitle: "暂时无法播放",
      statusText: "当前视频加载失败，可重新加载或咨询课程。",
      statusActionText: "重新加载"
    };
  }

  if (resourceState === "invalid" || (!VIDEO_URL_PATTERN.test(videoUrl) && videoUrl)) {
    return {
      statusType: "invalid",
      statusTitle: "内容待更新",
      statusText: "当前资源地址不可用，可先查看目录或咨询课程。",
      statusActionText: "咨询课程"
    };
  }

  if (!videoUrl || resourceState === "preparing" || resourceState === "planned") {
    return {
      statusType: "preparing",
      statusTitle: "内容准备中",
      statusText: "当前课节暂未上线，先看看目录和学习进度。",
      statusActionText: "咨询课程"
    };
  }

  return {
    statusType: "ready",
    statusTitle: "",
    statusText: "",
    statusActionText: ""
  };
}

function flattenLessons(chapters = []) {
  const lessons = [];

  chapters.forEach((chapter) => {
    (chapter.lessons || []).forEach((lesson) => {
      lessons.push({
        ...lesson,
        chapterTitle: chapter.title
      });
    });
  });

  return lessons;
}

function getSelectableLesson(lessons = [], preferredLessonId = "") {
  if (!lessons.length) {
    return null;
  }

  const preferredLesson = lessons.find((lesson) => lesson.id === preferredLessonId && lesson.status !== "locked");

  if (preferredLesson) {
    return preferredLesson;
  }

  const currentLesson = lessons.find((lesson) => lesson.status === "current");

  if (currentLesson) {
    return currentLesson;
  }

  const previewLesson = lessons.find((lesson) => lesson.status === "preview");

  if (previewLesson) {
    return previewLesson;
  }

  return lessons[0];
}

function buildRenderedChapters(chapters = [], selectedLessonId = "") {
  const flatLessons = flattenLessons(chapters);
  const selectedIndex = flatLessons.findIndex((lesson) => lesson.id === selectedLessonId);
  let globalIndex = -1;

  return chapters.map((chapter) => ({
    ...chapter,
    lessons: (chapter.lessons || []).map((lesson) => {
      globalIndex += 1;
      let renderedStatus = lesson.status || "upcoming";

      if (lesson.id === selectedLessonId) {
        renderedStatus = "current";
      } else if (selectedIndex > -1 && globalIndex < selectedIndex && lesson.status !== "locked") {
        renderedStatus = "completed";
      } else if (lesson.status === "current") {
        renderedStatus = "upcoming";
      }

      return {
        ...lesson,
        renderedStatus
      };
    })
  }));
}

function getAdjacentLesson(chapters = [], currentLessonId = "", direction = "next") {
  const flatLessons = flattenLessons(chapters).filter((lesson) => lesson.status !== "locked");
  const currentIndex = flatLessons.findIndex((lesson) => lesson.id === currentLessonId);

  if (currentIndex < 0) {
    return null;
  }

  if (direction === "prev") {
    return currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  }

  return currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;
}

function buildOutlineText(payload = {}, selectedLesson = null) {
  if (!selectedLesson) {
    return payload.outlineText || payload.description || "当前课程内容正在整理中。";
  }

  const summary = (payload.outlineText || payload.description || "当前课程内容正在整理中。")
    .replace(/\s+/g, " ")
    .trim();

  return `${selectedLesson.chapterTitle} · ${selectedLesson.title}。${summary}`;
}

function buildPageTag(payload = {}, statusType = "ready") {
  if (payload.sourceLabel) {
    return payload.sourceLabel;
  }

  if (statusType === "preparing") {
    return "内容更新中";
  }

  return "课程学习";
}

function buildPageSubtitle(payload = {}, statusType = "ready") {
  if (statusType === "ready") {
    return "继续学习当前内容";
  }

  if (payload.sourceLabel === "会员试看") {
    return "先看试看内容和课程目录";
  }

  if (payload.sourceLabel === "图文内容") {
    return "先看图文结构和目录";
  }

  if (statusType === "preparing") {
    return "先看目录和学习进度";
  }

  return "先看目录或咨询课程";
}

function buildCoursePlayerPageState(payload = {}, preferredLessonId = "", hasVideoError = false) {
  const normalizedVideoUrl = (payload.videoUrl || "").trim();
  const normalizedCoverUrl = (payload.coverUrl || "").trim() || DEFAULT_COVER_URL;
  const status = buildPlayerStatus(payload, hasVideoError);
  const lessons = flattenLessons(payload.chapters || []);
  const selectedLesson = getSelectableLesson(lessons, preferredLessonId);
  const selectedLessonId = selectedLesson ? selectedLesson.id : "";
  const renderedChapters = buildRenderedChapters(payload.chapters || [], selectedLessonId);
  const previousLesson = getAdjacentLesson(payload.chapters || [], selectedLessonId, "prev");
  const nextLesson = getAdjacentLesson(payload.chapters || [], selectedLessonId, "next");
  const progressSummary = payload.progressSummary
    ? {
        ...payload.progressSummary,
        currentLessonTitle: selectedLesson ? `本节：${selectedLesson.title}` : payload.progressSummary.currentLessonTitle,
        nextLessonTitle: nextLesson ? `下一节：${nextLesson.title}` : "下一节：当前目录已学完",
        lastPosition: selectedLesson ? `上次学到：${selectedLesson.title}` : payload.progressSummary.lastPosition
      }
    : null;

  return {
    selectedLessonId,
    data: {
      title: payload.title || "课程播放",
      pageSubtitle: buildPageSubtitle(payload, status.statusType),
      pageTag: buildPageTag(payload, status.statusType),
      playerVideoUrl: status.statusType === "ready" ? normalizedVideoUrl : "",
      videoUrl: normalizedVideoUrl,
      coverUrl: normalizedCoverUrl,
      isFallbackCover: !payload.coverUrl,
      duration: payload.duration || "",
      sourceLabel: payload.sourceLabel || "录播课程",
      description: payload.description || "",
      outlineText: buildOutlineText(payload, selectedLesson),
      progressSummary,
      chapters: renderedChapters,
      currentLessonId: selectedLessonId,
      currentLessonTitle: selectedLesson ? selectedLesson.title : "",
      currentLessonDuration: selectedLesson ? selectedLesson.duration || "" : "",
      previousLessonId: previousLesson ? previousLesson.id : "",
      previousLessonTitle: previousLesson ? previousLesson.title : "",
      nextLessonId: nextLesson ? nextLesson.id : "",
      nextLessonTitle: nextLesson ? nextLesson.title : "",
      isVideoError: hasVideoError,
      isVideoReady: status.statusType === "ready",
      statusType: status.statusType,
      statusTitle: status.statusTitle,
      statusText: status.statusText,
      statusActionText: status.statusActionText
    }
  };
}

module.exports = {
  DEFAULT_PLAYER_PAGE_DATA,
  buildCoursePlayerPageState
};
