var HISTORY_KEY = "the_book_of_answers.history"
var FAVORITES_KEY = "the_book_of_answers.favorites"
var MAX_HISTORY_COUNT = 12
var MAX_FAVORITES_COUNT = 50

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
  return [
    answer && answer.content ? answer.content : "",
    answer && answer.subContent ? answer.subContent : "",
    answer && answer.exp ? answer.exp : "",
  ].join("::")
}

function normalizeRecord(answer, source, createdAt) {
  var timestamp = createdAt || Date.now()
  return {
    signature: getAnswerSignature(answer),
    source: source || "answers",
    content: answer && answer.content ? answer.content : "",
    subContent: answer && answer.subContent ? answer.subContent : "",
    exp: answer && answer.exp ? answer.exp : "",
    createdAt: timestamp,
  }
}

function dedupeAndLimit(list, record, maxCount) {
  var nextList = list.filter(function (item) {
    return item.signature !== record.signature
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
  var signature = getAnswerSignature(answer)
  return getFavorites().some(function (item) {
    return item.signature === signature
  })
}

function toggleFavorite(answer, source) {
  var record = normalizeRecord(answer, source, Date.now())
  var favorites = getFavorites()
  var exists = favorites.some(function (item) {
    return item.signature === record.signature
  })

  if (exists) {
    favorites = favorites.filter(function (item) {
      return item.signature !== record.signature
    })
    safeWriteList(FAVORITES_KEY, favorites)
    return false
  }

  favorites = dedupeAndLimit(favorites, record, MAX_FAVORITES_COUNT)
  safeWriteList(FAVORITES_KEY, favorites)
  return true
}

function buildClipboardText(answer) {
  var parts = []

  if (answer && answer.content) {
    parts.push(answer.content)
  }
  if (answer && answer.subContent) {
    parts.push(answer.subContent)
  }
  if (answer && answer.exp) {
    parts.push(answer.exp)
  }

  return parts.join("\n")
}

module.exports = {
  buildClipboardText: buildClipboardText,
  getAnswerSignature: getAnswerSignature,
  getFavorites: getFavorites,
  getHistory: getHistory,
  isFavorite: isFavorite,
  recordAnswer: recordAnswer,
  toggleFavorite: toggleFavorite,
}
