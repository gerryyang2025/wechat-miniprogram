const { getPlayerCourse, updatePlayerCourseProgress } = require("../../mock/course-data");
const { DEFAULT_PLAYER_PAGE_DATA, buildCoursePlayerPageState } = require("../../utils/course-player-state");
const {
  parseCoursePlayerOptions,
  toMemberRights,
  toConsultation
} = require("../../utils/navigation");

Page({
  data: DEFAULT_PLAYER_PAGE_DATA,

  onLoad(options = {}) {
    const parsedOptions = parseCoursePlayerOptions(options);
    const courseId = parsedOptions.courseId;
    this.selectedLessonId = parsedOptions.lessonId;
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
      title: parsedOptions.title || "课程播放",
      videoUrl: parsedOptions.videoUrl,
      coverUrl: parsedOptions.coverUrl,
      duration: parsedOptions.duration,
      sourceLabel: parsedOptions.sourceLabel || "录播课程",
      description: parsedOptions.description,
      outlineText: parsedOptions.outlineText || parsedOptions.description || "当前课程内容正在整理中。",
      progressSummary: null,
      chapters: [],
      resourceState: parsedOptions.videoUrl ? "ready" : "preparing"
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
    const pageState = buildCoursePlayerPageState(payload, this.selectedLessonId, hasVideoError);

    this.selectedLessonId = pageState.selectedLessonId;
    this.setData(pageState.data);
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
      url: toConsultation("course", this.data.title)
    });
  },

  handleLockedLessonAction() {
    const lockedAction = this.playerPayload && this.playerPayload.lockedAction;

    if (lockedAction === "member") {
      wx.navigateTo({
        url: toMemberRights("course")
      });
      return;
    }

    if (lockedAction === "consultation") {
      wx.navigateTo({
        url: toConsultation("course", this.data.title)
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
