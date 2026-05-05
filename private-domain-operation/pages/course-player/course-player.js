const { getPlayerCourse, updatePlayerCourseProgress } = require("../../mock/course-data");

const DEFAULT_COVER_URL = "/assets/home/banner1.jpg";
const VIDEO_URL_PATTERN = /^https?:\/\//i;

function decodeValue(value = "") {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

function buildPlayerStatus(videoUrl = "", hasVideoError = false) {
  if (hasVideoError) {
    return {
      statusType: "error",
      statusTitle: "暂时无法播放",
      statusText: "当前视频加载失败，可重新加载或咨询课程。",
      statusActionText: "重新加载"
    };
  }

  if (!videoUrl) {
    return {
      statusType: "preparing",
      statusTitle: "内容准备中",
      statusText: "当前课节暂未上线，先看看目录和学习进度。",
      statusActionText: "咨询课程"
    };
  }

  if (!VIDEO_URL_PATTERN.test(videoUrl)) {
    return {
      statusType: "invalid",
      statusTitle: "内容待更新",
      statusText: "当前资源地址不可用，可先查看目录或咨询课程。",
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

Page({
  data: {
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
  },

  onLoad(options = {}) {
    const courseId = decodeValue(options.courseId);
    this.selectedLessonId = decodeValue(options.lessonId);
    const targetCourse = getPlayerCourse(courseId);

    if (targetCourse) {
      if (this.selectedLessonId) {
        updatePlayerCourseProgress(courseId, this.selectedLessonId);
      }

      this.playerCourseId = courseId;
      this.playerPayload = targetCourse;
      this.applyPlayerPayload(getPlayerCourse(courseId) || targetCourse);
      return;
    }

    const fallbackPayload = {
      title: decodeValue(options.title) || "课程播放",
      videoUrl: decodeValue(options.videoUrl),
      coverUrl: decodeValue(options.coverUrl),
      duration: decodeValue(options.duration),
      sourceLabel: decodeValue(options.sourceLabel) || "录播课程",
      description: decodeValue(options.description),
      outlineText: decodeValue(options.outlineText) || decodeValue(options.description) || "当前课程内容正在整理中。",
      progressSummary: null,
      chapters: []
    };

    this.playerPayload = fallbackPayload;
    this.applyPlayerPayload(fallbackPayload);
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  applyPlayerPayload(payload = {}, hasVideoError = false) {
    const normalizedVideoUrl = (payload.videoUrl || "").trim();
    const normalizedCoverUrl = (payload.coverUrl || "").trim() || DEFAULT_COVER_URL;
    const status = buildPlayerStatus(normalizedVideoUrl, hasVideoError);
    const lessons = flattenLessons(payload.chapters || []);
    const selectedLesson = getSelectableLesson(lessons, this.selectedLessonId);
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

    this.selectedLessonId = selectedLessonId;

    this.setData({
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
    });
  },

  onVideoError() {
    this.applyPlayerPayload(this.playerPayload, true);
  },

  onStatusActionTap() {
    if (this.data.statusType === "error") {
      this.onRetryTap();
      return;
    }

    wx.navigateTo({
      url:
        `/pages/consultation/consultation?scene=course` +
        `&title=${encodeURIComponent(this.data.title)}`
    });
  },

  handleLockedLessonAction() {
    const lockedAction = this.playerPayload && this.playerPayload.lockedAction;

    if (lockedAction === "member") {
      wx.navigateTo({
        url: "/pages/member-rights/member-rights?source=course"
      });
      return;
    }

    if (lockedAction === "consultation") {
      wx.navigateTo({
        url:
          `/pages/consultation/consultation?scene=course` +
          `&title=${encodeURIComponent(this.data.title)}`
      });
      return;
    }

    wx.showToast({
      title: "完成上一节后解锁",
      icon: "none"
    });
  },

  onRetryTap() {
    if (!this.playerPayload) {
      return;
    }

    this.setData({
      playerVideoUrl: "",
      isVideoReady: false
    });

    setTimeout(() => {
      const latestPayload = this.playerCourseId ? getPlayerCourse(this.playerCourseId) || this.playerPayload : this.playerPayload;
      this.playerPayload = latestPayload;
      this.applyPlayerPayload(latestPayload, false);
    }, 80);
  },

  onLessonTap(event) {
    const { lessonId, lessonStatus } = event.currentTarget.dataset;

    if (!lessonId) {
      return;
    }

    if (lessonId === this.data.currentLessonId) {
      return;
    }

    if (lessonStatus === "locked") {
      this.handleLockedLessonAction();
      return;
    }

    this.selectedLessonId = lessonId;
    if (this.playerCourseId) {
      updatePlayerCourseProgress(this.playerCourseId, lessonId);
      const latestPayload = getPlayerCourse(this.playerCourseId) || this.playerPayload;
      this.playerPayload = latestPayload;
      this.applyPlayerPayload(latestPayload, false);
      return;
    }

    this.applyPlayerPayload(this.playerPayload, false);
  },

  onPreviousLessonTap() {
    if (!this.data.previousLessonId) {
      return;
    }

    this.onLessonTap({
      currentTarget: {
        dataset: {
          lessonId: this.data.previousLessonId,
          lessonStatus: "upcoming"
        }
      }
    });
  },

  onNextLessonTap() {
    if (!this.data.nextLessonId) {
      return;
    }

    this.onLessonTap({
      currentTarget: {
        dataset: {
          lessonId: this.data.nextLessonId,
          lessonStatus: "upcoming"
        }
      }
    });
  }
});
