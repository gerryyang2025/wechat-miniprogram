// answers.js

var app = getApp()
var answerData = require("./answer_data.js")
var answerStore = require("../../utils/answer_store.js")
var resultInteractionBehavior = require("../../behaviors/result_interaction.js")
var shareImage = require("../../utils/share_image.js")

const AUDIO_START_TIME = 5
const AUDIO_SRC = "/assets/audio_001.mp3"
const DEFAULT_CONTENT = "默想一个问题"
const DEFAULT_SUB_CONTENT = "比如：明天会顺利吗？接下来我该怎么办？"
const DEFAULT_EXP = "长按下方圆盘，等待答案显现"
const DEFAULT_HINT = "长按圆盘开始抽取"
const HOLDING_HINT = "继续按住，答案正在显现"
const ANSWER_HINT = "点击圆盘查看或收起释义"
const ANSWER_SOURCE = "answers"
const ANSWERS_PAGE_PATH = "/pages/answers/answers"
const SUN_RISE_PAGE_PATH = "/pages/sun_rise/sun_rise"
const ANSWERS_SHARE_IMAGE = "/assets/bg1.png"
const SHARE_SCENE_APP_MESSAGE = "appMessage"
const SHARE_SCENE_TIMELINE = "timeline"
const SHARE_QUERY_FROM_SHARE = "fromShare"
const SHARE_QUERY_MODE = "mode"
const SHARE_QUERY_SCENE = "shareScene"

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
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

function buildSunriseRedirectUrl(options) {
  var params = {}
  if (options && options[SHARE_QUERY_FROM_SHARE]) {
    params[SHARE_QUERY_FROM_SHARE] = options[SHARE_QUERY_FROM_SHARE]
  }
  if (options && options[SHARE_QUERY_SCENE]) {
    params[SHARE_QUERY_SCENE] = options[SHARE_QUERY_SCENE]
  }
  params[SHARE_QUERY_MODE] = "sun_rise"
  var query = buildQueryString(params)
  return query ? SUN_RISE_PAGE_PATH + "?" + query : SUN_RISE_PAGE_PATH
}

