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

function drawQuoteShareImage(ctx, options) {
  var width = options.width
  var height = options.height
  var theme = options.theme
  var compact = height <= 420
  var hasQrImage = !!options.qrImage
  var cardX = Math.round(width * 0.08)
  var cardY = Math.round(height * 0.08)
  var cardWidth = width - cardX * 2
  var cardHeight = height - cardY * 2
  var innerPadding = compact ? 24 : 32
  var innerX = cardX + innerPadding
  var innerY = cardY + innerPadding
  var innerWidth = cardWidth - innerPadding * 2
  var answerMaxLines = compact ? 3 : 4
  var subContentMaxLines = compact ? 2 : 3
  var expMaxLines = compact ? 2 : 3
  var currentY = innerY

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = createGradient(ctx, width, height, theme.backgroundColors)
  ctx.fillRect(0, 0, width, height)

  drawBackgroundDecorations(ctx, width, height, theme)
  fillRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, compact ? 24 : 32, theme.cardColor)

  var labelRect = drawLabel(ctx, options.modeLabel, innerX, currentY, theme, compact)
  currentY += labelRect.height + (compact ? 14 : 18)

  fillWrappedBlock(ctx, {
    x: innerX,
    y: currentY,
    maxWidth: innerWidth,
    maxLines: 1,
    lineHeight: compact ? 24 : 28,
    font: compact ? "20px sans-serif" : "22px sans-serif",
    fillStyle: theme.headingText,
    text: options.heading,
  })
  currentY += compact ? 34 : 40

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
  currentY += answerBlock.height + (compact ? 18 : 22)

  ctx.save()
  ctx.strokeStyle = theme.dividerColor
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(innerX, currentY)
  ctx.lineTo(innerX + innerWidth, currentY)
  ctx.stroke()
  ctx.restore()
  currentY += compact ? 18 : 22

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
  currentY += subContentBlock.height + (compact ? 14 : 18)

  fillWrappedBlock(ctx, {
    x: innerX,
    y: currentY,
    maxWidth: innerWidth,
    maxLines: expMaxLines,
    lineHeight: compact ? 24 : 28,
    font: compact ? "18px sans-serif" : "20px sans-serif",
    fillStyle: theme.mutedText,
    text: "释义：" + (options.exp || ""),
  })

  if (hasQrImage) {
    var qrCardSize = compact ? 60 : 74
    var qrX = cardX + cardWidth - qrCardSize - (compact ? 14 : 18)
    var qrY = cardY + cardHeight - qrCardSize - (compact ? 14 : 18)
    var footerTextWidth = Math.max(qrX - innerX - (compact ? 12 : 18), 160)

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
