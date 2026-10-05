/**
 * Load monorepo root `.env` into process.env (Expo only auto-loads local `.env`).
 * Safe no-op if the file is missing. Does not override vars already set.
 */
import fs from "node:fs";
import path from "node:path";

import type { ConfigContext, ExpoConfig } from "expo/config";

function loadRootEnv(): void {
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

  // One Clerk publishable key for web + mobile when EXPO_PUBLIC_* is omitted.
  if (!clean(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY)) {
    const clerk = clean(process.env.CLERK_PUBLISHABLE_KEY);
    if (clerk) process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = clerk;
  }
}

function clean(value: string | undefined | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function withScheme(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

loadRootEnv();

export default ({ config }: ConfigContext): ExpoConfig => {
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

  /** Google sample app IDs — replace via EXPO_PUBLIC_ADMOB_* in production. */
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

  const plugins: ExpoConfig["plugins"] = (config.plugins ?? []).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === "expo-router") {
      const opts = (plugin[1] ?? {}) as Record<string, unknown>;
      const merged: [string, Record<string, unknown>] = [
        "expo-router",
        {
          ...opts,
          origin: webOrigin ?? opts.origin ?? "https://localhost/",
        },
      ];
      return merged;
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
    slug: config.slug ?? "habitpup",
    plugins,
    extra: {
      ...(config.extra ?? {}),
      apiUrl: apiUrl ?? "",
      webOrigin: webOrigin ?? "",
    },
  };
};
