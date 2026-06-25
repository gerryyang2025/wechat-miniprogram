const { apiRequest } = require("./request");
const bootcampData = require("../../mock/bootcamp-data");
const courseData = require("../../mock/course-data");
const homeData = require("../../mock/home-data");
const learningData = require("../../mock/learning-data");
const liveData = require("../../mock/live-data");
const merchantData = require("../../mock/merchant-data");
const productBrowserData = require("../../mock/product-browser-data");
const profileData = require("../../mock/profile-data");
const serviceData = require("../../mock/service-data");

function fetchHomePageData() {
  return apiRequest({
    path: "/api/v1/home",
    fallback: () => homeData.getHomePageData()
  });
}

function fetchProductCategories() {
  return apiRequest({
    path: "/api/v1/product-categories",
    fallback: () => productBrowserData.getProductCategories()
  });
}

function fetchProductListPageData(category = "all") {
  return apiRequest({
    path: "/api/v1/products",
    query: { category },
    fallback: () => productBrowserData.getProductListPageData(category)
  });
}

function fetchProductDetail(courseId = "course-1") {
  return apiRequest({
    path: `/api/v1/products/${courseId}`,
    fallback: () => courseData.getDetailCourse(courseId)
  });
}

function fetchBootcampDetailPageData(campId = "camp-7day-growth") {
  return apiRequest({
    path: `/api/v1/bootcamps/${campId}`,
    fallback: () => bootcampData.getBootcampDetailPageData(campId)
  });
}

function fetchLiveListPageData(activeTab = "all") {
  return apiRequest({
    path: "/api/v1/live-events",
    query: { status: activeTab },
    fallback: () => liveData.getLiveListPageData(activeTab)
  });
}

function fetchLiveDetailPageData(liveId = "live-private-domain-qa", mode = "upcoming") {
  return apiRequest({
    path: `/api/v1/live-events/${liveId}`,
    query: { mode },
    fallback: () => liveData.getLiveDetailPageData(liveId, mode)
  });
}

function fetchLiveRoomPageData(liveId = "live-private-domain-qa", mode = "live", title = "直播间") {
  return apiRequest({
    path: `/api/v1/live-events/${liveId}/room`,
    query: { mode, title },
    fallback: () => liveData.getLiveRoomPageData(liveId, mode, title)
  });
}

function fetchLearningPageData() {
  return apiRequest({
    path: "/api/v1/learning",
    fallback: () => learningData.getLearningPageData()
  });
}

function fetchPlayerCourse(courseId = "") {
  return apiRequest({
    path: `/api/v1/courses/${courseId}/player`,
    fallback: () => courseData.getPlayerCourse(courseId)
  });
}

function updateCourseProgress(courseId = "", lessonId = "", options = {}) {
  return apiRequest({
    path: `/api/v1/learning/courses/${courseId}/progress`,
    method: "POST",
    data: {
      lesson_id: lessonId,
      progress_seconds: options.progressSeconds || 0,
      completed: options.completed !== false
    },
    fallback: () => courseData.updatePlayerCourseProgress(courseId, lessonId)
  });
}

function fetchMemberRightsPageData(source = "") {
  return apiRequest({
    path: "/api/v1/member-rights",
    query: { source },
    fallback: () => serviceData.getMemberRightsPageData(source)
  });
}

function fetchNotificationsPageData() {
  return apiRequest({
    path: "/api/v1/notifications",
    fallback: () => serviceData.getNotificationsPageData()
  });
}

function fetchSettingsPageData() {
  return apiRequest({
    path: "/api/v1/settings",
    fallback: () => serviceData.getSettingsPageData()
  });
}

function fetchConsultationPageData(scene = "profile", title = "") {
  return apiRequest({
    path: "/api/v1/consultation",
    query: { scene, title },
    fallback: () => serviceData.getConsultationPageData(scene, title)
  });
}

function fetchProfilePageData() {
  return apiRequest({
    path: "/api/v1/profile",
    fallback: () => profileData.getProfilePageData()
  });
}

function fetchMerchantDashboardPageData() {
  return apiRequest({
    path: "/api/v1/merchant/dashboard",
    fallback: () => merchantData.getMerchantDashboardPageData()
  });
}

