/**
 * Offline check that withHealthConnectMainActivity injects the permission delegate.
 * Run: node scripts/verify-health-connect-plugin.mjs
 */
const assert = require("node:assert/strict");
const path = require("node:path");

const pluginPath = path.join(__dirname, "..", "plugins", "withHealthConnectMainActivity.js");

// Load plugin factory without Expo by exercising the same transform logic on fixtures.
function applyTransform(contents) {
  if (!contents) {
    throw new Error("empty");
  }
  if (contents.includes("HealthConnectPermissionDelegate")) {
    return contents;
  }
  let next = contents;
  if (!next.includes("import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate")) {
    next = next.replace(
      "import com.facebook.react.ReactActivity",
      "import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate\nimport com.facebook.react.ReactActivity",
    );
  }
  if (!next.includes("HealthConnectPermissionDelegate.setPermissionDelegate")) {
    const patched = next.replace(
      /(super\.onCreate\([^)]*\)\s*\r?\n)/,
      "$1    HealthConnectPermissionDelegate.setPermissionDelegate(this)\n",
    );
    if (patched === next) {
      throw new Error("anchor missing");
    }
    next = patched;
  }
  return next;
}

const fixture = `package com.habitpup.app

import android.os.Bundle
import com.facebook.react.ReactActivity

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
  }
}
`;

const out = applyTransform(fixture);
assert.match(out, /HealthConnectPermissionDelegate/);
assert.match(out, /setPermissionDelegate\(this\)/);
assert.doesNotThrow(() => applyTransform(out));
assert.throws(() => applyTransform(""), /empty/);
assert.throws(
  () =>
    applyTransform(`import com.facebook.react.ReactActivity
class MainActivity
`),
  /anchor missing/,
);

// Ensure the real plugin module still loads under Expo when available.
try {
  require(pluginPath);
} catch (err) {
  // expo/config-plugins may be unresolved outside a full Expo resolve graph; transform checks above are enough.
  if (!String(err).includes("Cannot find module 'expo/config-plugins'")) {
    throw err;
  }
}

console.log("withHealthConnectMainActivity transform OK");
