const {
  fetchCourseAnalytics,
  fetchCourseEditPageData,
  saveCourseEdit
} = require("../../services/api/page-data");

const STATUS_OPTIONS = [
  { key: "published", label: "已上架" },
  { key: "draft", label: "草稿" }
];

function buildDefaultForm(courseId = "") {
  return {
    id: courseId,
    title: "",
    description: "",
    status: "draft",
    coverUrl: "",
    lessons: []
  };
}

function normalizeStatus(status = "") {
  return status === "published" ? "published" : "draft";
}

function normalizeLesson(lesson = {}, index = 0) {
  const rawDuration = lesson.durationSeconds;

  return {
    id: lesson.id || "",
    title: lesson.title || "",
    videoUrl: lesson.videoUrl || "",
    coverUrl: lesson.coverUrl || "",
    durationSeconds: rawDuration === undefined || rawDuration === null ? "" : String(rawDuration),
    displayIndex: index + 1
  };
}

function normalizeForm(payload = {}, courseId = "") {
  if (!payload || typeof payload !== "object") {
    return buildDefaultForm(courseId);
  }

  return {
    id: payload.id || courseId,
    title: payload.title || "",
    description: payload.description || "",
    status: normalizeStatus(payload.status),
    coverUrl: payload.coverUrl || "",
    lessons: Array.isArray(payload.lessons) ? payload.lessons.map(normalizeLesson) : []
  };
}

function normalizeAnalytics(payload = {}) {
  if (!payload || typeof payload !== "object") {
    return {
      learnerCount: 0,
      completedCount: 0,
      averageProgress: 0,
      latestLearnedAt: ""
    };
  }

  return {
    learnerCount: Number(payload.learnerCount) || 0,
    completedCount: Number(payload.completedCount) || 0,
    averageProgress: Number(payload.averageProgress) || 0,
    latestLearnedAt: payload.latestLearnedAt || ""
  };
}

function safeDecode(value = "") {
  try {
    return decodeURIComponent(String(value || ""));
  } catch (error) {
    return String(value || "");
  }
}

function toNonNegativeDuration(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.floor(parsed);
}

function buildSavePayload(form = {}) {
  return {
    id: form.id,
    title: form.title || "",
    description: form.description || "",
    status: normalizeStatus(form.status),
    coverUrl: form.coverUrl || "",
    lessons: Array.isArray(form.lessons)
      ? form.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title || "",
        videoUrl: lesson.videoUrl || "",
        coverUrl: lesson.coverUrl || "",
        durationSeconds: toNonNegativeDuration(lesson.durationSeconds)
      }))
      : []
  };
}

function showToast(title, icon = "none") {
  wx.showToast({
    title,
    icon
  });
}

function errorMessage(error, fallback) {
  return (error && error.message) || fallback;
}

Page({
  data: {
    courseId: "",
    loading: true,
    saving: false,
    statusOptions: STATUS_OPTIONS,
    form: buildDefaultForm(),
    analytics: normalizeAnalytics()
  },

  async onLoad(options = {}) {
    const courseId = safeDecode(options.courseId);

    this.setData({
      courseId,
      loading: true,
      form: buildDefaultForm(courseId),
      analytics: normalizeAnalytics()
    });

    if (!courseId) {
      this.setData({ loading: false });
      showToast("缺少课程 ID");
      return;
    }

    try {
      const [formPayload, analyticsPayload] = await Promise.all([
        fetchCourseEditPageData(courseId),
        fetchCourseAnalytics(courseId)
      ]);

      this.setData({
        loading: false,
        form: normalizeForm(formPayload, courseId),
        analytics: normalizeAnalytics(analyticsPayload)
      });
    } catch (error) {
      this.setData({ loading: false });
      showToast(errorMessage(error, "课程加载失败"));
    }
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onFieldInput(event) {
    const { field } = event.currentTarget.dataset;

    if (!field) {
      return;
    }

    this.setData({
      [`form.${field}`]: event.detail.value
    });
  },

  onStatusTap(event) {
    const { status } = event.currentTarget.dataset;

    if (!status) {
      return;
    }

    this.setData({
      "form.status": normalizeStatus(status)
    });
  },

  onLessonInput(event) {
    const { field } = event.currentTarget.dataset;
    const index = Number(event.currentTarget.dataset.index);

    if (!field || !Number.isInteger(index) || index < 0) {
      return;
    }

    this.setData({
      [`form.lessons[${index}].${field}`]: event.detail.value
    });
  },

  async onSaveTap() {
    if (this.data.saving) {
      return;
    }

    if (!this.data.courseId) {
      showToast("缺少课程 ID");
      return;
    }

    this.setData({ saving: true });

    try {
      const updated = await saveCourseEdit(this.data.courseId, buildSavePayload(this.data.form));

      this.setData({
        saving: false,
        form: normalizeForm(updated, this.data.courseId)
      });
      showToast("保存成功", "success");
    } catch (error) {
      this.setData({ saving: false });
      showToast(errorMessage(error, "保存失败"));
    }
  }
});
