const PRODUCT_CATEGORY_KEYS = ["all", "course", "camp", "member"];
const LIVE_MODE_KEYS = ["upcoming", "live", "replay", "ended"];
const CONSULTATION_SCENES = ["profile", "course", "live", "member"];

function decodeValue(value = "") {
  if (value === undefined || value === null) {
    return "";
  }

  try {
    return decodeURIComponent(String(value));
  } catch (error) {
    return String(value);
  }
}

function pickEnum(value = "", candidates = [], fallback = "") {
  const normalizedValue = decodeValue(value);
  return candidates.includes(normalizedValue) ? normalizedValue : fallback;
}

function buildQuery(params = {}) {
  return Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key]))}`)
    .join("&");
}

function buildPageUrl(path = "", params = {}) {
  const query = buildQuery(params);
  return query ? `${path}?${query}` : path;
}

function buildPageEntry(url = "", method = "navigateTo") {
  return {
    url: decodeValue(url),
    method: decodeValue(method) || "navigateTo"
  };
}

function resolveLiveMode(value = "") {
  return pickEnum(value, LIVE_MODE_KEYS, "upcoming");
}

function parseProductListOptions(options = {}) {
  return {
    category: pickEnum(options.category, PRODUCT_CATEGORY_KEYS, "all")
  };
}

function parseProductDetailOptions(options = {}) {
  return {
    courseId: decodeValue(options.courseId) || "course-1"
  };
}

function parseCoursePlayerOptions(options = {}) {
  return {
    courseId: decodeValue(options.courseId),
    lessonId: decodeValue(options.lessonId),
    title: decodeValue(options.title),
    videoUrl: decodeValue(options.videoUrl),
    coverUrl: decodeValue(options.coverUrl),
    duration: decodeValue(options.duration),
    sourceLabel: decodeValue(options.sourceLabel),
    description: decodeValue(options.description),
    outlineText: decodeValue(options.outlineText)
  };
}

function parseBootcampDetailOptions(options = {}) {
  return {
    campId: decodeValue(options.campId) || "camp-7day-growth"
  };
}

function parseLiveDetailOptions(options = {}) {
  return {
    liveId: decodeValue(options.liveId) || "live-private-domain-qa",
    mode: resolveLiveMode(options.mode)
  };
}

function parseLiveRoomOptions(options = {}) {
  return {
    liveId: decodeValue(options.liveId) || "live-private-domain-qa",
    mode: resolveLiveMode(options.mode || "live"),
    title: decodeValue(options.title) || "直播间"
  };
}

function parseMemberRightsOptions(options = {}) {
  return {
    source: decodeValue(options.source)
  };
}

function parseConsultationOptions(options = {}) {
  return {
    scene: pickEnum(options.scene, CONSULTATION_SCENES, "profile"),
    title: decodeValue(options.title)
  };
}

function toLearning() {
  return "/pages/learning/learning";
}

function toProductCategories() {
  return "/pages/product-categories/product-categories";
}

function toProductList(category = "all") {
  return buildPageUrl("/pages/product-list/product-list", {
    category: pickEnum(category, PRODUCT_CATEGORY_KEYS, "all")
  });
}

function toProductDetail(courseId = "course-1") {
  return buildPageUrl("/pages/product-detail/product-detail", {
    courseId: decodeValue(courseId) || "course-1"
  });
}

function toCoursePlayer(courseId = "", lessonId = "") {
  return buildPageUrl("/pages/course-player/course-player", {
    courseId: decodeValue(courseId),
    lessonId: decodeValue(lessonId)
  });
}

function toBootcampDetail(campId = "camp-7day-growth") {
  return buildPageUrl("/pages/bootcamp-detail/bootcamp-detail", {
    campId: decodeValue(campId) || "camp-7day-growth"
  });
}

function toLiveList() {
  return "/pages/live-list/live-list";
}

function toLiveDetail(liveId = "live-private-domain-qa", mode = "upcoming") {
  return buildPageUrl("/pages/live-detail/live-detail", {
    liveId: decodeValue(liveId) || "live-private-domain-qa",
    mode: resolveLiveMode(mode)
  });
}

function toLiveRoom(liveId = "live-private-domain-qa", mode = "live", title = "") {
  return buildPageUrl("/pages/live-room/live-room", {
    liveId: decodeValue(liveId) || "live-private-domain-qa",
    mode: resolveLiveMode(mode || "live"),
    title: decodeValue(title)
  });
}

function toLiveEdit(liveId = "") {
  return buildPageUrl("/pages/live-edit/live-edit", {
    liveId: decodeValue(liveId)
  });
}

function toWebViewer(liveId = "", mode = "live", title = "") {
  return buildPageUrl("/pages/web-viewer/web-viewer", {
    liveId: decodeValue(liveId),
    mode: resolveLiveMode(mode || "live"),
    title: decodeValue(title)
  });
}

function toMemberRights(source = "") {
  return buildPageUrl("/pages/member-rights/member-rights", {
    source: decodeValue(source)
  });
}

function toConsultation(scene = "profile", title = "") {
  return buildPageUrl("/pages/consultation/consultation", {
    scene: pickEnum(scene, CONSULTATION_SCENES, "profile"),
    title: decodeValue(title)
  });
}

function toNotifications() {
  return "/pages/notifications/notifications";
}

function toSettings() {
  return "/pages/settings/settings";
}

function toMerchantDashboard() {
  return "/pages/merchant-dashboard/merchant-dashboard";
}

function toProductManagement() {
  return "/pages/product-management/product-management";
}

function toLiveManagement() {
  return "/pages/live-management/live-management";
}

function toUserManagement() {
  return "/pages/user-management/user-management";
}

function toContentOps() {
  return "/pages/content-ops/content-ops";
}

function openPageEntry(entry, fallbackTitle = "功能下一步接入") {
  if (!entry || !entry.url) {
    wx.showToast({
      title: fallbackTitle,
      icon: "none"
    });
    return false;
  }

  const method = entry.method || "navigateTo";

  if (typeof wx[method] !== "function") {
    wx.showToast({
      title: fallbackTitle,
      icon: "none"
    });
    return false;
  }

  wx[method]({
    url: entry.url
  });
  return true;
}

module.exports = {
  buildPageEntry,
  decodeValue,
  openPageEntry,
  resolveLiveMode,
  parseProductListOptions,
  parseProductDetailOptions,
  parseCoursePlayerOptions,
  parseBootcampDetailOptions,
  parseLiveDetailOptions,
  parseLiveRoomOptions,
  parseMemberRightsOptions,
  parseConsultationOptions,
  toLearning,
  toProductCategories,
  toProductList,
  toProductDetail,
  toCoursePlayer,
  toBootcampDetail,
  toLiveList,
  toLiveDetail,
  toLiveRoom,
  toLiveEdit,
  toWebViewer,
  toMemberRights,
  toConsultation,
  toNotifications,
  toSettings,
  toMerchantDashboard,
  toProductManagement,
  toLiveManagement,
  toUserManagement,
  toContentOps
};
