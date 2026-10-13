interface AppDownloadConfig {
  googlePlayUrl: string;
  appStoreUrl: string | null;
}

export const APP_DOWNLOAD: AppDownloadConfig = {
  googlePlayUrl:
    "https://play.google.com/store/apps/details?id=com.poolpay.rosca&pcampaignid=web_share",
  // Set the published iOS listing URL to replace the coming-soon notice with its badge.
  appStoreUrl: null
};
