const { setAuthToken } = require("./config");
const { apiRequest } = require("./request");

function getWxLoginCode() {
  if (typeof wx === "undefined" || !wx || typeof wx.login !== "function") {
    return Promise.resolve("dev-code");
  }

  return new Promise((resolve) => {
    wx.login({
      success(result) {
        resolve(result.code || "dev-code");
      },
      fail() {
        resolve("dev-code");
      }
    });
  });
}

function buildFallbackLogin(role = "student", phone = "") {
  const isMerchant = role === "merchant";

  return {
    token: isMerchant ? "dev-merchant-token" : "dev-user-token",
    user: {
      id: isMerchant ? "merchant-user-1" : "user-1",
      openid: isMerchant ? "mock-openid-merchant" : "mock-openid-user",
      nickname: isMerchant ? "Gerry" : "时昕同学",
      avatar_url: "",
      phone,
      roles: isMerchant ? ["student", "merchant"] : ["student"]
    }
  };
}

async function loginWithWeChat(options = {}) {
  const { role = "student", phone = "" } = options;
  const code = await getWxLoginCode();
  const result = await apiRequest({
    path: "/api/v1/auth/wechat-login",
    method: "POST",
    auth: false,
    data: { code, role, phone },
    fallback: () => buildFallbackLogin(role, phone)
  });

  if (result && result.token) {
    setAuthToken(result.token);
  }

  return result;
}

module.exports = {
  getWxLoginCode,
  loginWithWeChat
};
