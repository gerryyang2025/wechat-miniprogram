var answerDetail = require("./answer_detail.js")

var HISTORY_KEY = "the_book_of_answers.history"
var FAVORITES_KEY = "the_book_of_answers.favorites"
var MAX_HISTORY_COUNT = 12
var MAX_FAVORITES_COUNT = 50

function getLegacyAnswerSignature(answer) {
  return [
    answer && answer.content ? answer.content : "",
    answer && answer.subContent ? answer.subContent : "",
    answer && answer.exp ? answer.exp : "",
  ].join("::")
}

function safeReadList(key) {
  try {
    var list = wx.getStorageSync(key)
    return Array.isArray(list) ? list : []
  } catch (error) {
    return []
  }
}

function safeWriteList(key, list) {
  try {
    wx.setStorageSync(key, list)
    return true
  } catch (error) {
    return false
  }
}

function getAnswerSignature(answer) {
  return answerDetail.resolveAnswerId(answer) || getLegacyAnswerSignature(answer)
}

function getRecordIdentifiers(record) {
  var identifiers = []
  var primarySignature = getAnswerSignature(record)
  var legacySignature = record && record.legacySignature ? record.legacySignature : getLegacyAnswerSignature(record)

  if (primarySignature) {
    identifiers.push(primarySignature)
  }
  if (legacySignature && identifiers.indexOf(legacySignature) === -1) {
    identifiers.push(legacySignature)
  }

  return identifiers
}

function isSameRecord(left, right) {
  var leftIdentifiers = getRecordIdentifiers(left)
  var rightIdentifiers = getRecordIdentifiers(right)

  return leftIdentifiers.some(function (identifier) {
    return rightIdentifiers.indexOf(identifier) >= 0
  })
}

function normalizeRecord(answer, source, createdAt) {
  var timestamp = createdAt || Date.now()
  var enriched = answerDetail.enrichAnswer(answer || {})
  var resolvedId = answerDetail.resolveAnswerId(enriched)
  return {
    signature: getAnswerSignature(enriched),
    legacySignature: getLegacyAnswerSignature(enriched),
    id: resolvedId,
    source: source || (answer && answer.source) || "answers",
    content: enriched.content || "",
    subContent: enriched.subContent || "",
    exp: enriched.exp || "",
    detailTitle: enriched.detailTitle || "",
    detailSummary: enriched.detailSummary || "",
    detailMeaning: enriched.detailMeaning || "",
    detailAdvice: enriched.detailAdvice || "",
    detailRisk: enriched.detailRisk || "",
    detailQuestion: enriched.detailQuestion || "",
    createdAt: timestamp,
  }
}

function dedupeAndLimit(list, record, maxCount) {
  var nextList = list.filter(function (item) {
    return !isSameRecord(item, record)
  })

  nextList.unshift(record)

  if (nextList.length > maxCount) {
    nextList = nextList.slice(0, maxCount)
  }

  return nextList
}

function getHistory() {
  return safeReadList(HISTORY_KEY)
}

function getFavorites() {
  return safeReadList(FAVORITES_KEY)
}

function recordAnswer(answer, source) {
  var record = normalizeRecord(answer, source, Date.now())
  var history = dedupeAndLimit(getHistory(), record, MAX_HISTORY_COUNT)
  safeWriteList(HISTORY_KEY, history)
  return record
}

function isFavorite(answer) {
  var record = normalizeRecord(answer)
  return getFavorites().some(function (item) {
    return isSameRecord(item, record)
  })
}

function toggleFavorite(answer, source) {
  var record = normalizeRecord(answer, source, Date.now())
  var favorites = getFavorites()
  var exists = favorites.some(function (item) {
    return isSameRecord(item, record)
  })

  if (exists) {
    favorites = favorites.filter(function (item) {
      return !isSameRecord(item, record)
    })
    safeWriteList(FAVORITES_KEY, favorites)
    return false
  }

  favorites = dedupeAndLimit(favorites, record, MAX_FAVORITES_COUNT)
  safeWriteList(FAVORITES_KEY, favorites)
  return true
}

function buildClipboardText(answer) {
  var enriched = answerDetail.enrichAnswer(answer || {})
  var parts = []

  if (enriched.content) {
    parts.push(enriched.content)
  }
  if (enriched.subContent) {
    parts.push(enriched.subContent)
  }
  if (enriched.exp) {
    parts.push(enriched.exp)
  }
  if (enriched.detailTitle) {
    parts.push("")
    parts.push(enriched.detailTitle)
  }
  if (enriched.detailSummary) {
    parts.push(enriched.detailSummary)
  }
  if (enriched.detailMeaning) {
    parts.push(enriched.detailMeaning)
  }
  if (enriched.detailAdvice) {
    parts.push(enriched.detailAdvice)
  }
  if (enriched.detailRisk) {
    parts.push(enriched.detailRisk)
  }
  if (enriched.detailQuestion) {
    parts.push(enriched.detailQuestion)
  }

  return parts.join("\n")
}

module.exports = {
  buildClipboardText: buildClipboardText,
  getAnswerSignature: getAnswerSignature,
  getFavorites: getFavorites,
  getHistory: getHistory,
  getLegacyAnswerSignature: getLegacyAnswerSignature,
  isFavorite: isFavorite,
  recordAnswer: recordAnswer,
  toggleFavorite: toggleFavorite,
}
