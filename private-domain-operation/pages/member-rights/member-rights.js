const { fetchMemberRightsPageData } = require("../../services/api/page-data");
const {
  openPageEntry,
  parseMemberRightsOptions,
} = require("../../utils/navigation");

Page({
  data: {},

  async onLoad(options = {}) {
    const { source } = parseMemberRightsOptions(options);
    this.setData(await fetchMemberRightsPageData(source));
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onPrimaryTap() {
    openPageEntry(this.data.primaryEntry, "查看会员内容");
  },

  onSecondaryTap() {
    openPageEntry(this.data.secondaryEntry, "咨询会员");
  }
});
