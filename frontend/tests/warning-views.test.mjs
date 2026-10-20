import assert from "node:assert/strict";
import test from "node:test";
import { acknowledgeWarning, claimWarningView, formatWarningDate, latestWarning } from "../src/features/auth/utils/warning-views.ts";
import { toProfile } from "../src/features/auth/services/profile.mapper.ts";

function storage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}
const state = (saved, id = "warning") => JSON.parse(saved.getItem(`pm_warning_${id}`));

test("passive dismissal allows three loads but no fourth display", () => {
  const saved = storage();
  for (let viewCount = 1; viewCount <= 3; viewCount++) {
    const load = new Set();
    assert.equal(claimWarningView(saved, "student", "warning", load), true);
    assert.equal(claimWarningView(saved, "student", "warning", load), false);
    assert.deepEqual(state(saved), { viewCount, acknowledged: false });
  }
  assert.equal(claimWarningView(saved, "student", "warning", new Set()), false);
  assert.deepEqual(state(saved), { viewCount: 3, acknowledged: false });
});

test("acknowledgment silences the warning without consuming another view", () => {
  const saved = storage();
  assert.equal(claimWarningView(saved, "student", "warning", new Set()), true);
  assert.equal(acknowledgeWarning(saved, "warning"), true);
  assert.deepEqual(state(saved), { viewCount: 1, acknowledged: true });
  assert.equal(claimWarningView(saved, "student", "warning", new Set()), false);
  acknowledgeWarning(saved, "warning");
  assert.deepEqual(state(saved), { viewCount: 1, acknowledged: true });
});

test("new IDs start fresh after acknowledgment or exhausted views", () => {
  const saved = storage();
  saved.setItem("pm_warning_old", JSON.stringify({ viewCount: 3, acknowledged: false }));
  acknowledgeWarning(saved, "acknowledged");
  const load = new Set();
  assert.equal(claimWarningView(saved, "student", "old", load), false);
  assert.equal(claimWarningView(saved, "student", "acknowledged", load), false);
  assert.equal(claimWarningView(saved, "student", "new", load), true);
  assert.deepEqual(state(saved, "new"), { viewCount: 1, acknowledged: false });
});

test("latest warning is chosen by date regardless of ordering", () => {
  const old = { id: "old", reason: "First notice", created_at: "2026-10-14T09:00:00Z" };
  const recent = { id: "new", reason: "Latest notice", created_at: "2026-10-15T09:00:00Z" };
  assert.equal(latestWarning([old, recent]), recent);
  assert.equal(latestWarning([recent, old]), recent);
  assert.equal(latestWarning([]), undefined);
});

test("malformed records recover; blocked storage cannot cause an uncapped popup", () => {
  const saved = storage();
  for (const value of ["garbage", "null", '{"viewCount":-1}', '{"viewCount":"2"}']) {
    saved.setItem("pm_warning_warning", value);
    assert.equal(claimWarningView(saved, "student", "warning", new Set()), true);
    assert.deepEqual(state(saved), { viewCount: 1, acknowledged: false });
  }
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() {} };
  assert.equal(claimWarningView(blocked, "student", "warning", new Set()), false);
  assert.equal(acknowledgeWarning(blocked, "warning"), false);
  const writeBlocked = { getItem() { return null; }, setItem() { throw new Error("quota"); } };
  assert.equal(claimWarningView(writeBlocked, "student", "warning", new Set()), false);
  assert.equal(acknowledgeWarning(writeBlocked, "warning"), false);
});

test("session mapping retains warning history after acknowledgment", () => {
  const warning = { id: "warning", reason: "Exam policy violation", created_at: "2026-10-15T09:00:00Z" };
  const me = { profile: { id: "student" }, role: "student", warnings: [warning] };
  const saved = storage();
  acknowledgeWarning(saved, warning.id);
  assert.equal(claimWarningView(saved, "student", warning.id, new Set()), false);
  assert.deepEqual(toProfile(me).warnings, [warning]);
  assert.deepEqual(toProfile({ ...me, warnings: undefined }).warnings, []);
  assert.equal(formatWarningDate(warning.created_at), "Oct 15, 2026");
  assert.equal(formatWarningDate("invalid"), "Date unavailable");
});
