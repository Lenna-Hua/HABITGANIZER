/**
 * Load monorepo root `.env` into process.env (Expo only auto-loads local `.env`).
 * Plain JS so EAS "Read app config" does not choke on TypeScript syntax.
 */
const fs = require("node:fs");
const path = require("node:path");

function clean(value) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function withScheme(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function loadRootEnv() {
  const candidates = [
    path.resolve(__dirname, "../../.env"),
    path.resolve(process.cwd(), "../../.env"),
    path.resolve(process.cwd(), ".env"),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
      if (process.env[key] !== undefined) continue;
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
    break;
  }

  if (!clean(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY)) {
    const clerk = clean(process.env.CLERK_PUBLISHABLE_KEY);
    if (clerk) process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = clerk;
  }
}

loadRootEnv();

/** @param {{ config: import("expo/config").ExpoConfig }} ctx */
module.exports = ({ config }) => {
  const webOriginEnv = clean(process.env.EXPO_PUBLIC_WEB_ORIGIN);
  const apiUrlEnv = clean(process.env.EXPO_PUBLIC_API_URL);
  const replitDevDomain = clean(process.env.EXPO_PUBLIC_DOMAIN);
  const profile = clean(process.env.EAS_BUILD_PROFILE);

  const webOrigin = webOriginEnv
    ? withScheme(webOriginEnv)
    : replitDevDomain
      ? withScheme(replitDevDomain)
      : undefined;
  const apiUrl = apiUrlEnv ? withScheme(apiUrlEnv) : webOrigin;

  if (profile === "production" && (!webOriginEnv || !apiUrlEnv)) {
    const missing = [
      !apiUrlEnv ? "EXPO_PUBLIC_API_URL" : null,
      !webOriginEnv ? "EXPO_PUBLIC_WEB_ORIGIN" : null,
    ]
      .filter(Boolean)
      .join(" and ");
    throw new Error(
      `${missing} must be set for production EAS builds. ` +
        "See artifacts/habit-mobile/STORE_SUBMISSION.md for setup instructions.",
    );
  }

  const GOOGLE_SAMPLE_ADMOB = /ca-app-pub-3940256099942544/;

  const admobAndroidAppId =
    clean(process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID) ?? "ca-app-pub-3940256099942544~3347511713";
  const admobIosAppId =
    clean(process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID) ?? "ca-app-pub-3940256099942544~1458002511";

  if (profile === "production") {
    const admobRewarded = clean(process.env.EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID);
    if (
      !clean(process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID) ||
      GOOGLE_SAMPLE_ADMOB.test(admobAndroidAppId) ||
      !admobRewarded ||
      GOOGLE_SAMPLE_ADMOB.test(admobRewarded)
    ) {
      throw new Error(
        "Production EAS builds require real AdMob IDs via EXPO_PUBLIC_ADMOB_ANDROID_APP_ID and " +
          "EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID (Google sample ca-app-pub-3940256099942544… IDs are not allowed). " +
          "See artifacts/habit-mobile/STORE_SUBMISSION.md and DEVELOPMENT_PLAN.md.",
      );
    }
  }

  const plugins = (config.plugins ?? []).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === "expo-router") {
      const opts = plugin[1] ?? {};
      return [
        "expo-router",
        {
          ...opts,
          origin: webOrigin ?? opts.origin ?? "https://localhost/",
        },
      ];
    }
    return plugin;
  });

  plugins.push([
    "react-native-google-mobile-ads",
    {
      androidAppId: admobAndroidAppId,
      iosAppId: admobIosAppId,
    },
  ]);

  return {
    ...config,
    name: config.name ?? "Habiganize",
    slug: config.slug ?? "habitganizer",
    plugins,
    extra: {
      ...(config.extra ?? {}),
      apiUrl: apiUrl ?? "",
      webOrigin: webOrigin ?? "",
    },
  };
};