Page({
  behaviors: [resultInteractionBehavior],

  /**
   * 页面的初始数据
   */
  data: {
    content: DEFAULT_CONTENT,
    subContent: DEFAULT_SUB_CONTENT,
    exp: DEFAULT_EXP,
    tableAnimation: "",
    contentAnimation: "",
    subContentAnimation: "",
    expAnimation: "",
    audio_src: AUDIO_SRC,
    tableStyle: "",
    tableHintStyle: "",
    tableHint: DEFAULT_HINT,
    modeSwitchStyle: "",
    hasAnswer: false,
    resultActionThemeClass: "result-action-bar--answers",
    resultActionMenuThemeClass: "result-action-menu--answers",
    resultPanelThemeClass: "result-theme--answers",
    detailPanelStyle: "",
    contentCardStyle: "",
    contentLayoutStyle: "",
    subContentLayoutStyle: "",
    expLayoutStyle: "",
    tableImageStyle: "",
    resultActionsStyle: "",
    recordPanelStyle: "",
  },

  // 触摸事件
  inShow: false,
  inRotation: false,
  touchStartTime: 0,
  touchEndTime: 0,
  duration: 0,
  // 动画
  pressDuration: 1800,
  defaultStopDuration: 1500,
  deg: 0,
  rotateDeg: 180,
  contentDuration: 1000,
  subContentDelay: 500,
  subContentDuration: 1000,
  expOpacity: 1,
  expDuration: 500,
  
  lastIndex: -1,
  currentAnswerRecord: null,
  shareCanvas: null,
  shareCtx: null,
  shareImageCache: null,
  shareImageTask: null,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.redirectTo({
      url: buildSunriseRedirectUrl(options || {}),
    })
    return

    this.answerData = new answerData()
    this.shareImageCache = {}
    this.shareImageTask = Promise.resolve()
    this.initLayoutInfo()
    this.showShareOptions()
    this.refreshAnswerRecords()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    if (!this.getCurrentAnswer()) {
      this.createExpResetAnimation(1)
    }
    // 使用 InnerAudioContext 管理短音频，并在页面卸载时释放资源
    if (typeof wx.createInnerAudioContext === "function") {
      this.audioCtx = wx.createInnerAudioContext()
      this.audioCtx.src = this.data.audio_src
      this.audioCtx.startTime = AUDIO_START_TIME
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.refreshAnswerRecords()
  },

  onResize: function () {
    this.initLayoutInfo()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.stopPressAudio()
    this.clearInteractionTimers()
    this.setData({
      actionMenuVisible: false,
      recordPanelVisible: false,
      detailPanelVisible: false,
    })
    if (this.inRotation && !this.inShow) {
      this.restoreLastAnswerOrDefault()
      this.createTableResetAnimation()
    }
    this.resetInteractionState()
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.clearInteractionTimers()
    this.shareCanvas = null
    this.shareCtx = null
    this.shareImageCache = null
    this.shareImageTask = null
    if (this.audioCtx) {
      this.audioCtx.destroy()
      this.audioCtx = null
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {},

  initLayoutInfo: function () {
    var runtimeInfo = app.refreshRuntimeInfo ? app.refreshRuntimeInfo() : app.globalData.runtimeInfo || {}
    var windowInfo = runtimeInfo.windowInfo || {}
    var menuButtonInfo = runtimeInfo.menuButtonInfo || null
    var topInset = runtimeInfo.safeAreaInsets ? runtimeInfo.safeAreaInsets.top : 0
    var bottomInset = runtimeInfo.safeAreaInsets ? runtimeInfo.safeAreaInsets.bottom : 0
    var windowWidth = windowInfo.windowWidth || 375
    var windowHeight = windowInfo.windowHeight || 667
    var compact = windowHeight < 720
    var cardWidth = clamp(windowWidth - 28, 308, 370)
    var cardHeight = clamp(windowHeight * (compact ? 0.33 : 0.35), 218, 272)
    var cardTop = clamp(topInset + windowHeight * (compact ? 0.11 : 0.135), topInset + 72, topInset + 124)
    var contentTop = cardTop + cardHeight * 0.2
    var subContentTop = cardTop + cardHeight * 0.56
    var tableSize = clamp(windowWidth * 0.32, 108, 132)
    var tableBottom = bottomInset + (compact ? 18 : 28)
    var expBottom = tableBottom + tableSize + (compact ? 48 : 68)
    var horizontalPadding = clamp(windowWidth * 0.15, 48, 86)
    var resultActionsWidth = clamp(windowWidth - 40, 280, 360)
    var tableHintWidth = clamp(windowWidth - 52, 220, 340)
    var modeSwitchLeft = clamp(windowWidth * 0.045, 14, 22)
    var modeSwitchTop = menuButtonInfo && menuButtonInfo.bottom ? menuButtonInfo.bottom + 10 : topInset + 14

    this.setData({
      tableStyle: "bottom: " + tableBottom + "px;",
      tableHintStyle: "max-width: " + tableHintWidth + "px; padding: 0 16px; font-size: " + (compact ? 13 : 14) + "px;",
      modeSwitchStyle: "top: " + Math.round(modeSwitchTop) + "px; left: " + Math.round(modeSwitchLeft) + "px;",
      contentCardStyle: "width: " + cardWidth + "px; height: " + cardHeight + "px; left: " + (windowWidth - cardWidth) / 2 + "px; top: " + cardTop + "px;",
      contentLayoutStyle: "top: " + Math.round(contentTop) + "px; padding: 0 " + horizontalPadding + "px; font-size: " + (compact ? 28 : 32) + "px;",
      subContentLayoutStyle: "top: " + Math.round(subContentTop) + "px; padding: 0 " + (horizontalPadding + 18) + "px; font-size: " + (compact ? 13 : 14) + "px;",
      expLayoutStyle: "bottom: " + Math.round(expBottom) + "px; padding: 0 " + (horizontalPadding + 16) + "px; font-size: " + (compact ? 16 : 18) + "px;",
      tableImageStyle: "width: " + tableSize + "px; height: " + tableSize + "px;",
      resultActionsStyle: "max-width: " + resultActionsWidth + "px;",
      recordPanelStyle: "padding-bottom: " + Math.max(bottomInset, 16) + "px;",
      detailPanelStyle: "padding-bottom: " + Math.max(bottomInset, 20) + "px;",
    })
  },

  longPress: function (e) {
    if (!this.inShow && !this.inRotation)
    {
      this.inRotation = true
      this.touchStartTime = e.timeStamp
      // console.log("touch start at " + this.touchStartTime)

      // 清除旧的内容
      this.clearOldContent()
      this.setData({
        tableHint: HOLDING_HINT,
        hasAnswer: false,
      })

      // 设置旋转动画
      this.createTableRotateAnimation()
      // 设置content动画初始位置
      this.createContentStartAnimation()
      // 设置subContent动画初始位置
      this.createSubContentStartAnimation()
      // 设置exp动画初始位置
      this.createExpStartAnimation()
      // 播放音频
      this.playPressAudio()

      // 设置计时器，按压结束后一系列动作
      this.timeout_press_over = setTimeout(this.pressOver.bind(this), this.pressDuration)
    }
  },
  
  /**
   * 按压时间到结束的一系列动作
   */
  pressOver: function() {
    // 设置文本新内容
    this.setNewContent()
    // 桌面停止动画
    this.createTableStopAnimation()
    // content显示动画
    this.createContentShowAnimation()
    // subContent显示动画
    this.createSubContentShowAnimation()
    // 停止播放按压音效
    this.stopPressAudio()
    // 播放停止音效
    //
    this.triggerSuccessFeedback()
  },

  touchEnd: function (e) {
    if (!this.inShow && this.inRotation)
    {
      this.touchEndTime = e.timeStamp
      // console.log("touch end at " + this.touchEndTime)
      this.duration = this.touchEndTime - this.touchStartTime

      // 停止播放音频
      this.stopPressAudio()

      if (this.duration < this.pressDuration) {
        // 清除计时-----content出现
        clearTimeout(this.timeout_press_over)

        this.createTableInterruptAnimation()
        this.inRotation = false
        this.restoreLastAnswerOrDefault()
      }
    }
  },

  bindTap: function(e) {
    if (this.getCurrentAnswer() && !this.inShow && !this.inRotation)
    {
      this.createExpShowAnimation()
    }
  },

  /**
   * 设置默认content文本
   */
  setDefaultContent: function () {
    this.currentAnswerRecord = null
    this.resetShareImageCache()
    this.setData({
      content: DEFAULT_CONTENT,
      subContent: DEFAULT_SUB_CONTENT,
      exp: DEFAULT_EXP,
      tableHint: DEFAULT_HINT,
      hasAnswer: false,
      isCurrentFavorite: false,
      detailPanelVisible: false,
    })
    this.createExpResetAnimation(1)
  },

  /**
   * 清除旧的content
   */
  clearOldContent: function () {
    this.resetShareImageCache()
    this.setData({
      content: "",
      subContent: "",
      exp: "",
      detailPanelVisible: false,
    })
  },

  /**
   * 设置新的content
   */
  setNewContent: function () {
    this.inShow = true
    this.inRotation = false
    clearTimeout(this.answerRevealDoneTimeout)
    this.answerRevealDoneTimeout = setTimeout(function(){
      this.inShow = false
      // console.log("好了")
    }.bind(this), Math.max(this.defaultStopDuration, this.contentDuration) + this.subContentDelay + this.subContentDuration)

    var index = -1;
    var length = this.answerData.getAnswerLength()
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
    // 更新数据以更新显示
    var answer = this.answerData.getAnswerByIndex(index)
    var record = answerStore.recordAnswer(answer, ANSWER_SOURCE)
    this.lastIndex = index
    this.currentAnswerRecord = record
    this.resetShareImageCache()
    this.setData({
      content: record.content,
      subContent: record.subContent,
      exp: record.exp,
      tableHint: ANSWER_HINT,
      hasAnswer: true,
      detailPanelVisible: false,
    })
    this.createExpResetAnimation(0)
    this.refreshAnswerRecords()
    this.prepareDynamicShareImages()
  },

  /**
   * 播放按压音频
   */
  playPressAudio: function (){
    if (!this.audioCtx) {
      return
    }
    this.audioCtx.stop()
    this.audioCtx.play()
  },

  /**
   * 停止按压音频
   */
  stopPressAudio: function (){
    if (this.audioCtx) {
      this.audioCtx.pause()
    }
  },

  clearInteractionTimers: function () {
    clearTimeout(this.timeout_press_over)
    clearTimeout(this.answerRevealDoneTimeout)
    clearTimeout(this.tableResetTimeout)
  },

  resetInteractionState: function () {
    this.inShow = false
    this.inRotation = false
  },

  restoreLastAnswerOrDefault: function () {
    var answer = this.getCurrentAnswer()
    if (!answer) {
      this.setDefaultContent()
      return
    }

    this.setData({
      content: answer.content,
      subContent: answer.subContent,
      exp: answer.exp,
      tableHint: ANSWER_HINT,
      hasAnswer: true,
      detailPanelVisible: false,
    })
    this.createExpResetAnimation(0)
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

  getRecordPanelEmptyText: function (type) {
    return type === "history" ? "还没有最近记录，先抽一次看看。" : "还没有收藏的答案。"
  },

  buildShareQuery: function (scene, mode) {
    var params = {}
    params[SHARE_QUERY_FROM_SHARE] = 1
    params[SHARE_QUERY_MODE] = mode || this.getPageMode()
    params[SHARE_QUERY_SCENE] = scene || ""
    return buildQueryString(params)
  },

  buildSharePath: function (scene, mode) {
    return ANSWERS_PAGE_PATH + "?" + this.buildShareQuery(scene, mode)
  },

  handleShareEntryRedirect: function (options) {
    return false
  },

  buildShareData: function () {
    var answer = this.getCurrentAnswer()
    var title = answer ? "我抽到的答案是：" + answer.content : "默想一个问题，让答案自己浮现"

    return {
      title: title,
      path: this.buildSharePath(SHARE_SCENE_APP_MESSAGE),
      imageUrl: ANSWERS_SHARE_IMAGE,
    }
  },

  buildTimelineShareData: function () {
    var answer = this.getCurrentAnswer()
    return {
      title: answer ? "我抽到的答案是：" + answer.content : "默想一个问题，让答案自己浮现",
      query: this.buildShareQuery(SHARE_SCENE_TIMELINE),
      imageUrl: ANSWERS_SHARE_IMAGE,
    }
  },

  onShareTimeline: function () {
    var shareData = this.buildTimelineShareData()
    if (this.getCurrentAnswer()) {
      shareData.promise = this.buildDynamicShareResult(SHARE_SCENE_TIMELINE)
    }
    return shareData
  },

  onShareAppMessage: function () {
    var shareData = this.buildShareData()
    if (this.getCurrentAnswer()) {
      shareData.promise = this.buildDynamicShareResult(SHARE_SCENE_APP_MESSAGE)
    }
    return shareData
  },

  onTapSwitchMode: function () {
    var pages = getCurrentPages()
    var previousPage = pages.length > 1 ? pages[pages.length - 2] : null

    if (previousPage && previousPage.route === "pages/sun_rise/sun_rise") {
      wx.navigateBack({
        delta: 1,
      })
      return
    }

    wx.redirectTo({
      url: SUN_RISE_PAGE_PATH,
    })
  },

  getCurrentAnswer: function () {
    return this.currentAnswerRecord
  },

  applySelectedAnswerRecord: function (record) {
    this.currentAnswerRecord = answerStore.recordAnswer(record, record.source || ANSWER_SOURCE)
    this.resetShareImageCache()
    this.setData({
      content: this.currentAnswerRecord.content,
      subContent: this.currentAnswerRecord.subContent,
      exp: this.currentAnswerRecord.exp,
      tableHint: ANSWER_HINT,
      hasAnswer: true,
      recordPanelVisible: false,
      detailPanelVisible: false,
    })
    this.createExpResetAnimation(1)
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
        .select("#answers-share-canvas")
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
            modeLabel: "经典模式",
            heading: "抽到的答案",
            answer: answer.content,
            subContent: answer.subContent,
            exp: answer.exp,
            footer: "长按圆盘，等待下一次答案出现",
            theme: {
              backgroundColors: [
                { stop: 0, color: "#6D001D" },
                { stop: 1, color: "#C4000C" },
              ],
              accentColor: "#FFD6DC",
              cardColor: "rgba(255,248,245,0.95)",
              labelBg: "rgba(196,0,12,0.12)",
              labelText: "#A21633",
              headingText: "#9A1730",
              answerText: "#5F0D24",
              bodyText: "#7D2740",
              mutedText: "rgba(95,13,36,0.74)",
              dividerColor: "rgba(160,35,58,0.16)",
              footerText: "rgba(95,13,36,0.68)",
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
   * 设置table旋转动画
   */
  createTableRotateAnimation: function () {
    var rotateAnimation = wx.createAnimation({
      duration: this.pressDuration,
      timingFunction: "linear",
    })
    rotateAnimation.rotateZ(this.deg + this.rotateDeg).step()
    // 输出动画
    this.setData({
      tableAnimation: rotateAnimation.export()
    })
  },

  /**
   * 设置table中断动画
   */
  createTableInterruptAnimation: function () {
    var interrupAnimation = wx.createAnimation({
      duration: 500,
      timingFunction: "ease-out",
    })
    var degree = (this.rotateDeg / this.pressDuration) * Math.min(this.duration, this.pressDuration)
    this.deg += Math.round(degree)
    // console.log("中断: " + this.deg)
    interrupAnimation.rotateZ(this.deg).step()
    // 输出动画
    this.setData({
      tableAnimation: interrupAnimation.export()
    })
  },

  /**
   * 设置table停止动画
   */
  createTableStopAnimation: function () {
    this.deg = this.deg + this.rotateDeg
    // Normalize the accumulated angle before the reset animation.
    var temp = Math.floor(this.deg / 360) * 360
    this.deg = temp + 360
    var stopAnimation = wx.createAnimation({
      duration: this.defaultStopDuration,
      timingFunction: "ease",
    })
    stopAnimation.rotateZ(this.deg).step()
    // 输出动画
    this.setData({
      tableAnimation: stopAnimation.export()
    })

    clearTimeout(this.tableResetTimeout)
    this.tableResetTimeout = setTimeout(this.createTableResetAnimation.bind(this), this.defaultStopDuration)
  },

  /**
   * 将table旋转坐标瞬间设置为0
   */
  createTableResetAnimation: function () {
    this.deg = 0
    var resetAnimation = wx.createAnimation({
      duration: 1,
      timingFunction: 'step-start',
    })
    // console.log("重置: " + this.deg)
    resetAnimation.rotateZ(this.deg).step()
    // 输出动画
    this.setData({
      tableAnimation: resetAnimation.export()
    })
  },

  /**
   * content内容动画初始设置
   * 瞬间设置为透明度0，下移40，缩小0.8
   */
  createContentStartAnimation: function() {
    var animation = wx.createAnimation({
      duration: 1,
      timingFunction: 'step-start',
    })
    animation.opacity(0).translateY(40).scale(0.8).step()
    // 输出动画
    this.setData({
      contentAnimation: animation.export()
    })
  },

  /**
   * content内容出现动画
   */
  createContentShowAnimation: function () {
    var animation = wx.createAnimation({
      duration: this.contentDuration,
      timingFunction: "linear",
    })
    animation.opacity(1).translateY(0).scale(1).step()
    // 输出动画
    this.setData({
      contentAnimation: animation.export()
    })
  },

  /**
   * subContent内容初始设置
   */
  createSubContentStartAnimation: function () {
    var animation = wx.createAnimation({
      duration: 1,
      timingFunction: 'step-start',
    })
    animation.opacity(0).step()
    // 输出动画
    this.setData({
      subContentAnimation: animation.export()
    })
  },

  /**
   * subContent内容出现动画
   */
  createSubContentShowAnimation: function () {
    var animation = wx.createAnimation({
      duration: this.subContentDuration,
      timingFunction: "linear",
      delay: this.contentDuration + this.subContentDelay
    })
    animation.opacity(1).step()
    // 输出动画
    this.setData({
      subContentAnimation: animation.export()
    })
  },

  /**
   * exp内容动画初始设置
   */
  createExpStartAnimation: function () {
    this.createExpResetAnimation(0)
  },

  /**
   * exp内容出现动画
   */
  createExpShowAnimation: function () {
    var animation = wx.createAnimation({
      duration: this.expDuration,
      timingFunction: "linear",
    })
    this.expOpacity = this.expOpacity + 1
    // console.log((this.expOpacity) % 2)
    animation.opacity((this.expOpacity) % 2).step()
    // 输出动画
    this.setData({
      expAnimation: animation.export()
    })
  },

  createExpResetAnimation: function (opacity) {
    this.expOpacity = opacity
    var animation = wx.createAnimation({
      duration: 1,
      timingFunction: "step-start",
    })
    animation.opacity(opacity).step()
    this.setData({
      expAnimation: animation.export()
    })
  }
})
