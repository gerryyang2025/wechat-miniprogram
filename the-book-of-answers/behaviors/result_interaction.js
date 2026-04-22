var answerDetail = require("../utils/answer_detail.js")
var answerStore = require("../utils/answer_store.js")
var util = require("../utils/util.js")

function getSourceLabel(source) {
  return source === "sun_rise" ? "日出模式" : "经典模式"
}

module.exports = Behavior({
  data: {
    historyCount: 0,
    favoriteCount: 0,
    isCurrentFavorite: false,
    actionMenuVisible: false,
    recordPanelVisible: false,
    recordPanelTitle: "",
    recordPanelEmptyText: "",
    recordPanelItems: [],
    detailPanelVisible: false,
    detailPanelTitle: "",
    detailPanelSummary: "",
    detailPanelMeaning: "",
    detailPanelAdvice: "",
    detailPanelRisk: "",
    detailPanelQuestion: "",
  },

  methods: {
    onTapResultAction: function (e) {
      var action = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.action : ""

      if (action === "copy") {
        this.onTapCopyResult()
        return
      }

      if (action === "favorite") {
        this.onTapToggleFavorite()
        return
      }

      if (action === "detail") {
        this.onTapShowDetail()
        return
      }

      if (action === "more") {
        this.openActionMenu()
        return
      }

      if (action === "switchMode" && typeof this.onTapSwitchMode === "function") {
        this.onTapSwitchMode()
      }
    },

    refreshAnswerRecords: function () {
      var history = answerStore.getHistory()
      var favorites = answerStore.getFavorites()
      var currentAnswer = this.getCurrentAnswer ? this.getCurrentAnswer() : null

      this.setData({
        historyCount: history.length,
        favoriteCount: favorites.length,
        isCurrentFavorite: currentAnswer ? answerStore.isFavorite(currentAnswer) : false,
      })
    },

    formatRecordItems: function (records) {
      return records.map(function (item) {
        var createdAt = item.createdAt || Date.now()
        var enriched = answerDetail.enrichAnswer(item)
        return Object.assign({}, enriched, {
          signature: answerStore.getAnswerSignature(enriched),
          legacySignature: answerStore.getLegacyAnswerSignature(enriched),
          createdAt: createdAt,
          displayMeta: getSourceLabel(enriched.source) + " · " + util.formatTime(new Date(createdAt)),
        })
      })
    },

    resolveRecordPanelEmptyText: function (type) {
      if (typeof this.getRecordPanelEmptyText === "function") {
        return this.getRecordPanelEmptyText(type)
      }

      return type === "history" ? "还没有最近记录。" : "还没有收藏的答案。"
    },

    openRecordPanel: function (type) {
      var isHistory = type === "history"
      var items = isHistory ? answerStore.getHistory() : answerStore.getFavorites()

      this.setData({
        actionMenuVisible: false,
        recordPanelVisible: true,
        detailPanelVisible: false,
        recordPanelTitle: isHistory ? "最近答案" : "收藏夹",
        recordPanelEmptyText: this.resolveRecordPanelEmptyText(type),
        recordPanelItems: this.formatRecordItems(items),
      })
    },

    onTapShowHistory: function () {
      this.openRecordPanel("history")
    },

    onTapShowFavorites: function () {
      this.openRecordPanel("favorites")
    },

    onCloseRecordPanel: function () {
      this.setData({
        recordPanelVisible: false,
      })
    },

    openActionMenu: function () {
      this.setData({
        actionMenuVisible: true,
        recordPanelVisible: false,
        detailPanelVisible: false,
      })
    },

    onCloseActionMenu: function () {
      this.setData({
        actionMenuVisible: false,
      })
    },

    onTapMoreAction: function (e) {
      var action = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.action : ""

      this.onCloseActionMenu()

      if (action === "savePoster" && typeof this.onTapSavePosterAction === "function") {
        this.onTapSavePosterAction()
        return
      }

      if (action === "copy") {
        this.onTapCopyResult()
        return
      }

      if (action === "toggleAmbientAudio" && typeof this.onTapToggleAmbientAudioAction === "function") {
        this.onTapToggleAmbientAudioAction()
        return
      }

      if (action === "history") {
        this.onTapShowHistory()
        return
      }

      if (action === "favorites") {
        this.onTapShowFavorites()
      }
    },

    onTapShareAction: function () {
      this.onCloseActionMenu()
    },

    buildDetailPanelData: function (answer) {
      return {
        detailPanelTitle: answer && answer.detailTitle ? answer.detailTitle : "这句答案想提醒你",
        detailPanelSummary: answer && answer.detailSummary ? answer.detailSummary : "",
        detailPanelMeaning: answer && answer.detailMeaning ? answer.detailMeaning : "",
        detailPanelAdvice: answer && answer.detailAdvice ? answer.detailAdvice : "",
        detailPanelRisk: answer && answer.detailRisk ? answer.detailRisk : "",
        detailPanelQuestion: answer && answer.detailQuestion ? answer.detailQuestion : "",
      }
    },

    onTapShowDetail: function () {
      var answer = this.getCurrentAnswer ? this.getCurrentAnswer() : null
      if (!answer) {
        return
      }

      this.setData(Object.assign({
        actionMenuVisible: false,
        detailPanelVisible: true,
        recordPanelVisible: false,
      }, this.buildDetailPanelData(answer)))
    },

    onCloseDetailPanel: function () {
      this.setData({
        detailPanelVisible: false,
      })
    },

    onTapRecordItem: function (e) {
      var index = Number(e.currentTarget.dataset.index)
      var record = this.data.recordPanelItems[index]
      if (!record || typeof this.applySelectedAnswerRecord !== "function") {
        return
      }

      this.applySelectedAnswerRecord(record)
    },

    buildClipboardText: function () {
      var answer = this.getCurrentAnswer ? this.getCurrentAnswer() : null
      return answer ? answerStore.buildClipboardText(answer) : ""
    },

    onTapCopyResult: function () {
      var content = this.buildClipboardText()
      if (!content) {
        return
      }

      wx.setClipboardData({
        data: content,
        success: function () {
          wx.showToast({
            title: "已复制答案",
            icon: "none",
            duration: 1200,
          })
        }
      })
    },

    onTapToggleFavorite: function () {
      var answer = this.getCurrentAnswer ? this.getCurrentAnswer() : null
      if (!answer) {
        return
      }

      var source = typeof this.getPageMode === "function" ? this.getPageMode() : (answer.source || "answers")
      var isFavorite = answerStore.toggleFavorite(answer, source)
      this.setData({
        isCurrentFavorite: isFavorite,
      })
      this.refreshAnswerRecords()
      wx.showToast({
        title: isFavorite ? "已加入收藏" : "已取消收藏",
        icon: "none",
        duration: 1200,
      })
    },
  },
})
