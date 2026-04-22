// sun_rise.js

var app = getApp()
var answer_data = require("../answers/answer_data.js")
var anim_data = require("./anim_data.js")
var anim_sun_rise = require("./anim_sun_rise.js")
var anim_tutorial = require("./anim_tutorial.js")
var anim_content = require("./anim_content.js")
var anim_sun_cloud = require("./anim_sun_cloud.js")
// var anim_exp = require("./anim_exp.js")
var anim_cloud_move = require("./anim_cloud_move.js")
var answerStore = require("../../utils/answer_store.js")
var resultInteractionBehavior = require("../../behaviors/result_interaction.js")
var shareImage = require("../../utils/share_image.js")


var State = {
  toturial: "toturial",
  pressing: "pressing",
  waiting: "waiting",
  saving: "saving"
}

var ALBUM_SCOPE = "scope.writePhotosAlbum"
var POSTER_WIDTH = 750
var POSTER_HEIGHT = 1334
var POSTER_CONTENT_Y = 299
var POSTER_SUB_CONTENT_Y = 508
var POSTER_BG = "../../assets/sun_rise/save_bg.png"
var POSTER_ASSET_TIMEOUT = 8000
var POSTER_CONTENT_MAX_WIDTH = 560
var POSTER_SUB_CONTENT_MAX_WIDTH = 520
var POSTER_CONTENT_LINE_HEIGHT = 76
var POSTER_SUB_CONTENT_LINE_HEIGHT = 40
var POSTER_MAX_LINES = 2
var ANSWER_SOURCE = "sun_rise"
var ANSWERS_PAGE_PATH = "/pages/answers/answers"
var SUN_RISE_PAGE_PATH = "/pages/sun_rise/sun_rise"
var SUN_RISE_SHARE_IMAGE = "/assets/sun_rise/save_bg.png"
var AUDIO_SRC = "/assets/audio_001.mp3"
var AUDIO_START_TIME = 5
var SHARE_SCENE_APP_MESSAGE = "appMessage"
var SHARE_SCENE_TIMELINE = "timeline"
var SHARE_QUERY_FROM_SHARE = "fromShare"
var SHARE_QUERY_MODE = "mode"
var SHARE_QUERY_SCENE = "shareScene"
var DESIGN_WIDTH = 750
var MOUNTAIN_HEIGHT = 422
var PRESS_MOVE_TOLERANCE = 16
var PRESS_CUE_HOLD_DELAY = 120
var SHORT_PRESS_FEEDBACK_THRESHOLD = 320
var TAP_SUPPRESSION_DURATION = 450

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function scaleByWidth(windowWidth, designSize) {
  return windowWidth * designSize / DESIGN_WIDTH
}

function buildQueryString(params) {
  return Object.keys(params)
    .filter(function (key) {
      return params[key] !== undefined && params[key] !== null && params[key] !== ""
    })
    .map(function (key) {
      return encodeURIComponent(key) + "=" + encodeURIComponent(String(params[key]))
    })
    .join("&")
}

function buildAmbientAudioActionState(enabled) {
  return {
    ambientAudioEnabled: !!enabled,
    ambientAudioActionLabel: "环境音开关",
    ambientAudioActionDesc: enabled ? "环境音已开启，点一下关闭" : "当前默认静音，点一下开启环境音",
    ambientAudioActionMeta: enabled ? "已开" : "已关",
  }
}

