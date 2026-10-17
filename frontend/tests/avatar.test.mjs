import assert from "node:assert/strict";
import test from "node:test";
import { generateAvatarUrl } from "../src/features/auth/utils/avatar.ts";
import { toProfile, toProfilePatch } from "../src/features/auth/services/profile.mapper.ts";
import { isMainProfileComplete } from "../src/features/auth/utils/profile.ts";
import { updateMeBody } from "../../backend/src/validators/schemas.ts";

test("gender-specific avatars use the requested hair pools and safe query encoding", () => {
  for (const [gender, prefix, count] of [["male", "short", 16], ["female", "long", 20]]) {
    const url = new URL(generateAvatarUrl(gender, "test & seed"));
    assert.equal(url.origin + url.pathname, "https://api.dicebear.com/9.x/adventurer/svg");
    assert.equal(url.searchParams.get("seed"), "test & seed");
    const hair = url.searchParams.get("hair").split(",");
    assert.equal(hair.length, count);
    assert.ok(hair.every((item) => item.startsWith(prefix)));
    assert.ok(url.toString().length <= 500);
  }
  assert.equal(new URL(generateAvatarUrl(null, "seed")).searchParams.has("hair"), false);
});

test("shuffle creates fresh seeds while explicitly seeded avatars are stable", () => {
  assert.notEqual(generateAvatarUrl("female"), generateAvatarUrl("female"));
  assert.equal(generateAvatarUrl("male", "same"), generateAvatarUrl("male", "same"));
});

test("avatar and gender survive profile mapping and pass backend patch validation", () => {
  const avatarUrl = generateAvatarUrl("female", "profile");
  const profile = toProfile({ profile: { id: "student", gender: "female", avatar_url: avatarUrl }, role: "student", warnings: [] });
  assert.equal(profile.gender, "female");
  assert.equal(profile.avatarUrl, avatarUrl);
  const patch = toProfilePatch({ gender: profile.gender, avatarUrl: profile.avatarUrl });
  assert.deepEqual(updateMeBody.parse(patch), { gender: "female", avatarUrl });
  assert.deepEqual(toProfilePatch({ avatarUrl: "" }), { avatarUrl: null });
  const legacy = toProfile({ profile: { gender: null, avatar_url: null }, warnings: [] });
  assert.equal(legacy.gender, undefined);
  assert.equal(legacy.avatarUrl, undefined);
});

test("backend rejects invalid gender, malformed URLs and URLs over 500 characters", () => {
  for (const body of [{ gender: "invalid" }, { avatarUrl: "not a URL" }, { avatarUrl: `https://example.com/${"x".repeat(500)}` }]) {
    assert.equal(updateMeBody.safeParse(body).success, false);
  }
  assert.equal(updateMeBody.safeParse({ gender: null, avatarUrl: null }).success, true);
});

test("student onboarding requires gender while admin access is preserved", () => {
  const profile = { firstName: "Test", lastName: "Student", faculty: "Science", course: "Physics", level: "100", role: "student" };
  assert.equal(isMainProfileComplete(profile), false);
  assert.equal(isMainProfileComplete({ ...profile, gender: "male" }), true);
  assert.equal(isMainProfileComplete({ role: "admin" }), true);
});
