const { getPlayerCourse } = require("../../mock/course-data");

function decodeValue(value = "") {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

Page({
  data: {
    title: "课程播放",
    videoUrl: "",
    coverUrl: "",
    duration: "",
    sourceLabel: "录播课程",
    description: "",
    outlineText: "",
    progressSummary: null,
    chapters: [],
    isVideoError: false
  },

  onLoad(options = {}) {
    const courseId = decodeValue(options.courseId);
    const targetCourse = getPlayerCourse(courseId);

    if (targetCourse) {
      this.setData({
        title: targetCourse.title,
        videoUrl: targetCourse.videoUrl,
        coverUrl: targetCourse.coverUrl,
        duration: targetCourse.duration,
        sourceLabel: targetCourse.sourceLabel || "录播课程",
        description: targetCourse.description,
        outlineText: targetCourse.outlineText || targetCourse.description || "当前课程内容正在整理中。",
        progressSummary: targetCourse.progressSummary || null,
        chapters: targetCourse.chapters || [],
        isVideoError: false
      });
      return;
    }

    this.setData({
      title: decodeValue(options.title) || "课程播放",
      videoUrl: decodeValue(options.videoUrl),
      coverUrl: decodeValue(options.coverUrl),
      duration: decodeValue(options.duration),
      sourceLabel: decodeValue(options.sourceLabel) || "录播课程",
      description: decodeValue(options.description),
      outlineText: decodeValue(options.outlineText) || decodeValue(options.description) || "当前课程内容正在整理中。",
      progressSummary: null,
      chapters: [],
      isVideoError: false
    });
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onVideoError() {
    this.setData({
      isVideoError: true
    });
  }
});