Page({
  behaviors: [resultInteractionBehavior],

  /**
   * 页面的初始数据
   */
  data: {
    state: "",
    isShowTutorialTxt: true,
    content: "",
    subContent: "",
    exp: "",
    tutorial_txt: "",
    isThx: true,
    /* 动画 */
    _anim_sun_rise: "",
    _anim_tutorial_txt_1: "",
    _anim_tutorial_txt_2: "",
    _anim_tutorial_txt_3: "",
    _anim_circle: "",
    _anim_circle_line: "",
    _anim_cloud_1: "",
    _anim_cloud_2: "",
    _anim_cloud_3: "",
    _anim_cloud_4: "",
    _anim_content: "",
    _anim_sub_content: "",
    // _anim_exp: "",

    _tran_exp_show: "",
    thanksStyle: "",
    resultActionStyle: "",
    sunImageStyle: "",
    cloudOneStyle: "",
    cloudTwoStyle: "",
    cloudThreeStyle: "",
    cloudFourStyle: "",
    mountainTouchLayerStyle: "",
    manStyle: "",
    manShadowStyle: "",
    manHitAreaStyle: "",
    birdOneStyle: "",
    birdTwoStyle: "",
    birdThreeStyle: "",
    contentPrimaryStyle: "",
    contentSecondaryStyle: "",
    expBubbleStyle: "",
    tutorialStyle: "",
    circleContainerStyle: "",
    circleLineContainerStyle: "",
    repeatHintStyle: "",
    repeatHintText: "",
    repeatHintClassName: "repeat-hint",
    showRepeatHint: false,
    pressCueStyle: "",
    pressCueVisible: false,
    pressCueText: "",
    pressCueClassName: "press-cue",
    pressCueMeterFillClassName: "press-cue-meter-fill",
    pressCueMeterStyle: "",
    recordPanelStyle: "",
    hasAnswer: false,
    canSavePoster: false,
    resultActionThemeClass: "result-action-bar--sunrise",
    resultActionMenuThemeClass: "result-action-menu--sunrise",
    resultPanelThemeClass: "result-theme--sunrise",
    showAmbientAudioAction: true,
    detailPanelStyle: "",
    posterErrorVisible: false,
    posterErrorTitle: "",
    posterErrorMessage: "",
    posterErrorSupportText: "",
    posterErrorRetryText: "重新尝试",
    ambientAudioEnabled: false,
    ambientAudioActionLabel: "环境音开关",
    ambientAudioActionDesc: "当前默认静音，点一下开启环境音",
    ambientAudioActionMeta: "已关",
  },

  touchStartTime: 0,
  touchEndTime: 0,
  duration: 0,
  lastIndex: -1,
  expShowable: false,
  isExpShow: false,
  tapCount: [false, false],
  isScreenshotDrew: false,
  posterCanvas: null,
  posterCtx: null,
  shareCanvas: null,
  shareCtx: null,
  posterAssetCache: null,
  cloudFloatIntervals: null,
  shouldReinitializeOnShow: false,
  isPageReady: false,
  currentAnswerRecord: null,
  lastPosterTempFilePath: "",
  posterRetryAction: "",
  shareImageCache: null,
  shareImageTask: null,
  audioCtx: null,
  shouldResumeAudioOnShow: false,
  longPressDetectTimeout: null,
  pressCueHoldDelayTimeout: null,
  pressCueResetTimeout: null,
  repeatHintResetTimeout: null,
  pressTouchIdentifier: null,
  pressStartPoint: null,
  isTrackingMountainPress: false,
  suppressNextMountainTap: false,
  mountainTapSuppressionTimeout: null,
  audioInterruptionBeginHandler: null,
  audioInterruptionEndHandler: null,
  shouldResumeAudioAfterInterruption: false,
  isPageHidden: false,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (this.handleShareEntryRedirect(options)) {
      return
    }

    this.answer_data = new answer_data()
    this.anim_data = new anim_data()
    this.anim_sun_rise = new anim_sun_rise()
    this.anim_tutorial = new anim_tutorial()
    this.anim_content = new anim_content()
    this.anim_sun_cloud = new anim_sun_cloud()
    // this.anim_exp = new anim_exp()
    this.anim_cloud_move = new anim_cloud_move()
    this.posterAssetCache = {}
    this.cloudFloatIntervals = []
    this.shareImageCache = {}
    this.shareImageTask = Promise.resolve()
    this.initBackgroundAudio()
    this.initLayoutInfo()
    this.showShareOptions()
    this.refreshAnswerRecords()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    // 设置content默认内容
    this.isPageReady = true
    this.isPageHidden = false
    this.initial()
    this.playBackgroundAudio()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.isPageHidden = false
    if (this.isPageReady && this.shouldReinitializeOnShow) {
      this.shouldReinitializeOnShow = false
      this.initial()
    } else if (this.isPageReady && this.data.state === State.waiting && !this.data.isShowTutorialTxt) {
      this.startCloudFloatAnimations()
    }
    if (this.shouldResumeAudioOnShow) {
      this.playBackgroundAudio()
    }
    this.refreshAnswerRecords()
    if (this.isPageReady && !this.data.isShowTutorialTxt && this.data.state == State.waiting) {
      this.syncRepeatHint()
    } else {
      this.hideRepeatHint()
      this.hidePressCue()
    }
  },

  onResize: function () {
    this.initLayoutInfo()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.isPageHidden = true
    this.clearAnimationTimers()
    this.resetMountainTouchTracking()
    this.clearMountainTapSuppression()
    this.hideRepeatHint()
    this.hidePressCue()
    this.pauseBackgroundAudio()
    this.setData({
      actionMenuVisible: false,
      recordPanelVisible: false,
      detailPanelVisible: false,
      posterErrorVisible: false,
    })
    if (this.data.state !== State.waiting || this.data.isShowTutorialTxt) {
      this.shouldReinitializeOnShow = true
    }
    wx.hideLoading()
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.isPageHidden = true
    this.clearAnimationTimers()
    this.resetMountainTouchTracking()
    this.clearMountainTapSuppression()
    this.hideRepeatHint()
    this.hidePressCue()
    this.destroyBackgroundAudio()
    this.shareCanvas = null
    this.shareCtx = null
    this.shareImageCache = null
    this.shareImageTask = null
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    var shareData = this.buildShareData()
    if (this.getCurrentAnswer()) {
      shareData.promise = this.buildDynamicShareResult(SHARE_SCENE_APP_MESSAGE)
    }
    return shareData
  },

  onShareTimeline: function () {
    var shareData = this.buildTimelineShareData()
    if (this.getCurrentAnswer()) {
      shareData.promise = this.buildDynamicShareResult(SHARE_SCENE_TIMELINE)
    }
    return shareData
  },

  initLayoutInfo: function () {
    var runtimeInfo = app.refreshRuntimeInfo ? app.refreshRuntimeInfo() : app.globalData.runtimeInfo || {}
    var windowInfo = runtimeInfo.windowInfo || {}
    var topInset = runtimeInfo.safeAreaInsets ? runtimeInfo.safeAreaInsets.top : 0
    var leftInset = runtimeInfo.safeAreaInsets ? runtimeInfo.safeAreaInsets.left : 0
    var rightInset = runtimeInfo.safeAreaInsets ? runtimeInfo.safeAreaInsets.right : 0
    var bottomInset = runtimeInfo.safeAreaInsets ? runtimeInfo.safeAreaInsets.bottom : 0
    var windowWidth = windowInfo.windowWidth || 375
    var windowHeight = windowInfo.windowHeight || 667
    var contentWidth = Math.max(windowWidth - leftInset - rightInset, 240)
    var compact = windowHeight < 720
    var contentTop = clamp(topInset + windowHeight * (compact ? 0.22 : 0.27), topInset + 110, topInset + 220)
    var subContentTop = clamp(contentTop + windowHeight * (compact ? 0.17 : 0.19), contentTop + 96, contentTop + 180)
    var tutorialTop = clamp(topInset + windowHeight * (compact ? 0.11 : 0.14), topInset + 64, topInset + 132)
    var bubbleBottom = bottomInset + clamp(windowHeight * (compact ? 0.18 : 0.22), 120, 188)
    var bubbleRight = rightInset + clamp(windowWidth * 0.12, 20, 56)
    var actionLeft = Math.round(leftInset + clamp(windowWidth * 0.03, 12, 28))
    var actionWidth = clamp(contentWidth - 32, 236, 360)
    var sunHeight = clamp(windowHeight * 0.54, 320, 420)
    var circleBottom = bottomInset + clamp(windowHeight * 0.1, 70, 120)
    var circleLineBottom = Math.max(circleBottom - 10, bottomInset + 60)
    var mountainTouchHeight = Math.round(scaleByWidth(windowWidth, MOUNTAIN_HEIGHT))
    var manBaseCenterX = 491 + 13 / 2
    var manBaseWidth = 22
    var manBaseHeight = 52
    var manShadowBaseCenterX = 489 + 37 / 2
    var manShadowBaseWidth = 52
    var manShadowBaseHeight = 36
    var manBottom = Math.round(bottomInset + scaleByWidth(windowWidth, 150))
    var manShadowBottom = Math.round(bottomInset + scaleByWidth(windowWidth, 133))
    var manWidth = Math.round(clamp(scaleByWidth(windowWidth, manBaseWidth), 10, 28))
    var manHeight = Math.round(clamp(scaleByWidth(windowWidth, manBaseHeight), 24, 66))
    var manShadowWidth = Math.round(clamp(scaleByWidth(windowWidth, manShadowBaseWidth), 22, 72))
    var manShadowHeight = Math.round(clamp(scaleByWidth(windowWidth, manShadowBaseHeight), 14, 50))
    var manLeft = Math.round(scaleByWidth(windowWidth, manBaseCenterX) - manWidth / 2)
    var manShadowLeft = Math.round(scaleByWidth(windowWidth, manShadowBaseCenterX) - manShadowWidth / 2)
    var manHitWidth = Math.round(clamp(windowWidth * 0.14, 42, 112))
    var manHitHeight = Math.round(clamp(mountainTouchHeight * 0.26, 56, 128))
    var manHitLeft = Math.round(scaleByWidth(windowWidth, manBaseCenterX) - manHitWidth * 0.5)
    var manHitBottom = Math.round(manShadowBottom - manHitHeight * 0.2)
    var contentPrimaryPaddingLeft = Math.round(leftInset + clamp(contentWidth * 0.12, 34, 60))
    var contentPrimaryPaddingRight = Math.round(rightInset + clamp(contentWidth * 0.12, 34, 60))
    var contentSecondaryPaddingLeft = Math.round(leftInset + clamp(contentWidth * 0.18, 54, 80))
    var contentSecondaryPaddingRight = Math.round(rightInset + clamp(contentWidth * 0.18, 54, 80))
    var expBubbleMaxWidth = clamp(contentWidth * 0.58, 180, 260)
    var interactionHintWidth = Math.round(clamp(contentWidth * 0.44, 190, 260))
    var interactionHintBottom = Math.round(bottomInset + clamp(windowHeight * 0.145, 98, 148))
    var pressCueBottom = Math.round(bottomInset + clamp(windowHeight * 0.148, 102, 154))

    this.setData({
      thanksStyle: bottomInset ? "bottom: calc(10rpx + " + bottomInset + "px);" : "",
      resultActionStyle: "left: " + actionLeft + "px; bottom: " + (bottomInset + (compact ? 28 : 34)) + "px; max-width: " + actionWidth + "px;",
      sunImageStyle: "max-height: " + Math.round(sunHeight) + "px;",
      cloudOneStyle: "max-width: " + clamp(windowWidth * 0.17, 52, 72) + "px; max-height: " + clamp(windowWidth * 0.095, 28, 40) + "px; top: " + Math.round(clamp(topInset + windowHeight * 0.17, topInset + 84, topInset + 128)) + "px; right: " + Math.round(clamp(windowWidth * 0.045, 14, 22)) + "px;",
      cloudTwoStyle: "max-width: " + clamp(windowWidth * 0.17, 52, 72) + "px; max-height: " + clamp(windowWidth * 0.095, 28, 40) + "px; top: " + Math.round(clamp(topInset + windowHeight * 0.29, topInset + 142, topInset + 212)) + "px; left: " + Math.round(clamp(windowWidth * 0.045, 14, 22)) + "px;",
      cloudThreeStyle: "max-width: " + clamp(windowWidth * 0.14, 44, 62) + "px; max-height: " + clamp(windowWidth * 0.07, 20, 30) + "px; right: " + Math.round(clamp(windowWidth * 0.13, 36, 60)) + "px; bottom: " + Math.round(bottomInset + clamp(windowHeight * 0.31, 184, 236)) + "px;",
      cloudFourStyle: "max-width: " + clamp(windowWidth * 0.1, 30, 45) + "px; max-height: " + clamp(windowWidth * 0.04, 10, 18) + "px; left: " + Math.round(clamp(windowWidth * 0.07, 20, 32)) + "px; bottom: " + Math.round(bottomInset + clamp(windowHeight * 0.26, 146, 192)) + "px;",
      mountainTouchLayerStyle: "height: " + mountainTouchHeight + "px;",
      manStyle: "width: " + manWidth + "px; height: " + manHeight + "px; left: " + manLeft + "px; bottom: " + manBottom + "px;",
      manShadowStyle: "width: " + manShadowWidth + "px; height: " + manShadowHeight + "px; left: " + manShadowLeft + "px; bottom: " + manShadowBottom + "px;",
      manHitAreaStyle: "left: " + manHitLeft + "px; bottom: " + manHitBottom + "px; width: " + manHitWidth + "px; height: " + manHitHeight + "px;",
      birdOneStyle: "max-width: " + clamp(windowWidth * 0.033, 10, 15) + "px; max-height: " + clamp(windowWidth * 0.017, 4, 8) + "px; right: " + Math.round(clamp(windowWidth * 0.11, 18, 28)) + "px; bottom: " + Math.round(bottomInset + clamp(windowHeight * 0.145, 86, 114)) + "px;",
      birdTwoStyle: "max-width: " + clamp(windowWidth * 0.026, 8, 12) + "px; max-height: " + clamp(windowWidth * 0.013, 3, 6) + "px; left: " + Math.round(windowWidth * 0.322) + "px; bottom: " + Math.round(bottomInset + clamp(windowHeight * 0.07, 40, 58)) + "px;",
      birdThreeStyle: "max-width: " + clamp(windowWidth * 0.018, 5, 8) + "px; max-height: " + clamp(windowWidth * 0.008, 2, 4) + "px; left: " + Math.round(windowWidth * 0.262) + "px; bottom: " + Math.round(bottomInset + clamp(windowHeight * 0.06, 34, 50)) + "px;",
      contentPrimaryStyle: "top: " + Math.round(contentTop) + "px; padding: 0 " + contentPrimaryPaddingRight + "px 0 " + contentPrimaryPaddingLeft + "px; font-size: " + (compact ? 28 : 32) + "px;",
      contentSecondaryStyle: "top: " + Math.round(subContentTop) + "px; padding: 0 " + contentSecondaryPaddingRight + "px 0 " + contentSecondaryPaddingLeft + "px; font-size: " + (compact ? 14 : 16) + "px;",
      expBubbleStyle: "right: " + Math.round(bubbleRight) + "px; bottom: " + Math.round(bubbleBottom) + "px; max-width: " + expBubbleMaxWidth + "px;",
      tutorialStyle: "top: " + Math.round(tutorialTop) + "px;",
      circleContainerStyle: "bottom: " + Math.round(circleBottom) + "px;",
      circleLineContainerStyle: "bottom: " + Math.round(circleLineBottom) + "px;",
      repeatHintStyle: "bottom: " + interactionHintBottom + "px; max-width: " + interactionHintWidth + "px;",
      pressCueStyle: "bottom: " + pressCueBottom + "px; width: " + interactionHintWidth + "px;",
      recordPanelStyle: "padding-bottom: " + Math.max(bottomInset, 16) + "px;",
      detailPanelStyle: "padding-bottom: " + Math.max(bottomInset, 20) + "px;",
    })
  },

  clearAnimationTimers: function () {
    clearInterval(this.circleInterval)
    this.clearPendingLongPressDetection()
    clearTimeout(this.pressCueHoldDelayTimeout)
    clearTimeout(this.pressCueResetTimeout)
    clearTimeout(this.repeatHintResetTimeout)
    clearTimeout(this.timeout_press_over)
    clearTimeout(this.tutorialEnterTimeout)
    clearTimeout(this.tutorialDoneTimeout)
    clearTimeout(this.sunRiseStartTimeout)
    clearTimeout(this.answerRevealTimeout)
    clearTimeout(this.screenshotResetTimeout)
    this.clearMountainTapSuppression()

    if (this.cloudFloatIntervals) {
      this.cloudFloatIntervals.forEach(function (intervalId) {
        clearInterval(intervalId)
      })
      this.cloudFloatIntervals = []
    }
  },

  getDefaultRepeatHintText: function () {
    return "按住山影，再问一次"
  },

  getPressCueHoldingText: function () {
    return "按住中..."
  },

  getPressCueShortHintText: function () {
    return "再多按一会儿"
  },

  clearPendingPressCueHold: function () {
    clearTimeout(this.pressCueHoldDelayTimeout)
    this.pressCueHoldDelayTimeout = null
  },

  hidePressCue: function () {
    this.clearPendingPressCueHold()
    clearTimeout(this.pressCueResetTimeout)
    this.pressCueResetTimeout = null
    this.setData({
      pressCueVisible: false,
      pressCueText: "",
      pressCueClassName: "press-cue",
      pressCueMeterFillClassName: "press-cue-meter-fill",
      pressCueMeterStyle: "",
    })
  },

  setRepeatHintState: function (text, strong, autoResetDuration) {
    clearTimeout(this.repeatHintResetTimeout)
    this.repeatHintResetTimeout = null

    var shouldShow = !this.data.isShowTutorialTxt && this.data.state == State.waiting && this.data.hasAnswer && !this.data.pressCueVisible
    this.setData({
      showRepeatHint: shouldShow,
      repeatHintText: text || this.getDefaultRepeatHintText(),
      repeatHintClassName: strong ? "repeat-hint repeat-hint--strong" : "repeat-hint",
    })

    if (autoResetDuration) {
      this.repeatHintResetTimeout = setTimeout(function () {
        this.syncRepeatHint()
      }.bind(this), autoResetDuration)
    }
  },

  syncRepeatHint: function () {
    this.setRepeatHintState(this.getDefaultRepeatHintText(), false, 0)
  },

  hideRepeatHint: function () {
    clearTimeout(this.repeatHintResetTimeout)
    this.repeatHintResetTimeout = null
    this.setData({
      showRepeatHint: false,
      repeatHintText: this.getDefaultRepeatHintText(),
      repeatHintClassName: "repeat-hint",
    })
  },

  showPressCue: function (mode, meterDuration, autoHideDelay) {
    clearTimeout(this.pressCueResetTimeout)
    this.pressCueResetTimeout = null

    var cueText = this.getPressCueHoldingText()
    var cueClassName = "press-cue"
    var meterFillClassName = "press-cue-meter-fill"
    var meterStyle = ""

    if (mode === "warning") {
      cueText = this.getPressCueShortHintText()
      cueClassName += " press-cue--warning"
      meterFillClassName += " press-cue-meter-fill--warning"
    } else if (mode === "revealing") {
      cueText = "正在揭晓..."
      cueClassName += " press-cue--revealing"
      meterFillClassName += " press-cue-meter-fill--full"
    } else {
      meterFillClassName += " press-cue-meter-fill--animating"
      meterStyle = "animation-duration: " + Math.max(meterDuration || this.anim_data.pressDuration, 240) + "ms;"
    }

    this.setData({
      showRepeatHint: false,
      pressCueVisible: true,
      pressCueText: cueText,
      pressCueClassName: cueClassName,
      pressCueMeterFillClassName: meterFillClassName,
      pressCueMeterStyle: meterStyle,
    })

    if (autoHideDelay) {
      this.pressCueResetTimeout = setTimeout(function () {
        this.hidePressCue()
        this.syncRepeatHint()
      }.bind(this), autoHideDelay)
    }
  },

  queuePressCueHolding: function () {
    this.clearPendingPressCueHold()
    this.pressCueHoldDelayTimeout = setTimeout(function () {
      if (!this.isTrackingMountainPress || this.data.state != State.waiting) {
        return
      }
      this.showPressCue("holding", Math.max(this.anim_data.pressDuration - PRESS_CUE_HOLD_DELAY, 240), 0)
    }.bind(this), PRESS_CUE_HOLD_DELAY)
  },

  initBackgroundAudio: function () {
    if (this.audioCtx || typeof wx.createInnerAudioContext !== "function") {
      return
    }

    if (typeof wx.setInnerAudioOption === "function") {
      wx.setInnerAudioOption({
        obeyMuteSwitch: true,
      })
    }

    this.audioCtx = wx.createInnerAudioContext()
    this.audioCtx.src = AUDIO_SRC
    this.audioCtx.startTime = AUDIO_START_TIME
    this.audioCtx.loop = true
    if (typeof this.audioCtx.obeyMuteSwitch === "boolean") {
      this.audioCtx.obeyMuteSwitch = true
    }
    this.audioCtx.onPlay(function () {
      this.shouldResumeAudioOnShow = !!this.data.ambientAudioEnabled
    }.bind(this))
    this.audioCtx.onError(function (error) {
      console.error("sunrise background audio failed", error)
    })
    this.registerAudioInterruptionListeners()
  },

  registerAudioInterruptionListeners: function () {
    if (this.audioInterruptionBeginHandler || typeof wx.onAudioInterruptionBegin !== "function" || typeof wx.onAudioInterruptionEnd !== "function") {
      return
    }

    this.audioInterruptionBeginHandler = function () {
      this.shouldResumeAudioAfterInterruption = !!(this.audioCtx && !this.audioCtx.paused && this.data.ambientAudioEnabled)
      if (this.shouldResumeAudioAfterInterruption && this.audioCtx) {
        this.audioCtx.pause()
      }
    }.bind(this)

    this.audioInterruptionEndHandler = function () {
      var shouldResume = this.shouldResumeAudioAfterInterruption
      this.shouldResumeAudioAfterInterruption = false
      if (shouldResume && !this.isPageHidden) {
        this.playBackgroundAudio()
      }
    }.bind(this)

    wx.onAudioInterruptionBegin(this.audioInterruptionBeginHandler)
    wx.onAudioInterruptionEnd(this.audioInterruptionEndHandler)
  },

  unregisterAudioInterruptionListeners: function () {
    if (this.audioInterruptionBeginHandler && typeof wx.offAudioInterruptionBegin === "function") {
      wx.offAudioInterruptionBegin(this.audioInterruptionBeginHandler)
    }
    if (this.audioInterruptionEndHandler && typeof wx.offAudioInterruptionEnd === "function") {
      wx.offAudioInterruptionEnd(this.audioInterruptionEndHandler)
    }

    this.audioInterruptionBeginHandler = null
    this.audioInterruptionEndHandler = null
    this.shouldResumeAudioAfterInterruption = false
  },

  playBackgroundAudio: function () {
    if (!this.audioCtx || !this.data.ambientAudioEnabled) {
      return
    }

    this.shouldResumeAudioOnShow = true
    this.audioCtx.play()
  },

  pauseBackgroundAudio: function () {
    if (!this.audioCtx) {
      return
    }

    this.shouldResumeAudioOnShow = !!this.data.ambientAudioEnabled
    this.audioCtx.pause()
  },

  ensureBackgroundAudioStarted: function () {
    if (!this.data.ambientAudioEnabled) {
      return
    }

    if (!this.audioCtx) {
      this.initBackgroundAudio()
    }

    this.playBackgroundAudio()
  },

  setAmbientAudioEnabled: function (enabled) {
    var nextEnabled = !!enabled
    this.shouldResumeAudioOnShow = nextEnabled
    this.shouldResumeAudioAfterInterruption = false
    this.setData(buildAmbientAudioActionState(nextEnabled))

    if (nextEnabled) {
      this.ensureBackgroundAudioStarted()
      wx.showToast({
        title: "环境音已开启",
        icon: "none",
        duration: 1200,
      })
      return
    }

    this.pauseBackgroundAudio()
    wx.showToast({
      title: "环境音已关闭",
      icon: "none",
      duration: 1200,
    })
  },

  onTapToggleAmbientAudioAction: function () {
    this.setAmbientAudioEnabled(!this.data.ambientAudioEnabled)
  },

  destroyBackgroundAudio: function () {
    this.unregisterAudioInterruptionListeners()
    if (!this.audioCtx) {
      return
    }

    this.shouldResumeAudioOnShow = false
    this.audioCtx.destroy()
    this.audioCtx = null
  },

  startCloudFloatAnimations: function () {
    if (!this.cloudFloatIntervals) {
      this.cloudFloatIntervals = []
    }

    this.cloudFloatIntervals.forEach(function (intervalId) {
      clearInterval(intervalId)
    })
    this.cloudFloatIntervals = []

    this.setData({
      _anim_cloud_1: this.anim_cloud_move.move(this.anim_data.cloudFloat, 0).export(),
      _anim_cloud_2: this.anim_cloud_move.move(this.anim_data.cloudFloat, 0).export(),
    })

    this.cloudFloatIntervals.push(setInterval(function () {
      this.setData({
        _anim_cloud_1: this.anim_cloud_move.move(this.anim_data.cloudFloat, 0).export(),
      })
    }.bind(this), this.anim_data.cloudFloat * (3.2 + Math.random())))

    this.cloudFloatIntervals.push(setInterval(function () {
      this.setData({
        _anim_cloud_2: this.anim_cloud_move.move(this.anim_data.cloudFloat, 0).export(),
      })
    }.bind(this), this.anim_data.cloudFloat * (3.2 + Math.random())))
  },

  /**
   * 设置默认文本、初始状态，教程动画
   */
  initial: function () {
    this.clearAnimationTimers()
    this.resetMountainTouchTracking()
    this.clearMountainTapSuppression()
    this.hideRepeatHint()
    this.hidePressCue()
    this.currentAnswerRecord = null
    this.lastPosterTempFilePath = ""
    this.resetShareImageCache()

    this.setData({
      content: this.answer_data.getDefaultContent(),
      subContent: this.answer_data.getDefaultSubContent(),
      exp: this.answer_data.getDefaultExp(),
      tutorial_txt: this.answer_data.getTutorialTxt(),
      state: State.toturial,
      _anim_sun_rise: this.anim_sun_rise.initial().export(),
      _anim_tutorial_txt_1: this.anim_tutorial.initialTxt().export(),
      _anim_tutorial_txt_2: this.anim_tutorial.initialTxt().export(),
      _anim_tutorial_txt_3: this.anim_tutorial.initialTxt().export(),
      _anim_circle: this.anim_tutorial.initialCircle().export(),
      _anim_circle_line: this.anim_tutorial.initialCircleLine().export(),
      _anim_cloud_1: this.anim_tutorial.initialCloud(true).export(),
      _anim_cloud_2: this.anim_tutorial.initialCloud(false).export(),
      _anim_cloud_3: this.anim_sun_cloud.initial(true).export(),
      _anim_cloud_4: this.anim_sun_cloud.initial(false).export(),
      // _anim_exp: this.anim_exp.initial().export()
      _tran_exp_show: "",
      showRepeatHint: false,
      repeatHintText: this.getDefaultRepeatHintText(),
      repeatHintClassName: "repeat-hint",
      pressCueVisible: false,
      pressCueText: "",
      pressCueClassName: "press-cue",
      pressCueMeterFillClassName: "press-cue-meter-fill",
      pressCueMeterStyle: "",
      hasAnswer: false,
      canSavePoster: false,
      isCurrentFavorite: false,
      detailPanelVisible: false,
      posterErrorVisible: false,
      posterErrorSupportText: "",
    })

    this.tutorialEnterTimeout = setTimeout(function () {
      this.setData({
        _anim_tutorial_txt_1: this.anim_tutorial.moveDown(this.anim_data.tutorialTime, 0).export(),
        _anim_tutorial_txt_2: this.anim_tutorial.moveDown(this.anim_data.tutorialTime,this.anim_data.tutorialDelay).export(),
        _anim_tutorial_txt_3: this.anim_tutorial.moveDown(this.anim_data.tutorialTime, this.anim_data.tutorialDelay * 2).export(),
        _anim_circle: this.anim_tutorial.circleFadeIn(this.anim_data.circleFadeIn, this.anim_data.tutorialDuration()).export(),
        _anim_cloud_1: this.anim_tutorial.moveIn(this.anim_data.tutorialDuration(), 0).export(),
        _anim_cloud_2: this.anim_tutorial.moveIn(this.anim_data.tutorialDuration(), 0).export(),
      })
    }.bind(this), this.anim_data.tutorialDelay / this.anim_data.tutorialPara)

    // 圆圈的扩大动画，需要撤销
    this.circleInterval = setInterval(function () {
      this.setData({
        _anim_circle_line: this.anim_tutorial.circleLine(this.anim_data.circleLineDuration).export(),
      })
    }.bind(this), this.anim_data.circleLineInterval)

    this.tutorialDoneTimeout = setTimeout(function () {
      this.setData({
        state: State.waiting,
      })
      this.startCloudFloatAnimations()
    }.bind(this), this.anim_data.tutorialDuration())
  },

  /**
   * ---------------------------  山点击功能，主要功能  ---------------------------
   */

  getTrackedTouchPoint: function (e) {
    var groups = []
    if (e && e.touches && e.touches.length) {
      groups.push(e.touches)
    }
    if (e && e.changedTouches && e.changedTouches.length) {
      groups.push(e.changedTouches)
    }

    var fallbackPoint = null
    for (var groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
      var group = groups[groupIndex]
      for (var touchIndex = 0; touchIndex < group.length; touchIndex += 1) {
        var touch = group[touchIndex]
        if (!fallbackPoint) {
          fallbackPoint = touch
        }
        if (this.pressTouchIdentifier === null || touch.identifier === this.pressTouchIdentifier) {
          return touch
        }
      }
    }

    return fallbackPoint
  },

  clearPendingLongPressDetection: function () {
    clearTimeout(this.longPressDetectTimeout)
    this.longPressDetectTimeout = null
  },

  queueMountainPressSequence: function (touchStartTime, delay, requireActiveTracking) {
    this.clearPendingLongPressDetection()
    this.longPressDetectTimeout = setTimeout(function () {
      if (requireActiveTracking && !this.isTrackingMountainPress) {
        return
      }
      this.beginMountainPressSequence(touchStartTime)
    }.bind(this), Math.max(delay, 0))
  },

  clearMountainTapSuppression: function () {
    clearTimeout(this.mountainTapSuppressionTimeout)
    this.mountainTapSuppressionTimeout = null
    this.suppressNextMountainTap = false
  },

  scheduleMountainTapSuppression: function () {
    this.clearMountainTapSuppression()
    this.suppressNextMountainTap = true
    this.mountainTapSuppressionTimeout = setTimeout(function () {
      this.suppressNextMountainTap = false
      this.mountainTapSuppressionTimeout = null
    }.bind(this), TAP_SUPPRESSION_DURATION)
  },

  resetMountainTouchTracking: function () {
    this.pressTouchIdentifier = null
    this.pressStartPoint = null
    this.isTrackingMountainPress = false
    this.touchStartTime = 0
  },

  beginMountainPressSequence: function (touchStartTime) {
    if (this.data.state != State.waiting)
    {
      return
    }

    this.clearPendingLongPressDetection()
    this.clearPendingPressCueHold()
    if (typeof touchStartTime === "number") {
      this.touchStartTime = touchStartTime
    }

    this.ensureBackgroundAudioStarted()
    this.scheduleMountainTapSuppression()
    this.hideRepeatHint()
    this.showPressCue("revealing", 0, 720)

    this.isScreenshotDrew = false    // 屏幕截图设置为需要重新画
    this.lastPosterTempFilePath = ""
    this.resetShareImageCache()

    var time = this.anim_data.pressDuration + this.anim_data.afterPress

    clearInterval(this.circleInterval)

    this.setData({
      content: "",
      subContent: "",
      exp: "",
      state: State.pressing,
      isShowTutorialTxt: false,
      _anim_sun_rise: this.anim_sun_rise.initial().export(),
      _anim_cloud_3: this.anim_sun_cloud.initial(true).export(),
      _anim_cloud_4: this.anim_sun_cloud.initial(false).export(),

      _anim_content: this.anim_content.initialTxt().export(),
      _anim_sub_content: this.anim_content.initialSubTxt().export(),
      // _anim_exp: this.anim_exp.initial().export(),
      _tran_exp_show: "",
      showRepeatHint: false,
      hasAnswer: false,
      canSavePoster: false,
      detailPanelVisible: false,
      posterErrorVisible: false,
    })

    this.expShowable = false
    this.isExpShow = false

    this.sunRiseStartTimeout = setTimeout(function () {
      this.setData({
        _anim_sun_rise: this.anim_sun_rise.moveUp(time).export(),
        _anim_cloud_3: this.anim_sun_cloud.move(time).export(),
        _anim_cloud_4: this.anim_sun_cloud.move(time).export(),
      })
    }.bind(this), 50)

    // 设置计时器，按压结束后一系列动作
    this.timeout_press_over = setTimeout(this.pressSuccess.bind(this), time)
  },

  interruptMountainPressSequence: function (eventTimeStamp) {
    if (this.data.state == State.pressing)
    {
      this.touchEndTime = eventTimeStamp
      this.duration = this.touchEndTime - this.touchStartTime

      if (this.duration < this.anim_data.pressDuration) {
        // 清除计时
        clearTimeout(this.timeout_press_over)

        this.setData({
          state: State.waiting,
          _anim_sun_rise: this.anim_sun_rise.interrupt(this.duration).export(),
          _anim_cloud_3: this.anim_sun_cloud.interrupt(this.duration, true).export(),
          _anim_cloud_4: this.anim_sun_cloud.interrupt(this.duration, false).export(),
        })

        this.expShowable = false
        this.clearMountainTapSuppression()
      }
    }
  },

  onMountainTouchStart: function (e) {
    if (this.data.state != State.waiting)
    {
      return
    }

    if (e.touches && e.touches.length > 1) {
      this.clearPendingLongPressDetection()
      this.resetMountainTouchTracking()
      return
    }

    var touchPoint = this.getTrackedTouchPoint(e)
    this.clearPendingLongPressDetection()
    this.clearMountainTapSuppression()
    this.clearPendingPressCueHold()
    this.touchStartTime = e.timeStamp
    this.isTrackingMountainPress = true
    this.pressTouchIdentifier = touchPoint && typeof touchPoint.identifier === "number" ? touchPoint.identifier : null
    this.pressStartPoint = touchPoint ? {
      pageX: touchPoint.pageX,
      pageY: touchPoint.pageY,
    } : null

    this.hideRepeatHint()
    this.queuePressCueHolding()
    this.queueMountainPressSequence(this.touchStartTime, this.anim_data.pressDuration, true)
  },

  onMountainTouchMove: function (e) {
    if (!this.longPressDetectTimeout || !this.pressStartPoint) {
      return
    }

    if (e.touches && e.touches.length > 1) {
      this.clearPendingLongPressDetection()
      this.clearPendingPressCueHold()
      this.hidePressCue()
      this.resetMountainTouchTracking()
      return
    }

    var touchPoint = this.getTrackedTouchPoint(e)
    if (!touchPoint) {
      return
    }

    var deltaX = touchPoint.pageX - this.pressStartPoint.pageX
    var deltaY = touchPoint.pageY - this.pressStartPoint.pageY
    if (Math.sqrt(deltaX * deltaX + deltaY * deltaY) > PRESS_MOVE_TOLERANCE) {
      this.clearPendingLongPressDetection()
      this.clearPendingPressCueHold()
      this.hidePressCue()
      this.resetMountainTouchTracking()
      this.syncRepeatHint()
    }
  },

  onMountainLongPress: function(e) {
    if (this.data.state != State.waiting) {
      return
    }

    if (this.touchStartTime && !this.isTrackingMountainPress) {
      return
    }

    var pressStartTime = this.touchStartTime || e.timeStamp || 0
    var elapsed = this.touchStartTime ? Math.max((e.timeStamp || this.touchStartTime) - this.touchStartTime, 0) : this.anim_data.pressDuration
    var remaining = this.touchStartTime ? this.anim_data.pressDuration - elapsed : 0
    this.queueMountainPressSequence(pressStartTime, remaining, !!this.touchStartTime)
  },

  onMountainTap: function(e){
    if (this.suppressNextMountainTap) {
      this.clearMountainTapSuppression()
      return
    }

    this.ensureBackgroundAudioStarted()
    if (this.data.state == State.waiting && this.expShowable)
    {
      this.setExpBubbleVisible(!this.isExpShow)
    }else if (this.data.state == State.saving)
    {
      this.hidScreenshot()
    }
  },

  onMountainTouchEnd: function (e) {
    var hadPendingLongPress = !!this.longPressDetectTimeout && this.isTrackingMountainPress
    var holdDuration = this.touchStartTime ? Math.max((e.timeStamp || this.touchStartTime) - this.touchStartTime, 0) : 0
    this.clearPendingLongPressDetection()
    this.clearPendingPressCueHold()
    this.interruptMountainPressSequence(e.timeStamp)
    this.resetMountainTouchTracking()

    if (hadPendingLongPress && holdDuration >= SHORT_PRESS_FEEDBACK_THRESHOLD && holdDuration < this.anim_data.pressDuration) {
      this.showPressCue("warning", 0, 980)
      return
    }

    if (this.data.state == State.waiting) {
      this.hidePressCue()
      this.syncRepeatHint()
    }
  },

  onMountainTouchCancel: function (e) {
    this.clearPendingLongPressDetection()
    this.clearPendingPressCueHold()
    this.interruptMountainPressSequence(e.timeStamp)
    this.resetMountainTouchTracking()
    this.hidePressCue()
    this.syncRepeatHint()
  },

  /**
   * 按压时间到结束的一系列动作
   */
  pressSuccess: function () {
    var answer = this.getRandomAnswer()
    var record = answerStore.recordAnswer(answer, ANSWER_SOURCE)
    var time = this.anim_data.contentDuration + this.anim_data.contentInteral + this.anim_data.subContentDuration
    this.currentAnswerRecord = record
    this.resetShareImageCache()

    this.setData({
      content: record.content,
      subContent: record.subContent,
      exp: record.exp,
      _anim_content: this.anim_content.contentShow(this.anim_data.contentDuration, 0).export(),
      _anim_sub_content: this.anim_content.subContentShow(this.anim_data.subContentDuration, this.anim_data.contentInteral + this.anim_data.contentDuration).export(),
      hasAnswer: true,
      detailPanelVisible: false,
    })

    this.triggerSuccessFeedback()
    this.refreshAnswerRecords()
    this.prepareDynamicShareImages()

    this.answerRevealTimeout = setTimeout(function () {
      this.setData({
        state: State.waiting,
        canSavePoster: true,
        _tran_exp_show: this.anim_data.tran_exp_show,
      })
      this.expShowable = true
      this.isExpShow = true
      this.syncRepeatHint()
    }.bind(this), time)
  },
  /**
   * 随机答案，核心函数
   */
  getRandomAnswer: function () {
    var index = -1;
    var length = this.answer_data.getAnswerLength()
    if (this.lastIndex != -1) {
      // 不是第一次，需要判断重复
      do {
        // 防止和上次重复
        index = Math.floor(Math.random() * length)
      } while (this.lastIndex == index)
    } else {
      // 第一次直接随机
      index = Math.floor(Math.random() * length)
    }
    this.lastIndex = index
    var answer = this.answer_data.getAnswerByIndex(index)
    return answer
  },

  /**
   * 获得上次的答案
   */
  getLastAnswer: function () {
    return this.getCurrentAnswer()
  },

  /**
   * ---------------------------  保存截图功能  ---------------------------
   */

  onTapSavePosterAction: function () {
    if (this.data.state == State.waiting && this.getCurrentAnswer() && this.data.canSavePoster){
      this.requestAlbumPermission(function () {
        this.startSaveFlow()
      }.bind(this))
    }
  },

  requestAlbumPermission: function (onSuccess) {
    wx.authorize({
      scope: ALBUM_SCOPE,
      success: onSuccess,
      fail: function () {
        wx.showModal({
          title: "需要相册权限",
          content: "保存图片到系统相册前，需要先允许访问相册。",
          confirmText: "去设置",
          success: function (res) {
            if (!res.confirm) {
              wx.showToast({
                title: "未获得相册权限",
                icon: "none",
                duration: 1500,
              })
              return
            }

            wx.openSetting({
              success: function (settingRes) {
                if (settingRes.authSetting[ALBUM_SCOPE]) {
                  onSuccess()
                } else {
                  wx.showToast({
                    title: "未获得相册权限",
                    icon: "none",
                    duration: 1500,
                  })
                }
              },
              fail: function () {
                wx.showToast({
                  title: "打开设置失败",
                  icon: "none",
                  duration: 1500,
                })
              }
            })
          }
        })
      }
    })
  },

  startSaveFlow: function () {
    this.closePosterErrorDialog()
    wx.showLoading({
      title: "保存中",
      mask: true
    })

    this.setData({
      state: State.saving,
    })

    if (this.isScreenshotDrew) {
      this.continuePosterSaveFlow()
      return
    }

    var answer = this.getLastAnswer()
    this.drawPoster(answer)
      .then(function () {
        this.isScreenshotDrew = true
        return this.continuePosterSaveFlow()
      }.bind(this))
      .catch(function (error) {
        this.handlePosterFlowError(error && error.posterStage ? error.posterStage : "draw", error)
      }.bind(this))
  },

  ensurePosterCanvas: function () {
    if (this.posterCanvas && this.posterCtx) {
      return Promise.resolve()
    }

    return new Promise(function (resolve, reject) {
      wx.createSelectorQuery()
        .select("#canvas-big")
        .fields({ node: true, size: true })
        .exec(function (res) {
          var canvasRef = res && res[0]
          if (!canvasRef || !canvasRef.node) {
            reject(new Error("poster canvas not found"))
            return
          }

          this.posterCanvas = canvasRef.node
          this.posterCanvas.width = POSTER_WIDTH
          this.posterCanvas.height = POSTER_HEIGHT
          this.posterCtx = this.posterCanvas.getContext("2d")
          resolve()
        }.bind(this))
    }.bind(this))
  },

  loadPosterImage: function (src) {
    return this.ensurePosterCanvas().then(function () {
      if (this.posterAssetCache[src]) {
        return this.posterAssetCache[src]
      }

      return new Promise(function (resolve, reject) {
        var image = this.posterCanvas.createImage()
        var settled = false
        var timeoutId = setTimeout(function () {
          if (settled) {
            return
          }
          settled = true
          reject(new Error("load image timeout: " + src))
        }, POSTER_ASSET_TIMEOUT)

        image.onload = function () {
          if (settled) {
            return
          }
          settled = true
          clearTimeout(timeoutId)
          this.posterAssetCache[src] = image
          resolve(image)
        }.bind(this)
        image.onerror = function (error) {
          if (settled) {
            return
          }
          settled = true
          clearTimeout(timeoutId)
          reject(error || new Error("load image failed: " + src))
        }
        image.src = src
      }.bind(this))
    }.bind(this))
  },

  drawPoster: function (answer) {
    return this.loadPosterImage(POSTER_BG).then(function (bgImage) {
      var ctx = this.posterCtx

      ctx.clearRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT)
      ctx.drawImage(bgImage, 0, 0, POSTER_WIDTH, POSTER_HEIGHT)
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillStyle = "white"
      ctx.font = "55px sans-serif"
      this.drawPosterTextBlock(ctx, answer.content, POSTER_WIDTH / 2, POSTER_CONTENT_Y, POSTER_CONTENT_MAX_WIDTH, POSTER_CONTENT_LINE_HEIGHT, POSTER_MAX_LINES)
      ctx.font = "25px sans-serif"
      this.drawPosterTextBlock(ctx, answer.subContent, POSTER_WIDTH / 2, POSTER_SUB_CONTENT_Y, POSTER_SUB_CONTENT_MAX_WIDTH, POSTER_SUB_CONTENT_LINE_HEIGHT, POSTER_MAX_LINES)
    }.bind(this))
  },

  continuePosterSaveFlow: function () {
    var filePathPromise = this.lastPosterTempFilePath
      ? Promise.resolve(this.lastPosterTempFilePath)
      : this.getPosterTempFile().then(function (filePath) {
          this.lastPosterTempFilePath = filePath
          return filePath
        }.bind(this))

    return filePathPromise
      .then(function (filePath) {
        return this.savePosterTempFile(filePath)
      }.bind(this))
      .then(this.finishPosterSaveSuccess.bind(this))
      .catch(function (error) {
        this.handlePosterFlowError(error && error.posterStage ? error.posterStage : "save", error)
      }.bind(this))
  },

  getPosterTempFile: function () {
    return new Promise(function (resolve, reject) {
      if (!this.posterCanvas) {
        var noCanvasError = new Error("poster canvas not initialized")
        noCanvasError.posterStage = "export"
        reject(noCanvasError)
        return
      }

      wx.canvasToTempFilePath({
        x: 0,
        y: 0,
        width: POSTER_WIDTH,
        height: POSTER_HEIGHT,
        destWidth: POSTER_WIDTH,
        destHeight: POSTER_HEIGHT,
        canvas: this.posterCanvas,
        success: function (res) {
          resolve(res.tempFilePath)
        },
        fail: function (error) {
          error = error || new Error("canvas export failed")
          error.posterStage = "export"
          reject(error)
        }
      })
    }.bind(this))
  },

  savePosterTempFile: function (filePath) {
    return new Promise(function (resolve, reject) {
      wx.saveImageToPhotosAlbum({
        filePath: filePath,
        success: resolve,
        fail: function (error) {
          error = error || new Error("save image failed")
          error.posterStage = "save"
          reject(error)
        }
      })
    })
  },

  finishPosterSaveSuccess: function () {
    wx.hideLoading()
    wx.showToast({
      title: "保存成功",
      icon: "success",
      duration: 1000,
      mask: true,
    })
    this.screenshotResetTimeout = setTimeout(function () {
      this.hidScreenshot()
    }.bind(this), 1000)
  },

  hidScreenshot: function (e) {
    this.setData({
      state: State.waiting,
      canSavePoster: true,
    })
  },

  handlePosterFlowError: function (stage, error) {
    var errorMessage = error && (error.errMsg || error.message) ? (error.errMsg || error.message) : ""
    var title = "海报生成失败"
    var message = "这次没有成功完成海报操作，你可以再试一次。"
    var supportText = "如果连续失败，也可以先复制当前答案，稍后再回来保存海报。"
    var retryText = "重新尝试"
    var retryAction = "restart-save"

    if (stage === "draw") {
      title = "生成海报失败"
      message = "海报绘制没有完成，重新生成后再保存会更稳一些。"
      supportText = "素材加载可能还没完全准备好。可以重新生成一次，如果还是不稳定，先复制答案或稍后重试。"
      retryText = "重新生成"
      retryAction = "restart-save"
    } else if (stage === "export") {
      title = "导出海报失败"
      message = "海报已经生成，但导出图片时中断了。你可以重新导出一次。"
      supportText = "如果在开发者工具里连续失败，真机里通常会更稳定一些，也可以先截图留存结果。"
      retryText = "重新导出"
      retryAction = "export-and-save"
    } else if (stage === "save") {
      title = "保存到相册失败"
      message = "图片已经生成，但写入系统相册时没有成功。"
      supportText = "你可以先重新保存；如果暂时不方便，也可以先复制答案内容。"
      retryText = "重新保存"
      retryAction = "save-temp-file"

      if (/auth deny|auth denied|permission/i.test(errorMessage)) {
        title = "需要相册权限"
        message = "当前没有保存到相册的权限，请先授权后再继续保存。"
        supportText = "授权完成后可以继续保存海报；如果现在不想授权，也可以先复制答案。"
        retryText = "去设置"
        retryAction = "request-permission-and-save"
      } else if (/file|path/i.test(errorMessage)) {
        message = "临时图片似乎已经失效，重新导出一张再保存会更稳一些。"
        supportText = "临时文件在切后台或等待较久后可能失效，重新导出通常就能恢复。"
        retryText = "重新导出"
        retryAction = "export-and-save"
      }
    }

    wx.hideLoading()
    this.hidScreenshot()
    this.showPosterErrorDialog(title, message, retryText, retryAction, supportText)
    console.error("poster flow failed", stage, error)
  },

  showPosterErrorDialog: function (title, message, retryText, retryAction, supportText) {
    this.posterRetryAction = retryAction
    this.setData({
      posterErrorVisible: true,
      posterErrorTitle: title,
      posterErrorMessage: message,
      posterErrorSupportText: supportText || "",
      posterErrorRetryText: retryText,
    })
  },

  closePosterErrorDialog: function () {
    this.posterRetryAction = ""
    this.setData({
      posterErrorVisible: false,
      posterErrorSupportText: "",
    })
  },

  onTapPosterRetry: function () {
    var retryAction = this.posterRetryAction || "restart-save"
    this.closePosterErrorDialog()

    if (retryAction === "request-permission-and-save") {
      this.requestAlbumPermission(function () {
        this.onTapPosterRetryWithAction("save-temp-file")
      }.bind(this))
      return
    }

    this.onTapPosterRetryWithAction(retryAction)
  },

  onTapPosterRetryWithAction: function (retryAction) {
    if (retryAction === "restart-save") {
      this.isScreenshotDrew = false
      this.lastPosterTempFilePath = ""
      this.startSaveFlow()
      return
    }

    wx.showLoading({
      title: "保存中",
      mask: true
    })
    this.setData({
      state: State.saving,
    })

    if (retryAction === "export-and-save") {
      this.lastPosterTempFilePath = ""
      this.continuePosterSaveFlow()
      return
    }

    if (retryAction === "save-temp-file" && this.lastPosterTempFilePath) {
      this.savePosterTempFile(this.lastPosterTempFilePath)
        .then(this.finishPosterSaveSuccess.bind(this))
        .catch(function (error) {
          this.handlePosterFlowError("save", error)
        }.bind(this))
      return
    }

    this.isScreenshotDrew = false
    this.lastPosterTempFilePath = ""
    this.startSaveFlow()
  },

  onTapPosterCopyAnswer: function () {
    var answer = this.getCurrentAnswer()
    if (!answer) {
      return
    }

    wx.setClipboardData({
      data: answerStore.buildClipboardText(answer),
      success: function () {
        wx.showToast({
          title: "已复制答案",
          icon: "none",
          duration: 1200,
        })
      }
    })
  },

  getWrappedPosterLines: function (ctx, text, maxWidth, maxLines) {
    var content = text || ""
    var lines = []
    var currentLine = ""

    for (var i = 0; i < content.length; i++) {
      var nextLine = currentLine + content[i]
      if (ctx.measureText(nextLine).width <= maxWidth || currentLine === "") {
        currentLine = nextLine
      } else {
        lines.push(currentLine)
        currentLine = content[i]
      }

      if (lines.length === maxLines) {
        break
      }
    }

    if (lines.length < maxLines && currentLine) {
      lines.push(currentLine)
    }

    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines)
    }

    if (content.length && lines.length === maxLines) {
      var joinedLength = lines.join("").length
      if (joinedLength < content.length) {
        lines[maxLines - 1] = this.fitPosterLineWithEllipsis(ctx, lines[maxLines - 1], maxWidth)
      }
    }

    return lines
  },

  fitPosterLineWithEllipsis: function (ctx, text, maxWidth) {
    var line = text
    while (line && ctx.measureText(line + "…").width > maxWidth) {
      line = line.slice(0, -1)
    }
    return line + "…"
  },

  drawPosterTextBlock: function (ctx, text, centerX, centerY, maxWidth, lineHeight, maxLines) {
    var lines = this.getWrappedPosterLines(ctx, text, maxWidth, maxLines)
    var startY = centerY - ((lines.length - 1) * lineHeight) / 2

    lines.forEach(function (line, index) {
      ctx.fillText(line, centerX, startY + index * lineHeight)
    })
  },

  triggerSuccessFeedback: function () {
    if (typeof wx.vibrateShort === "function") {
      wx.vibrateShort()
    }
  },

  showShareOptions: function () {
    if (typeof wx.showShareMenu === "function") {
      wx.showShareMenu({
        menus: ["shareAppMessage", "shareTimeline"],
      })
    }
  },

  getPageMode: function () {
    return ANSWER_SOURCE
  },

  buildShareQuery: function (scene, mode) {
    var params = {}
    params[SHARE_QUERY_FROM_SHARE] = 1
    params[SHARE_QUERY_MODE] = mode || this.getPageMode()
    params[SHARE_QUERY_SCENE] = scene || ""
    return buildQueryString(params)
  },

  buildSharePath: function (scene, mode) {
    return SUN_RISE_PAGE_PATH + "?" + this.buildShareQuery(scene, mode)
  },

  handleShareEntryRedirect: function (options) {
    var mode = options && options[SHARE_QUERY_MODE]
    if (!mode || mode === this.getPageMode()) {
      return false
    }

    return false
  },

  buildShareData: function () {
    var answer = this.getCurrentAnswer()
    return {
      title: answer ? "今天抽到的答案是：" + answer.content : "默想一个问题，等待太阳给出答案",
      path: this.buildSharePath(SHARE_SCENE_APP_MESSAGE),
      imageUrl: SUN_RISE_SHARE_IMAGE,
    }
  },

  buildTimelineShareData: function () {
    var answer = this.getCurrentAnswer()
    return {
      title: answer ? "今天抽到的答案是：" + answer.content : "默想一个问题，等待太阳给出答案",
      query: this.buildShareQuery(SHARE_SCENE_TIMELINE),
      imageUrl: SUN_RISE_SHARE_IMAGE,
    }
  },

  onTapSwitchMode: function () {
    wx.navigateTo({
      url: ANSWERS_PAGE_PATH,
    })
  },

  getCurrentAnswer: function () {
    return this.currentAnswerRecord
  },

  getRecordPanelEmptyText: function (type) {
    return type === "history" ? "还没有最近记录，先按住山影试试。" : "还没有收藏的答案。"
  },

  setExpBubbleVisible: function (visible) {
    this.isExpShow = visible
    this.setData({
      _tran_exp_show: visible ? this.anim_data.tran_exp_show : "",
    })
  },

  applySelectedAnswerRecord: function (record) {
    this.currentAnswerRecord = answerStore.recordAnswer(record, record.source || ANSWER_SOURCE)
    this.isScreenshotDrew = false
    this.lastPosterTempFilePath = ""
    this.resetShareImageCache()
    this.expShowable = true
    this.hidePressCue()
    this.setData({
      content: this.currentAnswerRecord.content,
      subContent: this.currentAnswerRecord.subContent,
      exp: this.currentAnswerRecord.exp,
      state: State.waiting,
      isShowTutorialTxt: false,
      _tran_exp_show: this.anim_data.tran_exp_show,
      hasAnswer: true,
      canSavePoster: true,
      recordPanelVisible: false,
      detailPanelVisible: false,
      actionMenuVisible: false,
      posterErrorVisible: false,
    }, function () {
      this.syncRepeatHint()
    }.bind(this))
    this.isExpShow = true
    this.refreshAnswerRecords()
    this.prepareDynamicShareImages()
  },

  noop: function () {},

  resetShareImageCache: function () {
    this.shareImageCache = {}
  },

  getShareImageSize: function (scene) {
    if (scene === SHARE_SCENE_TIMELINE) {
      return {
        width: 600,
        height: 600,
      }
    }

    return {
      width: 500,
      height: 400,
    }
  },

  getCachedShareImage: function (scene, signature) {
    var cache = this.shareImageCache && this.shareImageCache[scene]
    if (cache && cache.signature === signature && cache.filePath) {
      return cache.filePath
    }
    return ""
  },

  setCachedShareImage: function (scene, signature, filePath) {
    if (!this.shareImageCache) {
      this.shareImageCache = {}
    }
    this.shareImageCache[scene] = {
      signature: signature,
      filePath: filePath,
    }
  },

  ensureShareCanvas: function () {
    if (this.shareCanvas && this.shareCtx) {
      return Promise.resolve()
    }

    return new Promise(function (resolve, reject) {
      wx.createSelectorQuery()
        .select("#share-canvas")
        .fields({ node: true, size: true })
        .exec(function (res) {
          var canvasRef = res && res[0]
          if (!canvasRef || !canvasRef.node) {
            reject(new Error("share canvas not found"))
            return
          }

          this.shareCanvas = canvasRef.node
          this.shareCtx = this.shareCanvas.getContext("2d")
          resolve()
        }.bind(this))
    }.bind(this))
  },

  enqueueShareImageTask: function (task) {
    var baseTask = this.shareImageTask || Promise.resolve()
    var queuedTask = baseTask
      .catch(function () {})
      .then(task)

    this.shareImageTask = queuedTask.catch(function () {})
    return queuedTask
  },

  generateShareImage: function (scene) {
    var answer = this.getCurrentAnswer()
    if (!answer) {
      return Promise.reject(new Error("no answer to share"))
    }

    var cached = this.getCachedShareImage(scene, answer.signature)
    if (cached) {
      return Promise.resolve(cached)
    }

    var size = this.getShareImageSize(scene)

    return this.enqueueShareImageTask(function () {
      return this.ensureShareCanvas()
        .then(function () {
          this.shareCanvas.width = size.width
          this.shareCanvas.height = size.height

          shareImage.drawQuoteShareImage(this.shareCtx, {
            width: size.width,
            height: size.height,
            modeLabel: "日出模式",
            heading: "太阳给你的答案",
            answer: answer.content,
            subContent: answer.subContent,
            exp: answer.exp,
            footer: "默想一个问题，等待太阳给出答案",
            theme: {
              backgroundColors: [
                { stop: 0, color: "#F6A45F" },
                { stop: 1, color: "#D75862" },
              ],
              accentColor: "#FFF1D7",
              cardColor: "rgba(255,250,244,0.94)",
              labelBg: "rgba(228,120,88,0.14)",
              labelText: "#B1535D",
              headingText: "#AD5260",
              answerText: "#8F375D",
              bodyText: "#A4495F",
              mutedText: "rgba(143,55,93,0.74)",
              dividerColor: "rgba(173,82,96,0.18)",
              footerText: "rgba(143,55,93,0.68)",
            },
          })

          return new Promise(function (resolve, reject) {
            wx.canvasToTempFilePath({
              x: 0,
              y: 0,
              width: size.width,
              height: size.height,
              destWidth: size.width,
              destHeight: size.height,
              canvas: this.shareCanvas,
              success: function (res) {
                this.setCachedShareImage(scene, answer.signature, res.tempFilePath)
                resolve(res.tempFilePath)
              }.bind(this),
              fail: reject,
            })
          }.bind(this))
        }.bind(this))
    }.bind(this))
  },

  prepareDynamicShareImages: function () {
    if (!this.getCurrentAnswer()) {
      return Promise.resolve()
    }

    return this.generateShareImage(SHARE_SCENE_APP_MESSAGE)
      .catch(function () {})
      .then(function () {
        return this.generateShareImage(SHARE_SCENE_TIMELINE)
      }.bind(this))
      .catch(function () {})
  },

  buildDynamicShareResult: function (scene) {
    var fallback = scene === SHARE_SCENE_TIMELINE ? this.buildTimelineShareData() : this.buildShareData()
    return this.generateShareImage(scene)
      .then(function (filePath) {
        fallback.imageUrl = filePath
        return fallback
      })
      .catch(function () {
        return fallback
      })
  },

  /**
   * ---------------------------  彩蛋致谢功能  ---------------------------
   */

  onTapCloud_1: function (e) {
    this.tapCount[0] = true
  },

  onTapCloud_2: function (e) {
    if (this.tapCount[0]) {
      this.tapCount[1] = true
    }
    if (this.tapCount[0] && this.tapCount[1]) {
      var temp = this.data.isThx
      this.setData({
        isThx: !temp
      })

      this.tapCount[0] = false
      this.tapCount[1] = false
    }
  },
})
