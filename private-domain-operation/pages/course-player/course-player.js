const { getPlayerCourse } = require("../../mock/course-data");

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
    isVideoError: false,
    isVideoReady: false,
    statusType: "preparing",
    statusTitle: "资源准备中",
    statusText: "当前课程内容正在整理中。",
    statusActionText: "咨询课程"
  },

  onLoad(options = {}) {
    const courseId = decodeValue(options.courseId);
    const targetCourse = getPlayerCourse(courseId);

    if (targetCourse) {
      this.playerPayload = targetCourse;
      this.applyPlayerPayload(targetCourse);
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

    this.setData({
      title: payload.title || "课程播放",
      playerVideoUrl: status.statusType === "ready" ? normalizedVideoUrl : "",
      videoUrl: normalizedVideoUrl,
      coverUrl: normalizedCoverUrl,
      isFallbackCover: !payload.coverUrl,
      duration: payload.duration || "",
      sourceLabel: payload.sourceLabel || "录播课程",
      description: payload.description || "",
      outlineText: payload.outlineText || payload.description || "当前课程内容正在整理中。",
      progressSummary: payload.progressSummary || null,
      chapters: payload.chapters || [],
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
      this.applyPlayerPayload(this.playerPayload, false);
    }, 80);
  }
});
