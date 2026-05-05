const POSTER_SIZE = {
  width: 750,
  height: 1334
};

function drawRoundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function createLines(ctx, text = "", maxWidth, maxLines) {
  if (!text) {
    return [];
  }

  const lines = [];
  let current = "";
  const chars = String(text).split("");

  chars.forEach((char) => {
    const testLine = current + char;

    if (ctx.measureText(testLine).width <= maxWidth) {
      current = testLine;
      return;
    }

    if (current) {
      lines.push(current);
    }
    current = char;
  });

  if (current) {
    lines.push(current);
  }

  if (typeof maxLines === "number" && lines.length > maxLines) {
    const clipped = lines.slice(0, maxLines);
    const lastIndex = clipped.length - 1;
    let lastLine = clipped[lastIndex];

    while (lastLine && ctx.measureText(`${lastLine}…`).width > maxWidth) {
      lastLine = lastLine.slice(0, -1);
    }

    clipped[lastIndex] = `${lastLine || ""}…`;
    return clipped;
  }

  return lines;
}

function fillLines(ctx, lines, x, startY, lineHeight) {
  lines.forEach((line, index) => {
    ctx.fillText(line, x, startY + index * lineHeight);
  });

  return startY + Math.max(lines.length - 1, 0) * lineHeight;
}

function drawTag(ctx, text, x, y, colors) {
  const label = String(text || "");
  const textWidth = ctx.measureText(label).width;
  const paddingX = 18;
  const height = 42;
  const width = textWidth + paddingX * 2;

  ctx.save();
  drawRoundRect(ctx, x, y, width, height, 21);
  ctx.fillStyle = colors.chipBg;
  ctx.fill();
  ctx.fillStyle = colors.chipText;
  ctx.font = "600 22px sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + paddingX, y + height / 2);
  ctx.restore();

  return width;
}

