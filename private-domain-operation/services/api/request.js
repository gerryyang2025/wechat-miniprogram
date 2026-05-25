const { getApiConfig, getAuthToken } = require("./config");

function canRequest() {
  return typeof wx !== "undefined" && wx && typeof wx.request === "function";
}

function buildUrl(path = "", query = {}) {
  const { baseUrl } = getApiConfig();
  const normalizedPath = String(path || "").startsWith("/") ? path : `/${path}`;
  const queryString = Object.keys(query)
    .filter((key) => query[key] !== undefined && query[key] !== null && query[key] !== "")
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(query[key]))}`)
    .join("&");

  return `${baseUrl}${normalizedPath}${queryString ? `?${queryString}` : ""}`;
}

function resolveFallback(fallback) {
  if (typeof fallback !== "function") {
    return Promise.resolve(fallback);
  }

  try {
    return Promise.resolve(fallback());
  } catch (error) {
    return Promise.reject(error);
  }
}

function normalizeResponseBody(body) {
  if (!body || typeof body !== "object") {
    return body;
  }

  if (Object.prototype.hasOwnProperty.call(body, "data")) {
    return body.data;
  }

  return body;
}

function shouldUseFallback(statusCode = 0, body = null) {
  if (statusCode < 200 || statusCode >= 300) {
    return true;
  }

  if (!body || typeof body !== "object") {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(body, "code") && body.code !== 0;
}

function apiRequest(options = {}) {
  const {
    path = "",
    method = "GET",
    data = {},
    query = {},
    header = {},
    fallback = null,
    auth = true
  } = options;
  const config = getApiConfig();

  if (!config.baseUrl || !canRequest()) {
    return resolveFallback(fallback);
  }

  const token = auth ? getAuthToken() : "";

  return new Promise((resolve, reject) => {
    wx.request({
      url: buildUrl(path, query),
      method,
      data,
      timeout: config.timeout,
      header: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...header
      },
      success(response) {
        const { statusCode, data: body } = response;

        if (shouldUseFallback(statusCode, body) && config.mockFallback) {
          resolveFallback(fallback).then(resolve).catch(reject);
          return;
        }

        if (shouldUseFallback(statusCode, body)) {
          reject(new Error((body && body.message) || `request failed: ${statusCode}`));
          return;
        }

        resolve(normalizeResponseBody(body));
      },
      fail(error) {
        if (config.mockFallback) {
          resolveFallback(fallback).then(resolve).catch(reject);
          return;
        }

        reject(error);
      }
    });
  });
}

module.exports = {
  apiRequest,
  buildUrl,
  resolveFallback
};
