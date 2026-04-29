function drawRoundedRectPath(ctx, x, y, width, height, radius) {
  var r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function fillRoundedRect(ctx, x, y, width, height, radius, fillStyle) {
  drawRoundedRectPath(ctx, x, y, width, height, radius)
  ctx.fillStyle = fillStyle
  ctx.fill()
}

function fitLineWithEllipsis(ctx, text, maxWidth) {
  var line = text || ""
  while (line && ctx.measureText(line + "…").width > maxWidth) {
    line = line.slice(0, -1)
  }
  return line + "…"
}

function wrapText(ctx, text, maxWidth, maxLines) {
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

  if (content.length && lines.length === maxLines) {
    var joinedLength = lines.join("").length
    if (joinedLength < content.length) {
      lines[maxLines - 1] = fitLineWithEllipsis(ctx, lines[maxLines - 1], maxWidth)
    }
  }

  return lines
}

function fillWrappedBlock(ctx, options) {
  var x = options.x || 0
  var y = options.y || 0
  var maxWidth = options.maxWidth || 0
  var maxLines = options.maxLines || 1
  var lineHeight = options.lineHeight || 32
  var lines = []

  ctx.save()
  ctx.font = options.font
  ctx.fillStyle = options.fillStyle
  ctx.textAlign = options.textAlign || "left"
  ctx.textBaseline = "top"
  lines = wrapText(ctx, options.text, maxWidth, maxLines)

  lines.forEach(function (line, index) {
    ctx.fillText(line, x, y + index * lineHeight)
  })
  ctx.restore()

  return {
    lines: lines,
    height: lines.length * lineHeight,
  }
}

function createGradient(ctx, width, height, colors) {
  var gradient = ctx.createLinearGradient(0, 0, width, height)
  colors.forEach(function (item) {
    gradient.addColorStop(item.stop, item.color)
  })
  return gradient
}

function drawBackgroundDecorations(ctx, width, height, theme) {
  ctx.save()
  ctx.globalAlpha = 0.2
  ctx.fillStyle = theme.accentColor
  ctx.beginPath()
  ctx.arc(width * 0.86, height * 0.14, Math.max(width, height) * 0.16, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(width * 0.14, height * 0.88, Math.max(width, height) * 0.18, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawLabel(ctx, text, x, y, theme, compact) {
  var fontSize = compact ? 18 : 22
  var horizontalPadding = compact ? 16 : 18
  var verticalPadding = compact ? 8 : 10
  var font = "bold " + fontSize + "px sans-serif"

  ctx.save()
  ctx.font = font
  var textWidth = ctx.measureText(text).width
  var labelWidth = textWidth + horizontalPadding * 2
  var labelHeight = fontSize + verticalPadding * 2
  fillRoundedRect(ctx, x, y, labelWidth, labelHeight, labelHeight / 2, theme.labelBg)
  ctx.fillStyle = theme.labelText
  ctx.textAlign = "left"
  ctx.textBaseline = "middle"
  ctx.fillText(text, x + horizontalPadding, y + labelHeight / 2 + 1)
  ctx.restore()

  return {
    width: labelWidth,
    height: labelHeight,
  }
}

function getDetailBadgeMetrics(ctx, text, compact, dense) {
  var fontSize = compact ? 13 : (dense ? 15 : 16)
  var horizontalPadding = compact ? 10 : (dense ? 12 : 13)
  var verticalPadding = compact ? 6 : 7
  var font = "bold " + fontSize + "px sans-serif"

  ctx.save()
  ctx.font = font
  var textWidth = ctx.measureText(text).width
  ctx.restore()

  return {
    font: font,
    fontSize: fontSize,
    horizontalPadding: horizontalPadding,
    verticalPadding: verticalPadding,
    width: textWidth + horizontalPadding * 2,
    height: fontSize + verticalPadding * 2,
  }
}

function drawDetailBadge(ctx, text, x, y, theme, compact, dense) {
  var metrics = getDetailBadgeMetrics(ctx, text, compact, dense)

  ctx.save()
  ctx.font = metrics.font
  fillRoundedRect(ctx, x, y, metrics.width, metrics.height, Math.round(metrics.height / 2), theme.detailBadgeBg || theme.labelBg || "rgba(255,255,255,0.28)")
  ctx.fillStyle = theme.detailBadgeText || theme.detailLabelText || theme.labelText
  ctx.textAlign = "left"
  ctx.textBaseline = "middle"
  ctx.fillText(text, x + metrics.horizontalPadding, y + metrics.height / 2 + 1)
  ctx.restore()

  return {
    width: metrics.width,
    height: metrics.height,
  }
}

function getDetailCardLayoutMetrics(compact, dense) {
  var denseOuterGap = 20
  var denseInnerGap = 16
  var denseSectionGap = 14

  return {
    minHeight: compact ? 130 : (dense ? 196 : 220),
    headerGap: compact ? 8 : (dense ? 12 : 12),
    titleGap: compact ? 10 : (dense ? denseInnerGap : 14),
    dividerGap: compact ? 12 : (dense ? denseInnerGap : 18),
    paddingX: compact ? 18 : (dense ? 22 : 24),
    paddingY: compact ? 16 : (dense ? denseOuterGap : 20),
    lineHeight: compact ? 22 : (dense ? 26 : 28),
    titleLineHeight: compact ? 26 : (dense ? 32 : 34),
    sectionBadgeGap: compact ? 6 : (dense ? 7 : 8),
    sectionBlockGap: compact ? 10 : (dense ? denseInnerGap : 14),
    softCardPaddingX: compact ? 12 : (dense ? 14 : 16),
    softCardPaddingY: compact ? 10 : (dense ? denseSectionGap : 13),
    softCardLabelGap: compact ? 6 : (dense ? 8 : 7),
    cardRadius: compact ? 18 : 24,
    softCardRadius: compact ? 14 : (dense ? 18 : 20),
    labelFont: compact ? "bold 16px sans-serif" : (dense ? "bold 18px sans-serif" : "bold 20px sans-serif"),
    titleFont: compact ? "bold 22px sans-serif" : (dense ? "bold 28px sans-serif" : "bold 30px sans-serif"),
    bodyFont: compact ? "16px sans-serif" : (dense ? "20px sans-serif" : "22px sans-serif"),
  }
}

function measureTextBlockHeight(ctx, text, maxWidth, maxLines, lineHeight, font) {
  ctx.save()
  ctx.font = font
  var lines = wrapText(ctx, text, maxWidth, maxLines)
  ctx.restore()
  return Math.max(lines.length, 1) * lineHeight
}

function measureDetailCardHeight(ctx, options) {
  var compact = !!options.compact
  var dense = !!options.dense
  var width = options.width
  var metrics = getDetailCardLayoutMetrics(compact, dense)
  var sections = buildDetailSections(options)
  var title = options.detailTitle || "这句答案想提醒你"
  var contentWidth = width - metrics.paddingX * 2
  var headerBadge = getDetailBadgeMetrics(ctx, "详细解读", compact, dense)
  var totalHeight = metrics.paddingY

  totalHeight += headerBadge.height
  totalHeight += metrics.headerGap
  totalHeight += measureTextBlockHeight(ctx, title, contentWidth, 2, metrics.titleLineHeight, metrics.titleFont)
  totalHeight += metrics.titleGap
  totalHeight += metrics.dividerGap

  sections.forEach(function (section, index) {
    var badgeMetrics = getDetailBadgeMetrics(ctx, section.label, compact, dense)
    var bodyHeight = measureTextBlockHeight(ctx, section.text, contentWidth, section.maxLines || 1, metrics.lineHeight, metrics.bodyFont)

    if (section.blockStyle === "soft-card") {
      totalHeight += metrics.softCardPaddingY * 2 + badgeMetrics.height + metrics.softCardLabelGap + bodyHeight
    } else {
      totalHeight += badgeMetrics.height + metrics.sectionBadgeGap + bodyHeight
    }

    if (index < sections.length - 1) {
      totalHeight += metrics.sectionBlockGap
    }
  })

  totalHeight += metrics.paddingY

  return Math.max(totalHeight, metrics.minHeight)
}

function drawQrCard(ctx, x, y, cardSize, qrImage) {
  ctx.save()
  ctx.shadowColor = "rgba(89, 37, 52, 0.08)"
  ctx.shadowBlur = Math.round(cardSize * 0.12)
  ctx.shadowOffsetY = Math.round(cardSize * 0.05)
  fillRoundedRect(ctx, x, y, cardSize, cardSize, Math.round(cardSize * 0.16), "rgba(255,255,255,0.96)")
  ctx.restore()

  ctx.save()
  drawRoundedRectPath(ctx, x, y, cardSize, cardSize, Math.round(cardSize * 0.16))
  ctx.clip()
  ctx.drawImage(qrImage, x, y, cardSize, cardSize)
  ctx.restore()
}

function trimLeadingPrefix(text, prefixes) {
  var content = text ? String(text).trim() : ""
  var normalizedPrefixes = Array.isArray(prefixes) ? prefixes : []

  normalizedPrefixes.some(function (prefix) {
    if (content.indexOf(prefix) === 0) {
      content = content.slice(prefix.length)
      return true
    }
    return false
  })

  return content
}

function buildDetailSections(options) {
  var sections = []

  if (options.detailSummary) {
    sections.push({
      label: "解读",
      text: trimLeadingPrefix(options.detailSummary),
      maxLines: 2,
      blockStyle: "soft-card",
    })
  }

  if (options.detailMeaning) {
    sections.push({
      label: "提醒",
      text: trimLeadingPrefix(options.detailMeaning, ["如果你把它放回当下的问题里看，它更像是在提醒你："]),
      maxLines: 2,
      blockStyle: "soft-card",
    })
  }

  if (options.detailAdvice) {
    sections.push({
      label: "建议",
      text: trimLeadingPrefix(options.detailAdvice, ["现在更适合这样做："]),
      maxLines: 2,
      blockStyle: "soft-card",
    })
  }

  if (options.detailRisk) {
    sections.push({
      label: "留意",
      text: trimLeadingPrefix(options.detailRisk, ["需要留意的是："]),
      maxLines: 2,
      blockStyle: "soft-card",
    })
  }

  if (options.detailQuestion) {
    sections.push({
      label: "想想",
      text: trimLeadingPrefix(options.detailQuestion, ["可以先问问自己："]),
      maxLines: 2,
      blockStyle: "soft-card",
    })
  }

  return sections.filter(function (section) {
    return section.text
  })
}

function buildMetaRows(options) {
  var rows = []

  if (options.subContent) {
    rows.push({
      label: "改自",
      text: trimLeadingPrefix(options.subContent, ["改自：", "改自:"]),
      tone: "body",
      maxLines: 2,
    })
  }

  if (options.exp) {
    rows.push({
      label: "释义",
      text: options.exp,
      tone: "muted",
      maxLines: 3,
    })
  }

  return rows.filter(function (row) {
    return row.text
  })
}

function getMetaPanelLayoutMetrics(compact, dense) {
  return {
    paddingX: compact ? 16 : (dense ? 18 : 20),
    paddingY: compact ? 14 : (dense ? 16 : 16),
    rowGap: compact ? 10 : (dense ? 12 : 14),
    badgeGap: compact ? 7 : (dense ? 9 : 8),
    textGap: compact ? 8 : (dense ? 9 : 10),
    lineHeight: compact ? 22 : (dense ? 24 : 26),
    titleRadius: compact ? 14 : 18,
    bodyFont: compact ? "18px sans-serif" : (dense ? "20px sans-serif" : "22px sans-serif"),
    mutedFont: compact ? "16px sans-serif" : (dense ? "18px sans-serif" : "19px sans-serif"),
    columnGap: compact ? 12 : (dense ? 18 : 16),
  }
}

function getMetaPanelColumnLayout(width, metrics) {
  var contentWidth = width - metrics.paddingX * 2
  var leftWidth = Math.round(contentWidth * 0.36)
  var rightWidth = contentWidth - leftWidth - metrics.columnGap

  if (rightWidth < 140) {
    rightWidth = 140
    leftWidth = contentWidth - metrics.columnGap - rightWidth
  }

  return {
    contentWidth: contentWidth,
    leftWidth: leftWidth,
    rightWidth: rightWidth,
  }
}

function measureMetaPanelHeight(ctx, options) {
  var compact = !!options.compact
  var dense = !!options.dense
  var width = options.width
  var rows = buildMetaRows(options)
  var metrics = getMetaPanelLayoutMetrics(compact, dense)
  var totalHeight = metrics.paddingY * 2

  if (dense && rows.length === 2) {
    var columnLayout = getMetaPanelColumnLayout(width, metrics)
    var leftRow = rows[0]
    var rightRow = rows[1]
    var leftBadgeMetrics = getDetailBadgeMetrics(ctx, leftRow.label, compact, dense)
    var rightBadgeMetrics = getDetailBadgeMetrics(ctx, rightRow.label, compact, dense)
    var leftBodyHeight = measureTextBlockHeight(ctx, leftRow.text, columnLayout.leftWidth, leftRow.maxLines || 2, metrics.lineHeight, metrics.bodyFont)
    var rightBodyHeight = measureTextBlockHeight(ctx, rightRow.text, columnLayout.rightWidth, rightRow.maxLines || 2, metrics.lineHeight, metrics.mutedFont)

    totalHeight += Math.max(
      leftBadgeMetrics.height + metrics.badgeGap + leftBodyHeight,
      rightBadgeMetrics.height + metrics.badgeGap + rightBodyHeight
    )
    return totalHeight
  }

  var contentWidth = width - metrics.paddingX * 2
  rows.forEach(function (row, index) {
    var badgeMetrics = getDetailBadgeMetrics(ctx, row.label, compact, dense)
    var bodyFont = row.tone === "muted" ? metrics.mutedFont : metrics.bodyFont
    var bodyHeight = measureTextBlockHeight(ctx, row.text, contentWidth, row.maxLines || 2, metrics.lineHeight, bodyFont)

    totalHeight += badgeMetrics.height
    totalHeight += metrics.badgeGap
    totalHeight += bodyHeight

    if (index < rows.length - 1) {
      totalHeight += metrics.rowGap
    }
  })

  return rows.length ? totalHeight : 0
}

function drawMetaPanel(ctx, options) {
  var compact = !!options.compact
  var dense = !!options.dense
  var x = options.x
  var y = options.y
  var width = options.width
  var height = options.height
  var theme = options.theme
  var rows = buildMetaRows(options)
  var metrics = getMetaPanelLayoutMetrics(compact, dense)
  var contentX = x + metrics.paddingX
  var currentY = y + metrics.paddingY

  if (!rows.length || height <= 0) {
    return 0
  }

  fillRoundedRect(
    ctx,
    x,
    y,
    width,
    height,
    metrics.titleRadius,
    theme.metaCardBg || "rgba(255,255,255,0.22)"
  )

  ctx.save()
  ctx.strokeStyle = theme.metaCardBorder || "rgba(177,83,93,0.10)"
  ctx.lineWidth = 1
  drawRoundedRectPath(ctx, x, y, width, height, metrics.titleRadius)
  ctx.stroke()
  ctx.restore()

  if (dense && rows.length === 2) {
    var columnLayout = getMetaPanelColumnLayout(width, metrics)
    var leftRow = rows[0]
    var rightRow = rows[1]
    var rightX = contentX + columnLayout.leftWidth + metrics.columnGap
    var dividerX = contentX + columnLayout.leftWidth + Math.round(metrics.columnGap / 2)
    var leftBadge = drawDetailBadge(ctx, leftRow.label, contentX, currentY, {
      detailBadgeBg: theme.metaBadgeBg || theme.detailBadgeBg || theme.labelBg,
      detailBadgeText: theme.metaBadgeText || theme.detailBadgeText || theme.labelText,
      detailLabelText: theme.metaBadgeText || theme.detailBadgeText || theme.labelText,
      labelBg: theme.metaBadgeBg || theme.detailBadgeBg || theme.labelBg,
      labelText: theme.metaBadgeText || theme.detailBadgeText || theme.labelText,
    }, compact, dense)
    var rightBadge = drawDetailBadge(ctx, rightRow.label, rightX, currentY, {
      detailBadgeBg: theme.metaSecondaryBadgeBg || theme.metaBadgeBg || theme.detailBadgeBg || theme.labelBg,
      detailBadgeText: theme.metaSecondaryBadgeText || theme.metaMutedText || theme.metaBadgeText || theme.detailBadgeText || theme.labelText,
      detailLabelText: theme.metaSecondaryBadgeText || theme.metaMutedText || theme.metaBadgeText || theme.detailBadgeText || theme.labelText,
      labelBg: theme.metaSecondaryBadgeBg || theme.metaBadgeBg || theme.detailBadgeBg || theme.labelBg,
      labelText: theme.metaSecondaryBadgeText || theme.metaMutedText || theme.metaBadgeText || theme.detailBadgeText || theme.labelText,
    }, compact, dense)
    var leftTextY = currentY + leftBadge.height + metrics.badgeGap
    var rightTextY = currentY + rightBadge.height + metrics.badgeGap

    fillWrappedBlock(ctx, {
      x: contentX,
      y: leftTextY,
      maxWidth: columnLayout.leftWidth,
      maxLines: leftRow.maxLines || 2,
      lineHeight: metrics.lineHeight,
      font: metrics.bodyFont,
      fillStyle: theme.metaBodyText || theme.bodyText,
      text: leftRow.text,
    })

    fillWrappedBlock(ctx, {
      x: rightX,
      y: rightTextY,
      maxWidth: columnLayout.rightWidth,
      maxLines: rightRow.maxLines || 2,
      lineHeight: metrics.lineHeight,
      font: metrics.mutedFont,
      fillStyle: theme.metaMutedText || theme.mutedText,
      text: rightRow.text,
    })

    ctx.save()
    ctx.strokeStyle = theme.metaDividerColor || theme.metaCardBorder || "rgba(177,83,93,0.10)"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(dividerX, y + metrics.paddingY + 2)
    ctx.lineTo(dividerX, y + height - metrics.paddingY - 2)
    ctx.stroke()
    ctx.restore()

    return height
  }

  var contentWidth = width - metrics.paddingX * 2
  rows.forEach(function (row, index) {
    var badge = drawDetailBadge(ctx, row.label, contentX, currentY, {
      detailBadgeBg: theme.metaBadgeBg || theme.detailBadgeBg || theme.labelBg,
      detailBadgeText: theme.metaBadgeText || theme.detailBadgeText || theme.labelText,
      detailLabelText: theme.metaBadgeText || theme.detailBadgeText || theme.labelText,
      labelBg: theme.metaBadgeBg || theme.detailBadgeBg || theme.labelBg,
      labelText: theme.metaBadgeText || theme.detailBadgeText || theme.labelText,
    }, compact, dense)
    currentY += badge.height + metrics.badgeGap

    var bodyFont = row.tone === "muted" ? metrics.mutedFont : metrics.bodyFont
    var bodyColor = row.tone === "muted"
      ? (theme.metaMutedText || theme.mutedText)
      : (theme.metaBodyText || theme.bodyText)
    var block = fillWrappedBlock(ctx, {
      x: contentX,
      y: currentY,
      maxWidth: contentWidth,
      maxLines: 2,
      lineHeight: metrics.lineHeight,
      font: bodyFont,
      fillStyle: bodyColor,
      text: row.text,
    })
    currentY += block.height

    if (index < rows.length - 1) {
      currentY += metrics.rowGap
    }
  })

  return height
}

function drawDetailCard(ctx, options) {
  var compact = !!options.compact
  var dense = !!options.dense
  var x = options.x
  var y = options.y
  var width = options.width
  var height = options.height
  var theme = options.theme
  var title = options.detailTitle || "这句答案想提醒你"
  var sections = buildDetailSections(options)
  var metrics = getDetailCardLayoutMetrics(compact, dense)
  var currentY = y + metrics.paddingY
  var contentX = x + metrics.paddingX
  var contentWidth = width - metrics.paddingX * 2
  var bottomY = y + height - metrics.paddingY

  if (!title && !sections.length) {
    return 0
  }

  if (height < metrics.minHeight) {
    return 0
  }

  var cardFill = theme.detailCardBg || "rgba(255,255,255,0.68)"

  if (dense) {
    ctx.save()
    ctx.shadowColor = "rgba(132, 55, 87, 0.10)"
    ctx.shadowBlur = 18
    ctx.shadowOffsetY = 10
    fillRoundedRect(ctx, x, y, width, height, metrics.cardRadius, cardFill)
    ctx.restore()
  } else {
    fillRoundedRect(ctx, x, y, width, height, metrics.cardRadius, cardFill)
  }

  if (dense) {
    ctx.save()
    ctx.globalAlpha = 0.12
    ctx.fillStyle = theme.accentColor || "#FFF1D7"
    ctx.beginPath()
    ctx.arc(x + width - 34, y + 34, 52, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    fillRoundedRect(
      ctx,
      x + 2,
      y + 2,
      width - 4,
      height - 4,
      Math.max(metrics.cardRadius - 2, 12),
      "rgba(255,255,255,0.12)"
    )
  }

  var headerBadge = drawDetailBadge(ctx, "详细解读", contentX, currentY, theme, compact, dense)
  currentY += headerBadge.height + metrics.headerGap

  var titleBlock = fillWrappedBlock(ctx, {
    x: contentX,
    y: currentY,
    maxWidth: contentWidth,
    maxLines: 2,
    lineHeight: metrics.titleLineHeight,
    font: metrics.titleFont,
    fillStyle: theme.detailTitleText || theme.answerText,
    text: title,
  })
  currentY += titleBlock.height + metrics.titleGap

  ctx.save()
  ctx.strokeStyle = theme.detailDividerColor || theme.dividerColor
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(contentX, currentY)
  ctx.lineTo(contentX + Math.min(contentWidth * (dense ? 0.72 : 1), contentWidth), currentY)
  ctx.stroke()
  ctx.restore()

  if (dense) {
    ctx.save()
    ctx.fillStyle = theme.detailBadgeText || theme.detailLabelText || theme.labelText
    ctx.globalAlpha = 0.55
    ctx.beginPath()
    ctx.arc(contentX + Math.min(contentWidth * 0.76, contentWidth - 8), currentY, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  currentY += metrics.dividerGap

  sections.some(function (section, index) {
    var previewBadge = getDetailBadgeMetrics(ctx, section.label, compact, dense)
    var isSoftCard = section.blockStyle === "soft-card"
    var minSectionHeight = isSoftCard
      ? metrics.softCardPaddingY * 2 + previewBadge.height + metrics.softCardLabelGap + metrics.lineHeight
      : previewBadge.height + metrics.sectionBadgeGap + metrics.lineHeight
    var remainingSections = sections.length - index - 1
    var reservedHeight = remainingSections * (minSectionHeight + metrics.sectionBlockGap)
    var availableHeight = bottomY - currentY - reservedHeight

    if (availableHeight < minSectionHeight) {
      return true
    }

    if (isSoftCard) {
      availableHeight = bottomY - currentY - reservedHeight
      var naturalSoftCardHeight = metrics.softCardPaddingY * 2 + previewBadge.height + metrics.softCardLabelGap + metrics.lineHeight * Math.max(1, Math.min(section.maxLines || 1, 2))
      var softCardHeight = Math.min(availableHeight, Math.max(minSectionHeight, naturalSoftCardHeight))
      var softCardY = currentY
      var softCardTextX = contentX + metrics.softCardPaddingX
      var softCardTextY = softCardY + metrics.softCardPaddingY
      var softCardTextWidth = contentWidth - metrics.softCardPaddingX * 2

      fillRoundedRect(
        ctx,
        contentX,
        softCardY,
        contentWidth,
        softCardHeight,
        metrics.softCardRadius,
        theme.detailSoftCardBg || "rgba(255,255,255,0.42)"
      )

      if (dense) {
        ctx.save()
        ctx.strokeStyle = theme.detailSoftCardBorder || "rgba(177,83,93,0.10)"
        ctx.lineWidth = 1
        drawRoundedRectPath(ctx, contentX, softCardY, contentWidth, softCardHeight, metrics.softCardRadius)
        ctx.stroke()
        ctx.restore()
      }

      var softCardBadge = drawDetailBadge(ctx, section.label, softCardTextX, softCardTextY, theme, compact, dense)
      softCardTextY += softCardBadge.height + metrics.softCardLabelGap

      availableHeight = softCardY + softCardHeight - metrics.softCardPaddingY - softCardTextY
      var softCardAllowedLines = Math.min(section.maxLines || 1, Math.max(1, Math.floor(availableHeight / metrics.lineHeight)))

      if (availableHeight < metrics.lineHeight) {
        return true
      }

      fillWrappedBlock(ctx, {
        x: softCardTextX,
        y: softCardTextY,
        maxWidth: softCardTextWidth,
        maxLines: softCardAllowedLines,
        lineHeight: metrics.lineHeight,
        font: metrics.bodyFont,
        fillStyle: theme.detailBodyText || theme.bodyText,
        text: section.text,
      })

      currentY += softCardHeight
    } else {
      var badge = drawDetailBadge(ctx, section.label, contentX, currentY, theme, compact, dense)
      currentY += badge.height + metrics.sectionBadgeGap

      availableHeight = bottomY - currentY - reservedHeight
      var allowedLines = Math.min(section.maxLines || 1, Math.max(1, Math.floor(availableHeight / metrics.lineHeight)))

      if (availableHeight < metrics.lineHeight) {
        return true
      }

      var block = fillWrappedBlock(ctx, {
        x: contentX,
        y: currentY,
        maxWidth: contentWidth,
        maxLines: allowedLines,
        lineHeight: metrics.lineHeight,
        font: metrics.bodyFont,
        fillStyle: theme.detailBodyText || theme.bodyText,
        text: section.text,
      })

      currentY += block.height
    }

    if (index < sections.length - 1) {
      currentY += metrics.sectionBlockGap
    }

    return false
  })

  return Math.min(height, currentY - y + metrics.paddingY)
}

function drawQuoteShareImage(ctx, options) {
  var width = options.width
  var height = options.height
  var theme = options.theme
  var compact = height <= 420
  var layoutVariant = options.layoutVariant || "default"
  var isPosterLayout = layoutVariant === "poster"
  var modeLabelText = options.modeLabel ? String(options.modeLabel).trim() : ""
  var hasModeLabel = !!modeLabelText
  var headingText = options.heading ? String(options.heading).trim() : ""
  var hasHeading = !!headingText
  var hasQrImage = !!options.qrImage
  var hasBackgroundImage = !!options.backgroundImage
  var showDetail = !!options.showDetail
  var cardX = Math.round(width * 0.08)
  var cardY = Math.round(height * (isPosterLayout && !compact ? 0.072 : 0.08))
  var cardWidth = width - cardX * 2
  var cardHeight = height - cardY * 2
  var innerPadding = compact ? 24 : (isPosterLayout ? 30 : 32)
  var innerX = cardX + innerPadding
  var innerY = cardY + innerPadding
  var innerWidth = cardWidth - innerPadding * 2
  var answerMaxLines = compact ? 3 : 4
  var subContentMaxLines = compact ? 2 : 3
  var expMaxLines = compact ? 2 : 3
  var headingGap = compact ? 12 : (isPosterLayout ? 16 : 18)
  var answerGap = compact ? 18 : (isPosterLayout ? 22 : 22)
  var dividerGap = compact ? 18 : (isPosterLayout ? 20 : 22)
  var subContentGap = compact ? 14 : (isPosterLayout ? 14 : 18)
  var expGap = compact ? 14 : (isPosterLayout ? 14 : 20)
  var metaPanelGap = compact ? 16 : (isPosterLayout ? 24 : 20)
  var currentY = innerY

  ctx.clearRect(0, 0, width, height)
  if (hasBackgroundImage) {
    ctx.drawImage(options.backgroundImage, 0, 0, width, height)
  } else {
    ctx.fillStyle = createGradient(ctx, width, height, theme.backgroundColors)
    ctx.fillRect(0, 0, width, height)
    drawBackgroundDecorations(ctx, width, height, theme)
  }
  fillRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, compact ? 24 : 32, theme.cardColor)

  if (hasModeLabel) {
    var labelRect = drawLabel(ctx, modeLabelText, innerX, currentY, theme, compact)
    currentY += labelRect.height + (compact ? 14 : 18)
  } else if (!compact) {
    currentY += isPosterLayout ? 4 : 2
  }

  if (hasHeading) {
    var headingBlock = fillWrappedBlock(ctx, {
      x: innerX,
      y: currentY,
      maxWidth: innerWidth,
      maxLines: 1,
      lineHeight: compact ? 24 : (isPosterLayout && !hasModeLabel ? 30 : 28),
      font: compact ? "20px sans-serif" : (isPosterLayout && !hasModeLabel ? "24px sans-serif" : "22px sans-serif"),
      fillStyle: theme.headingText,
      text: headingText,
    })
    currentY += headingBlock.height + headingGap
  }

  var answerBlock = fillWrappedBlock(ctx, {
    x: innerX,
    y: currentY,
    maxWidth: innerWidth,
    maxLines: answerMaxLines,
    lineHeight: compact ? 42 : 48,
    font: compact ? "bold 30px sans-serif" : "bold 36px sans-serif",
    fillStyle: theme.answerText,
    text: options.answer,
  })
  currentY += answerBlock.height + answerGap

  ctx.save()
  ctx.strokeStyle = theme.dividerColor
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(innerX, currentY)
  ctx.lineTo(innerX + innerWidth, currentY)
  ctx.stroke()
  ctx.restore()
  currentY += dividerGap

  if (isPosterLayout) {
    var metaPanelHeight = measureMetaPanelHeight(ctx, {
      width: innerWidth,
      compact: compact,
      dense: true,
      subContent: options.subContent,
      exp: options.exp,
    })

    if (metaPanelHeight > 0) {
      drawMetaPanel(ctx, {
        x: innerX,
        y: currentY,
        width: innerWidth,
        height: metaPanelHeight,
        compact: compact,
        dense: true,
        subContent: options.subContent,
        exp: options.exp,
        theme: theme,
      })
      currentY += metaPanelHeight + metaPanelGap
    }
  } else {
    var subContentBlock = fillWrappedBlock(ctx, {
      x: innerX,
      y: currentY,
      maxWidth: innerWidth,
      maxLines: subContentMaxLines,
      lineHeight: compact ? 28 : 32,
      font: compact ? "20px sans-serif" : "22px sans-serif",
      fillStyle: theme.bodyText,
      text: options.subContent,
    })
    currentY += subContentBlock.height + subContentGap

    var expBlock = fillWrappedBlock(ctx, {
      x: innerX,
      y: currentY,
      maxWidth: innerWidth,
      maxLines: expMaxLines,
      lineHeight: compact ? 24 : (isPosterLayout ? 26 : 28),
      font: compact ? "18px sans-serif" : (isPosterLayout ? "19px sans-serif" : "20px sans-serif"),
      fillStyle: theme.mutedText,
      text: "释义：" + (options.exp || ""),
    })
    currentY += expBlock.height + expGap
  }

  if (hasQrImage) {
    var qrCardSize = compact ? 60 : 74
    var qrX = cardX + cardWidth - qrCardSize - (compact ? 14 : 18)
    var qrY = cardY + cardHeight - qrCardSize - (compact ? 14 : 18)
    var footerTextWidth = Math.max(qrX - innerX - (compact ? 12 : 18), 160)
    var detailBottomY = qrY - (compact ? 14 : 20)

    if (showDetail) {
      var detailHeight = Math.min(
        Math.max(detailBottomY - currentY, 0),
        measureDetailCardHeight(ctx, {
          width: innerWidth,
          compact: compact,
          dense: isPosterLayout,
          detailTitle: options.detailTitle,
          detailSummary: options.detailSummary,
          detailMeaning: options.detailMeaning,
          detailAdvice: options.detailAdvice,
          detailRisk: options.detailRisk,
          detailQuestion: options.detailQuestion,
        })
      )
      drawDetailCard(ctx, {
        x: innerX,
        y: currentY,
        width: innerWidth,
        height: detailHeight,
        compact: compact,
        dense: isPosterLayout,
        theme: theme,
        detailTitle: options.detailTitle,
        detailSummary: options.detailSummary,
        detailMeaning: options.detailMeaning,
        detailAdvice: options.detailAdvice,
        detailRisk: options.detailRisk,
        detailQuestion: options.detailQuestion,
      })
    }

    fillWrappedBlock(ctx, {
      x: innerX,
      y: qrY + (compact ? 2 : 4),
      maxWidth: footerTextWidth,
      maxLines: 2,
      lineHeight: compact ? 20 : 22,
      font: compact ? "16px sans-serif" : "18px sans-serif",
      fillStyle: theme.footerText,
      text: options.footer,
    })

    drawQrCard(ctx, qrX, qrY, qrCardSize, options.qrImage)
  } else {
    if (showDetail) {
      var standaloneDetailHeight = Math.min(
        Math.max(cardY + cardHeight - currentY - (compact ? 72 : 84), 0),
        measureDetailCardHeight(ctx, {
          width: innerWidth,
          compact: compact,
          dense: isPosterLayout,
          detailTitle: options.detailTitle,
          detailSummary: options.detailSummary,
          detailMeaning: options.detailMeaning,
          detailAdvice: options.detailAdvice,
          detailRisk: options.detailRisk,
          detailQuestion: options.detailQuestion,
        })
      )
      drawDetailCard(ctx, {
        x: innerX,
        y: currentY,
        width: innerWidth,
        height: standaloneDetailHeight,
        compact: compact,
        dense: isPosterLayout,
        theme: theme,
        detailTitle: options.detailTitle,
        detailSummary: options.detailSummary,
        detailMeaning: options.detailMeaning,
        detailAdvice: options.detailAdvice,
        detailRisk: options.detailRisk,
        detailQuestion: options.detailQuestion,
      })
    }

    fillWrappedBlock(ctx, {
      x: innerX,
      y: cardY + cardHeight - (compact ? 56 : 64),
      maxWidth: innerWidth,
      maxLines: 1,
      lineHeight: compact ? 20 : 22,
      font: compact ? "16px sans-serif" : "18px sans-serif",
      fillStyle: theme.footerText,
      text: options.footer,
    })
  }
}

module.exports = {
  drawQuoteShareImage: drawQuoteShareImage,
}