function drawPoster(ctx, options = {}) {
  const colors = Object.assign(
    {
      topStart: "#4c74ff",
      topEnd: "#7a5dff",
      chipBg: "rgba(255,255,255,0.22)",
      chipText: "#ffffff",
      primaryText: "#1f2742",
      secondaryText: "#65708f",
      cardBg: "#ffffff",
      softBg: "#f5f7ff",
      accent: "#5d6fff",
      footerBg: "#eef2ff"
    },
    options.colors || {}
  );

  ctx.clearRect(0, 0, POSTER_SIZE.width, POSTER_SIZE.height);

  const bgGradient = ctx.createLinearGradient(0, 0, POSTER_SIZE.width, POSTER_SIZE.height);
  bgGradient.addColorStop(0, colors.topStart);
  bgGradient.addColorStop(1, colors.topEnd);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, POSTER_SIZE.width, POSTER_SIZE.height);

  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(110, 130, 64, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(650, 210, 96, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(600, 1160, 84, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const cardX = 38;
  const cardY = 56;
  const cardWidth = POSTER_SIZE.width - cardX * 2;
  const cardHeight = POSTER_SIZE.height - 92;

  ctx.save();
  ctx.shadowColor = "rgba(32, 39, 66, 0.10)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 16;
  drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 36);
  ctx.fillStyle = colors.cardBg;
  ctx.fill();
  ctx.restore();

  const contentX = cardX + 36;
  const contentRight = cardX + cardWidth - 36;
  const contentWidth = contentRight - contentX;
  let cursorY = cardY + 42;

  ctx.fillStyle = colors.secondaryText;
  ctx.font = "600 26px sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(options.brand || "时昕有点懒", contentX, cursorY);

  ctx.fillStyle = colors.accent;
  ctx.font = "500 24px sans-serif";
  const routeText = options.routeLabel || "";
  if (routeText) {
    const width = ctx.measureText(routeText).width;
    ctx.fillText(routeText, contentRight - width, cursorY + 2);
  }

  cursorY += 52;
  ctx.font = "600 22px sans-serif";
  drawTag(ctx, options.typeLabel || "内容海报", contentX, cursorY, colors);

  cursorY += 72;
  ctx.fillStyle = colors.primaryText;
  ctx.font = "700 46px sans-serif";
  const titleLines = createLines(ctx, options.title, contentWidth, 3);
  fillLines(ctx, titleLines, contentX, cursorY, 62);

  cursorY += titleLines.length * 62 + 8;
  ctx.fillStyle = colors.secondaryText;
  ctx.font = "500 26px sans-serif";
  const metaLines = createLines(ctx, [options.subtitle, options.meta].filter(Boolean).join(" · "), contentWidth, 2);
  fillLines(ctx, metaLines, contentX, cursorY, 38);

  cursorY += metaLines.length * 38 + 26;
  drawRoundRect(ctx, contentX, cursorY, contentWidth, 212, 30);
  ctx.fillStyle = colors.softBg;
  ctx.fill();

  ctx.fillStyle = colors.accent;
  ctx.font = "700 24px sans-serif";
  ctx.fillText(options.summaryLabel || "内容简介", contentX + 24, cursorY + 24);

  ctx.fillStyle = colors.secondaryText;
  ctx.font = "500 25px sans-serif";
  const summaryLines = createLines(ctx, options.summary || "", contentWidth - 48, 4);
  fillLines(ctx, summaryLines, contentX + 24, cursorY + 68, 36);

  cursorY += 244;

  if (options.pills && options.pills.length) {
    let pillX = contentX;
    const pillY = cursorY;

    options.pills.slice(0, 3).forEach((pill) => {
      ctx.font = "600 22px sans-serif";
      const textWidth = ctx.measureText(pill).width;
      const pillWidth = textWidth + 30;

      if (pillX + pillWidth > contentRight) {
        return;
      }

      drawRoundRect(ctx, pillX, pillY, pillWidth, 42, 21);
      ctx.fillStyle = colors.footerBg;
      ctx.fill();
      ctx.fillStyle = colors.accent;
      ctx.fillText(pill, pillX + 15, pillY + 10);
      pillX += pillWidth + 14;
    });

    cursorY += 62;
  }

  ctx.fillStyle = colors.primaryText;
  ctx.font = "700 28px sans-serif";
  ctx.fillText(options.sectionTitle || "内容亮点", contentX, cursorY);
  cursorY += 24;

  (options.bullets || []).slice(0, 4).forEach((bullet) => {
    cursorY += 26;
    ctx.beginPath();
    ctx.arc(contentX + 9, cursorY + 10, 6, 0, Math.PI * 2);
    ctx.fillStyle = colors.accent;
    ctx.fill();

    ctx.fillStyle = colors.secondaryText;
    ctx.font = "500 25px sans-serif";
    const bulletLines = createLines(ctx, bullet, contentWidth - 36, 2);
    fillLines(ctx, bulletLines, contentX + 28, cursorY, 34);
    cursorY += bulletLines.length * 34;
  });

  const footerHeight = 132;
  const footerY = cardY + cardHeight - footerHeight - 26;
  drawRoundRect(ctx, contentX, footerY, contentWidth, footerHeight, 28);
  ctx.fillStyle = colors.footerBg;
  ctx.fill();

  ctx.fillStyle = colors.primaryText;
  ctx.font = "700 28px sans-serif";
  ctx.fillText(options.footerTitle || "微信打开小程序查看完整内容", contentX + 24, footerY + 28);
  ctx.fillStyle = colors.secondaryText;
  ctx.font = "500 24px sans-serif";
  const footerLines = createLines(
    ctx,
    options.footerText || "时昕有点懒 · 个人 IP 与私域运营内容原型",
    contentWidth - 48,
    2
  );
  fillLines(ctx, footerLines, contentX + 24, footerY + 68, 32);
}

function ensureAlbumPermission() {
  return new Promise((resolve, reject) => {
    wx.getSetting({
      success(res) {
        const scope = res.authSetting["scope.writePhotosAlbum"];

        if (scope === true) {
          resolve();
          return;
        }

        if (scope === false) {
          wx.openSetting({
            success(settingRes) {
              if (settingRes.authSetting["scope.writePhotosAlbum"]) {
                resolve();
                return;
              }

              reject(new Error("album permission denied"));
            },
            fail(error) {
              reject(error || new Error("open setting failed"));
            }
          });
          return;
        }

        wx.authorize({
          scope: "scope.writePhotosAlbum",
          success() {
            resolve();
          },
          fail() {
            wx.openSetting({
              success(settingRes) {
                if (settingRes.authSetting["scope.writePhotosAlbum"]) {
                  resolve();
                  return;
                }

                reject(new Error("album permission denied"));
              },
              fail(error) {
                reject(error || new Error("open setting failed"));
              }
            });
          }
        });
      },
      fail(error) {
        reject(error || new Error("get setting failed"));
      }
    });
  });
}

function saveImageToAlbum(filePath) {
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath,
      success() {
        resolve();
      },
      fail(error) {
        reject(error || new Error("save image failed"));
      }
    });
  });
}

module.exports = {
  POSTER_SIZE,
  drawPoster,
  ensureAlbumPermission,
  saveImageToAlbum
};