function fetchProductManagementPageData(activeTab = "all") {
  return apiRequest({
    path: "/api/v1/merchant/products",
    query: { type: activeTab },
    fallback: () => merchantData.getProductManagementPageData(activeTab)
  });
}

function fetchCourseEditPageData(courseId = "") {
  return apiRequest({
    path: `/api/v1/merchant/courses/${courseId}/edit`,
    fallback: () => null
  });
}

function saveCourseEdit(courseId = "", payload = {}) {
  return apiRequest({
    path: `/api/v1/merchant/courses/${courseId}`,
    method: "PUT",
    data: payload,
    fallback: () => ({
      title: payload.title,
      description: payload.description,
      status: payload.status,
      coverUrl: payload.coverUrl,
      lessons: payload.lessons || [],
      id: courseId,
      savedWithFallback: true
    })
  });
}

function fetchCourseAnalytics(courseId = "") {
  return apiRequest({
    path: `/api/v1/merchant/courses/${courseId}/analytics`,
    fallback: () => ({
      learnerCount: 1,
      completedCount: 0,
      averageProgress: 0,
      latestLearnedAt: ""
    })
  });
}

function fetchLiveManagementPageData(activeTab = "all") {
  return apiRequest({
    path: "/api/v1/merchant/live-events",
    query: { status: activeTab },
    fallback: () => merchantData.getLiveManagementPageData(activeTab)
  });
}

function fetchLiveEditPageData(liveId = "") {
  if (!liveId) {
    return Promise.resolve(null);
  }

  return apiRequest({
    path: `/api/v1/merchant/live-events/${liveId}/edit`,
    fallback: () => liveData.getLiveEditPageData(liveId)
  });
}

function fetchLiveAccessOptions() {
  return apiRequest({
    path: "/api/v1/merchant/access-options",
    fallback: () => liveData.getLiveAccessOptions()
  });
}

function createLiveEvent(payload = {}) {
  return apiRequest({
    path: "/api/v1/merchant/live-events",
    method: "POST",
    data: payload,
    fallback: () => liveData.saveLiveEdit("", payload)
  });
}

function saveLiveEvent(liveId = "", payload = {}) {
  return apiRequest({
    path: `/api/v1/merchant/live-events/${liveId}`,
    method: "PUT",
    data: payload,
    fallback: () => liveData.saveLiveEdit(liveId, payload)
  });
}

function checkLiveAccess(liveId = "", mode = "live") {
  return apiRequest({
    path: `/api/v1/live-events/${liveId}/access-check`,
    method: "POST",
    data: { mode },
    fallback: () => liveData.checkLiveAccess(liveId, mode)
  });
}

function fetchUserManagementPageData(activeTab = "all") {
  return apiRequest({
    path: "/api/v1/merchant/users",
    query: { segment: activeTab },
    fallback: () => merchantData.getUserManagementPageData(activeTab)
  });
}

function fetchContentOpsPageData() {
  return apiRequest({
    path: "/api/v1/merchant/content-ops",
    fallback: () => merchantData.getContentOpsPageData()
  });
}

module.exports = {
  fetchBootcampDetailPageData,
  checkLiveAccess,
  createLiveEvent,
  fetchConsultationPageData,
  fetchContentOpsPageData,
  fetchCourseAnalytics,
  fetchCourseEditPageData,
  fetchHomePageData,
  fetchLearningPageData,
  fetchLiveAccessOptions,
  fetchLiveDetailPageData,
  fetchLiveEditPageData,
  fetchLiveListPageData,
  fetchLiveManagementPageData,
  fetchLiveRoomPageData,
  fetchMemberRightsPageData,
  fetchMerchantDashboardPageData,
  fetchNotificationsPageData,
  fetchPlayerCourse,
  fetchProductCategories,
  fetchProductDetail,
  fetchProductListPageData,
  fetchProductManagementPageData,
  fetchProfilePageData,
  fetchSettingsPageData,
  fetchUserManagementPageData,
  saveCourseEdit,
  saveLiveEvent,
  updateCourseProgress
};
