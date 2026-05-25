const DEFAULT_API_CONFIG = {
  baseUrl: "",
  timeout: 8000,
  mockFallback: true,
  tokenStorageKey: "pdo_auth_token"
};

let runtimeConfig = {
  ...DEFAULT_API_CONFIG
};

function normalizeBaseUrl(baseUrl = "") {
  return String(baseUrl || "").replace(/\/+$/, "");
}

function getAppApiConfig() {
  if (typeof getApp !== "function") {
    return {};
  }

  try {
    const app = getApp();
    return (app && app.globalData && app.globalData.apiConfig) || {};
  } catch (error) {
    return {};
  }
}

function getApiConfig() {
  const appConfig = getAppApiConfig();

  return {
    ...runtimeConfig,
    ...appConfig,
    baseUrl: normalizeBaseUrl(appConfig.baseUrl || runtimeConfig.baseUrl)
  };
}

function setApiConfig(nextConfig = {}) {
  runtimeConfig = {
    ...runtimeConfig,
    ...nextConfig,
    baseUrl: normalizeBaseUrl(nextConfig.baseUrl || runtimeConfig.baseUrl)
  };

  return getApiConfig();
}

function canGetStorage() {
  return typeof wx !== "undefined" && wx && typeof wx.getStorageSync === "function";
}

function canSetStorage() {
  return typeof wx !== "undefined" && wx && typeof wx.setStorageSync === "function";
}

function canRemoveStorage() {
  return typeof wx !== "undefined" && wx && typeof wx.removeStorageSync === "function";
}

function getAuthToken() {
  const { tokenStorageKey } = getApiConfig();

  if (!canGetStorage()) {
    return "";
  }

  try {
    return wx.getStorageSync(tokenStorageKey) || "";
  } catch (error) {
    return "";
  }
}

function setAuthToken(token = "") {
  const { tokenStorageKey } = getApiConfig();

  if (!canSetStorage()) {
    return token;
  }

  try {
    wx.setStorageSync(tokenStorageKey, token);
  } catch (error) {
    return token;
  }

  return token;
}

function clearAuthToken() {
  const { tokenStorageKey } = getApiConfig();

  if (!canRemoveStorage()) {
    return;
  }

  try {
    wx.removeStorageSync(tokenStorageKey);
  } catch (error) {
    // Ignore storage errors in environments without full wx APIs.
  }
}

module.exports = {
  DEFAULT_API_CONFIG,
  clearAuthToken,
  getApiConfig,
  getAuthToken,
  setApiConfig,
  setAuthToken
};
