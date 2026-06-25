const assert = require("node:assert/strict");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

function modulePath(relativePath) {
  return path.join(rootDir, relativePath);
}

function clearAppModules() {
  [
    "services/api/config.js",
    "services/api/request.js",
    "services/api/page-data.js",
    "mock/live-data.js",
    "pages/web-viewer/web-viewer.js"
  ].forEach((relativePath) => {
    delete require.cache[require.resolve(modulePath(relativePath))];
  });
}

async function rejectsAccessCheckFallbackAfterAuthFailure() {
  clearAppModules();

  global.getApp = () => ({
    globalData: {
      apiConfig: {
        baseUrl: "https://api.example.test",
        mockFallback: true,
        timeout: 1
      }
    }
  });
  global.wx = {
    getStorageSync() {
      return "expired-token";
    },
    request(options) {
      options.success({
        statusCode: 401,
        data: { message: "unauthorized" }
      });
    }
  };

  const { checkLiveAccess } = require(modulePath("services/api/page-data.js"));

  let rejectedError = null;
  let resolvedValue = null;
  try {
    resolvedValue = await checkLiveAccess(1, "live");
  } catch (error) {
    rejectedError = error;
  }

  assert.ok(
    rejectedError,
    `access-check must reject instead of resolving fallback value: ${JSON.stringify(resolvedValue)}`
  );
  assert.match(rejectedError.message, /unauthorized|401|request failed/i);
}

async function webViewerRejectsRawUrlBypass() {
  clearAppModules();

  let page = null;
  global.Page = (definition) => {
    page = {
      ...definition,
      data: { ...(definition.data || {}) },
      setData(nextData) {
        this.data = {
          ...this.data,
          ...nextData
        };
      }
    };
  };
  global.wx = {
    showToast() {},
    setClipboardData() {}
  };

  require(modulePath("pages/web-viewer/web-viewer.js"));

  await page.onLoad({
    url: encodeURIComponent("https://media.example.test/private-live.m3u8"),
    title: "绕过访问校验"
  });

  assert.equal(page.data.valid, false);
  assert.equal(page.data.url, "");
}

async function run() {
  await rejectsAccessCheckFallbackAfterAuthFailure();
  await webViewerRejectsRawUrlBypass();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
