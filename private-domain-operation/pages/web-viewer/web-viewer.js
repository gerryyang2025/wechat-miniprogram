const { checkLiveAccess } = require("../../services/api/page-data");
const { resolveLiveMode } = require("../../utils/navigation");

function safeDecode(value = "") {
  try {
    return decodeURIComponent(String(value || ""));
  } catch (error) {
    return String(value || "");
  }
}

function isHttpsUrl(value = "") {
  return /^https:\/\//.test(String(value || ""));
}

Page({
  data: {
    title: "直播",
    liveId: "",
    mode: "live",
    url: "",
    valid: false,
    loadFailed: false,
    checkingAccess: true,
    accessReason: ""
  },

  async onLoad(options = {}) {
    const liveId = safeDecode(options.liveId);
    const mode = resolveLiveMode(options.mode || "live");
    this.setData({
      title: safeDecode(options.title) || "直播",
      liveId,
      mode,
      url: "",
      valid: false,
      loadFailed: false,
      checkingAccess: true,
      accessReason: ""
    });

    if (!liveId) {
      this.setData({
        checkingAccess: false,
        accessReason: "缺少直播信息"
      });
      return;
    }

    try {
      const decision = await checkLiveAccess(liveId, mode);
      const targetUrl = decision && decision.allowed ? decision.targetUrl || "" : "";

      this.setData({
        checkingAccess: false,
        url: targetUrl,
        valid: isHttpsUrl(targetUrl),
        accessReason: decision && !decision.allowed ? decision.reason || "当前账号暂无观看权限" : ""
      });
    } catch (error) {
      this.setData({
        checkingAccess: false,
        url: "",
        valid: false,
        accessReason: (error && error.message) || "观看权限校验失败"
      });
    }
  },

  onWebViewError() {
    this.setData({
      loadFailed: true
    });
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onCopyTap() {
    if (!this.data.url) {
      wx.showToast({
        title: "暂无可复制链接",
        icon: "none"
      });
      return;
    }
    wx.setClipboardData({
      data: this.data.url
    });
  }
});
