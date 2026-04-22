var manualDetail = require("./answer_detail_manual.js")

var THEMES = [
  {
    key: "relationship",
    patterns: [/佳人|知音|相伴|相思|靠近|告诉她|告诉他|不可求|不得语|异乡人|无相忘|同欲|契阔|子衿|脉脉|相逢|芳草/],
    title: "这条答案更偏向关系与心意",
    summaryFocus: "你在意的不是表面的结果，而是彼此之间的距离和回应。",
    advice: "先确认自己的心意，再决定是靠近、表达，还是保留一点分寸。",
    risk: "太急着从对方那里拿到确定答案，反而容易把关系推向失衡。",
    question: "我真正想确认的，是对方的态度，还是我自己的心？",
  },
  {
    key: "selfCare",
    patterns: [/照顾好自己|睡一觉|心安|心旷神怡|勿忘心安|善待自己|开心颜|寂寞|疲惫|泪|忧患|心之适/],
    title: "这条答案更偏向照顾自己",
    summaryFocus: "这件事已经触动到你的状态，先照顾好自己比立刻解决问题更重要。",
    advice: "先让情绪、睡眠和节奏稳下来，再回头看这个问题，判断会更清楚。",
    risk: "如果带着疲惫或委屈硬撑，很容易把原本简单的事想得更重。",
    question: "在继续往前之前，我最需要先安顿好的是什么？",
  },
  {
    key: "action",
    patterns: [/出发|开始|加油干|主动|表达|出手|迎接|起跑线|早点开始|行动|走下去|出猎|春风吹又生|路转溪桥忽见/],
    title: "这条答案更偏向行动与推进",
    summaryFocus: "与其继续反复衡量，不如先让事情往前动一点点。",
    advice: "先做一个小而具体的动作，让局面从停滞变成流动。",
    risk: "真正要避免的不是行动，而是一下子用力过猛，把结果压得太重。",
    question: "我现在最小、但真实的一步行动是什么？",
  },
  {
    key: "decision",
    patterns: [/抉择|当断不断|鱼和熊掌|取舍|北行|半九十|远谋|断|选择|难封|未能远谋/],
    title: "这条答案更偏向选择与取舍",
    summaryFocus: "问题的关键不在有没有答案，而在你是否愿意承认真正重要的那一项。",
    advice: "先分清主次，再决定先保住什么、暂时放下什么。",
    risk: "什么都想兼顾，最后往往会让每一边都变得摇摆。",
    question: "如果现在只能先守住一件事，那会是什么？",
  },
  {
    key: "patience",
    patterns: [/慢慢来|等待|来日方长|总有个尽头|看得更远|提前预防|下一個天亮|下一个天亮|望尽|源源不断|未为迟也|转机|细水长流/],
    title: "这条答案更偏向节奏与时机",
    summaryFocus: "这不是否定你，而是在提醒你别急着向眼前要一个最终结果。",
    advice: "放慢一点，先观察，再决定什么时候推进会更合适。",
    risk: "因为焦虑而催促、逼问或抢进度，反而容易把本来能成的事弄乱。",
    question: "如果我先多给这件事一点时间，会看见什么新的信息？",
  },
  {
    key: "letGo",
    patterns: [/忘掉|相忘|弃之|无解|不是一路人|不是答案|可望不可即|放空|放纵|浮云|不求甚解|只可远观|无用功/],
    title: "这条答案更偏向松手与放下",
    summaryFocus: "真正困住你的，也许不是事情本身，而是你不愿意松开的执念。",
    advice: "先把力气从纠缠里收回来，很多答案会在你放松之后自己浮现。",
    risk: "越想立刻证明、抓住或挽回，越容易让问题继续消耗你。",
    question: "如果我先松开一点点，心里会不会反而更轻？",
  },
  {
    key: "caution",
    patterns: [/别|不要|慎言|不宜|勿言|忽略小问题|痛苦|荒唐|自讨没趣|有时候，爱也是一种伤害|祸患|伤人必多|多行不义必自毙/],
    title: "这条答案更偏向提醒你保持边界",
    summaryFocus: "它不是在吓你，而是在提醒你别被情绪带着跑得太快。",
    advice: "先收一收，留一点观察空间，再决定要不要继续投入。",
    risk: "如果这时候硬冲、硬说、硬证明，往往会把代价放大。",
    question: "我现在最需要守住的界限是什么？",
  },
  {
    key: "hope",
    patterns: [/转机|萌芽|天亮|暗香|活水|桃花林|柳暗花明|春风吹又生|红红火火|和谐|知己|好还乡|光/],
    title: "这条答案更偏向恢复与转机",
    summaryFocus: "局面并没有你想的那样封死，变化正在慢慢积累。",
    advice: "保留一点耐心，继续做对的事，让好的变化有机会长出来。",
    risk: "太早灰心，反而会在转机出现前先一步放弃。",
    question: "如果我再给这件事一点时间，它会不会自己长出新的路？",
  },
]

var FALLBACK_THEME = {
  key: "perspective",
  title: "这条答案更偏向换个角度看问题",
  summaryFocus: "它更像是在提醒你，不要只盯着眼前的一种解法。",
  advice: "稍微退后一步，换个距离、换个顺序，再看这件事。",
  risk: "把问题看得太窄，容易让自己误以为只有一种结论。",
  question: "如果我站远一点，再看一次，会不会有不一样的理解？",
}

function normalizeText(value) {
  return value ? String(value).replace(/\s+/g, "") : ""
}

function extractSourceLabel(subContent) {
  var matched = /《([^》]+)》/.exec(subContent || "")
  return matched ? "《" + matched[1] + "》" : ""
}

function getTheme(answer) {
  var text = normalizeText((answer && answer.content) || "") + " " + normalizeText((answer && answer.exp) || "")

  for (var i = 0; i < THEMES.length; i++) {
    var theme = THEMES[i]
    var matched = theme.patterns.some(function (pattern) {
      return pattern.test(text)
    })
    if (matched) {
      return theme
    }
  }

  return FALLBACK_THEME
}

function buildDetailSummary(answer, theme, sourceLabel) {
  var exp = (answer && answer.exp) || ""
  var summaryPrefix = sourceLabel ? sourceLabel + "里的这句提醒，" : "这句答案，"
  var expSuffix = exp ? "它表面的意思是“" + exp.replace(/\.{3,}|…+/g, "").trim() + "”，" : ""

  return summaryPrefix + expSuffix + theme.summaryFocus
}

function resolveAnswerId(answer) {
  var base = answer || {}
  if (base.id) {
    return base.id
  }

  return manualDetail.ANSWER_ID_BY_CONTENT[base.content || ""] || ""
}

function enrichAnswer(answer) {
  var base = answer || {}
  var sourceLabel = extractSourceLabel(base.subContent)
  var theme = getTheme(base)
  var resolvedId = resolveAnswerId(base)
  var manualFields = manualDetail.DETAILS_BY_ID[resolvedId] || {}
  var enriched = {
    detailTitle: theme.title,
    detailSummary: buildDetailSummary(base, theme, sourceLabel),
    detailMeaning: "如果你把它放回当下的问题里看，它更像是在提醒你：" + theme.summaryFocus,
    detailAdvice: "现在更适合这样做：" + theme.advice,
    detailRisk: "需要留意的是：" + theme.risk,
    detailQuestion: "可以先问问自己：" + theme.question,
  }

  return Object.assign({}, base, resolvedId ? { id: resolvedId } : {}, enriched, manualFields)
}

module.exports = {
  enrichAnswer: enrichAnswer,
  resolveAnswerId: resolveAnswerId,
}
