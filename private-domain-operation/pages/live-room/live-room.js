const {
  checkLiveAccess,
  fetchLiveRoomPageData
} = require("../../services/api/page-data");
const {
  openPageEntry,
  parseLiveRoomOptions,
  toWebViewer
} = require("../../utils/navigation");

function canUseWebView(url = "") {
  return /^https:\/\//.test(String(url || ""));
}

Page({
  data: {
    liveId: "",
    title: "直播间",
    mode: "live",
    messages: [],
    replayHighlights: [],
    checkingAccess: true,
    accessAllowed: false,
    accessDenied: false,
    accessReason: "",
    targetUrl: "",
    requiredAccess: null
  },

  async onLoad(options = {}) {
    const { liveId, mode, title } = parseLiveRoomOptions(options);

    try {
      const pageData = await fetchLiveRoomPageData(liveId, mode, title);
      this.setData({
        ...pageData,
        liveId,
        mode,
        title: pageData.title || title,
        checkingAccess: true
      });
      await this.checkAccess();
    } catch (error) {
      this.setData({
        checkingAccess: false,
        accessDenied: true,
        accessReason: (error && error.message) || "直播间加载失败"
      });
    }
  },

  async checkAccess() {
    try {
      const decision = await checkLiveAccess(this.data.liveId, this.data.mode);
      if (decision && decision.allowed) {
        this.setData({
          checkingAccess: false,
          accessAllowed: true,
          accessDenied: false,
          targetUrl: decision.targetUrl || ""
        });
        if (canUseWebView(decision.targetUrl)) {
          openPageEntry({
            url: toWebViewer(decision.targetUrl, this.data.title),
            method: "navigateTo"
          }, "打开直播");
        }
        return;
      }

      this.setData({
        checkingAccess: false,
        accessAllowed: false,
        accessDenied: true,
        accessReason: (decision && decision.reason) || "当前账号暂无观看权限",
        requiredAccess: decision && decision.requiredAccess ? decision.requiredAccess : null
      });
    } catch (error) {
      this.setData({
        checkingAccess: false,
        accessDenied: true,
        accessReason: (error && error.message) || "观看权限校验失败"
      });
    }
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onCopyTap() {
    if (!this.data.targetUrl) {
      wx.showToast({
        title: "暂无可复制链接",
        icon: "none"
      });
      return;
    }
    wx.setClipboardData({
      data: this.data.targetUrl
    });
  },

  onAskTap() {
    if (this.data.accessAllowed && this.data.targetUrl) {
      this.onCopyTap();
      return;
    }
    wx.showToast({
      title: this.data.accessReason || "互动能力暂未接入",
      icon: "none"
    });
  }
});
