const {
  fetchPlayerCourse,
  updateCourseProgress
} = require("../../services/api/page-data");
const {
  DEFAULT_PLAYER_PAGE_DATA,
  PLAYER_RETRY_DELAY,
  buildFallbackPlayerPayload,
  buildCoursePlayerPageState,
  buildRetryPendingState,
  resolvePlayerStatusAction
} = require("../../utils/course-player-state");
const {
  openPageEntry,
  parseCoursePlayerOptions
} = require("../../utils/navigation");

Page({
  data: DEFAULT_PLAYER_PAGE_DATA,

  async onLoad(options = {}) {
    const parsedOptions = parseCoursePlayerOptions(options);
    const courseId = parsedOptions.courseId;
    this.selectedLessonId = parsedOptions.lessonId;
    const targetCourse = await fetchPlayerCourse(courseId);

    if (targetCourse) {
      if (this.selectedLessonId) {
        await updateCourseProgress(courseId, this.selectedLessonId);
      }

      this.playerCourseId = courseId;
      this.playerPayload = targetCourse;
      this.applyPlayerPayload((await fetchPlayerCourse(courseId)) || targetCourse);
      return;
    }

    const fallbackPayload = buildFallbackPlayerPayload(parsedOptions);

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
    const action = resolvePlayerStatusAction(this.data);

    if (action.type === "retry") {
      this.onRetryTap();
      return;
    }

    openPageEntry(action.entry, action.feedback);
  },

  handleLockedLessonAction() {
    const lockedLessonAction = this.playerPayload && this.playerPayload.lockedLessonAction;
    openPageEntry(
      lockedLessonAction && lockedLessonAction.entry,
      (lockedLessonAction && lockedLessonAction.feedback) || "完成上一节后解锁"
    );
  },

  onRetryTap() {
    if (!this.playerPayload) {
      return;
    }

    this.setData(buildRetryPendingState(this.data));

    setTimeout(async () => {
      const latestPayload = this.playerCourseId ? (await fetchPlayerCourse(this.playerCourseId)) || this.playerPayload : this.playerPayload;
      this.playerPayload = latestPayload;
      this.applyPlayerPayload(latestPayload, false);
    }, PLAYER_RETRY_DELAY);
  },

  async onLessonTap(event) {
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
      await updateCourseProgress(this.playerCourseId, lessonId);
      const latestPayload = (await fetchPlayerCourse(this.playerCourseId)) || this.playerPayload;
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
