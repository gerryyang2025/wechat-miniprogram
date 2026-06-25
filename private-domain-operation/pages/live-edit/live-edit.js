const {
  createLiveEvent,
  fetchLiveAccessOptions,
  fetchLiveEditPageData,
  saveLiveEvent
} = require("../../services/api/page-data");

const STATUS_OPTIONS = [
  { key: "", label: "自动" },
  { key: "upcoming", label: "未开始" },
  { key: "live", label: "直播中" },
  { key: "ended", label: "已结束" },
  { key: "replay", label: "回放" }
];

const VISIBILITY_OPTIONS = [
  { key: "all", label: "全部用户" },
  { key: "course", label: "指定课程" },
  { key: "bootcamp", label: "指定训练营" },
  { key: "member", label: "指定会员" }
];

function safeDecode(value = "") {
  try {
    return decodeURIComponent(String(value || ""));
  } catch (error) {
    return String(value || "");
  }
}

function defaultForm() {
  return {
    id: "",
    title: "",
    summary: "",
    speaker: "Gerry",
    coverUrl: "",
    startAt: "2026-06-25T20:00:00+08:00",
    endAt: "2026-06-25T21:00:00+08:00",
    statusOverride: "",
    liveUrl: "",
    replayUrl: "",
    visibility: "all",
    visibilityRefId: 0,
    replayEnabled: false
  };
}

function normalizeForm(payload = {}) {
  const source = payload && typeof payload === "object" ? payload : {};

  return {
    ...defaultForm(),
    ...source,
    id: source.id ? String(source.id) : "",
    visibilityRefId: Number(source.visibilityRefId) || 0,
    replayEnabled: Boolean(source.replayEnabled)
  };
}

function optionListForVisibility(options = {}, visibility = "all") {
  if (visibility === "course") {
    return Array.isArray(options.courses) ? options.courses : [];
  }

  if (visibility === "bootcamp") {
    return Array.isArray(options.bootcamps) ? options.bootcamps : [];
  }

  if (visibility === "member") {
    return Array.isArray(options.members) ? options.members : [];
  }

  return [];
}

function buildPayload(form = {}) {
  return {
    title: form.title || "",
    summary: form.summary || "",
    speaker: form.speaker || "",
    coverUrl: form.coverUrl || "",
    startAt: form.startAt || "",
    endAt: form.endAt || "",
    statusOverride: form.statusOverride || "",
    liveUrl: form.liveUrl || "",
    replayUrl: form.replayUrl || "",
    visibility: form.visibility || "all",
    visibilityRefId: Number(form.visibilityRefId) || 0,
    replayEnabled: Boolean(form.replayEnabled)
  };
}

function showToast(title, icon = "none") {
  wx.showToast({
    title,
    icon
  });
}

Page({
  data: {
    liveId: "",
    loading: true,
    saving: false,
    statusOptions: STATUS_OPTIONS,
    visibilityOptions: VISIBILITY_OPTIONS,
    accessOptions: { courses: [], bootcamps: [], members: [] },
    refOptions: [],
    form: defaultForm()
  },

  async onLoad(options = {}) {
    const liveId = safeDecode(options.liveId);

    this.setData({
      liveId,
      loading: true,
      form: defaultForm(),
      refOptions: []
    });

    try {
      const [formPayload, accessOptionsPayload] = await Promise.all([
        liveId ? fetchLiveEditPageData(liveId) : Promise.resolve(defaultForm()),
        fetchLiveAccessOptions()
      ]);
      const accessOptions = accessOptionsPayload || { courses: [], bootcamps: [], members: [] };
      const form = normalizeForm(formPayload || defaultForm());

      this.setData({
        loading: false,
        accessOptions,
        form,
        refOptions: optionListForVisibility(accessOptions, form.visibility)
      });
    } catch (error) {
      this.setData({ loading: false });
      showToast((error && error.message) || "直播加载失败");
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
    this.setData({
      "form.statusOverride": event.currentTarget.dataset.status || ""
    });
  },

  onVisibilityTap(event) {
    const visibility = event.currentTarget.dataset.visibility || "all";

    this.setData({
      "form.visibility": visibility,
      "form.visibilityRefId": 0,
      refOptions: optionListForVisibility(this.data.accessOptions, visibility)
    });
  },

  onRefTap(event) {
    this.setData({
      "form.visibilityRefId": Number(event.currentTarget.dataset.refId) || 0
    });
  },

  onReplaySwitch(event) {
    this.setData({
      "form.replayEnabled": Boolean(event.detail.value)
    });
  },

  async onSaveTap() {
    if (this.data.saving) {
      return;
    }

    this.setData({ saving: true });

    try {
      const payload = buildPayload(this.data.form);
      const saved = this.data.liveId
        ? await saveLiveEvent(this.data.liveId, payload)
        : await createLiveEvent(payload);
      const form = normalizeForm(saved);
      const liveId = String(form.id || this.data.liveId || "");

      this.setData({
        saving: false,
        liveId,
        form,
        refOptions: optionListForVisibility(this.data.accessOptions, form.visibility)
      });
      showToast("保存成功", "success");
    } catch (error) {
      this.setData({ saving: false });
      showToast((error && error.message) || "保存失败");
    }
  }
});
