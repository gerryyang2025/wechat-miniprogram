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
      statusTitle: "视频暂时无法播放",
      statusText: "请检查媒体域名配置或当前网络状态，也可以稍后重新加载。",
      statusActionText: "重新加载"
    };
  }

  if (!videoUrl) {
    return {
      statusType: "preparing",
      statusTitle: "资源准备中",
      statusText: "当前课节的视频资源正在整理中，稍后即可继续观看。",
      statusActionText: "咨询课程"
    };
  }

  if (!VIDEO_URL_PATTERN.test(videoUrl)) {
    return {
      statusType: "invalid",
      statusTitle: "资源链接无效",
      statusText: "当前视频地址格式不正确，建议先咨询课程或稍后再试。",
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

function buildOutlineText(payload = {}, selectedLesson = null, nextLesson = null) {
  if (!selectedLesson) {
    return payload.outlineText || payload.description || "当前课程内容正在整理中。";
  }

  const summary = payload.description || payload.outlineText || "当前课程内容正在整理中。";
  const nextText = nextLesson ? `下一节：${nextLesson.title}` : "当前已切换到本次目录的最后一节。";

  return `当前课节：${selectedLesson.title}，所属 ${selectedLesson.chapterTitle}。${summary} ${nextText}`;
}

Page({
  data: {
    title: "课程播放",
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
    statusTitle: "资源准备中",
    statusText: "当前课程内容正在整理中。",
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
          currentLessonTitle: selectedLesson ? `当前课节：${selectedLesson.title}` : payload.progressSummary.currentLessonTitle,
          nextLessonTitle: nextLesson ? `下一节：${nextLesson.title}` : "下一节：请先完成当前目录内容",
          lastPosition: selectedLesson ? `当前定位 ${selectedLesson.title}` : payload.progressSummary.lastPosition
        }
      : null;

    this.selectedLessonId = selectedLessonId;

    this.setData({
      title: payload.title || "课程播放",
      playerVideoUrl: status.statusType === "ready" ? normalizedVideoUrl : "",
      videoUrl: normalizedVideoUrl,
      coverUrl: normalizedCoverUrl,
      isFallbackCover: !payload.coverUrl,
      duration: payload.duration || "",
      sourceLabel: payload.sourceLabel || "录播课程",
      description: payload.description || "",
      outlineText: buildOutlineText(payload, selectedLesson, nextLesson),
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
      wx.showToast({
        title: "当前课节暂未解锁",
        icon: "none"
      });
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
