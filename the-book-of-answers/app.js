// app.js

function getRuntimeInfo() {
  var deviceInfo = {}
  var windowInfo = {}
  var menuButtonInfo = null

  if (typeof wx.getDeviceInfo === "function") {
    deviceInfo = wx.getDeviceInfo()
  }

  if (typeof wx.getWindowInfo === "function") {
    windowInfo = wx.getWindowInfo()
  }

  if (typeof wx.getMenuButtonBoundingClientRect === "function") {
    try {
      menuButtonInfo = wx.getMenuButtonBoundingClientRect()
    } catch (error) {
      menuButtonInfo = null
    }
  }

  var safeArea = windowInfo.safeArea || null
  var screenWidth = windowInfo.screenWidth || windowInfo.windowWidth || 0
  var screenHeight = windowInfo.screenHeight || windowInfo.windowHeight || 0
  var safeAreaInsets = {
    top: safeArea ? safeArea.top : 0,
    right: safeArea ? Math.max(screenWidth - safeArea.right, 0) : 0,
    bottom: safeArea ? Math.max(screenHeight - safeArea.bottom, 0) : 0,
    left: safeArea ? safeArea.left : 0,
  }

  return {
    deviceInfo: deviceInfo,
    windowInfo: windowInfo,
    menuButtonInfo: menuButtonInfo,
    safeAreaInsets: safeAreaInsets,
    isHarmonyOS: deviceInfo.platform === "ohos" || deviceInfo.platform === "ohos_pc" || deviceInfo.system === "HarmonyOS",
  }
}

App({
  onLaunch: function () {
    this.refreshRuntimeInfo()
  },

  refreshRuntimeInfo: function () {
    var runtimeInfo = getRuntimeInfo()
    this.globalData.runtimeInfo = runtimeInfo
    return runtimeInfo
  },

  globalData: {
    runtimeInfo: null,
  }
})
