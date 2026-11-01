"use strict";
// PRIVATE CLOUD FUNCTION: deploy this as backend code; never upload the functions/
// directory, this source, or local admin scripts to your public website.
// This keeps the private email/password validator out of browser Inspect.
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { scryptSync, timingSafeEqual, createHash } = require("node:crypto");

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();
const ADMIN_EMAIL = "studyhubofficialadmin@gmail.com";
const PRIVATE_USER_UID = "studyhub-private-admin-v1";
// Encoded password verifier, not the literal admin password. scrypt(N=16384,r=8,p=1).
const PASSWORD_SALT_HEX = "b348995ddaf4fa4964f9ab1acae43887d32455d5def110ab";
const PASSWORD_SCRYPT_HEX = "c9466ab908aee8241ae4b6623457215026b723110ed515632e1553449921db327e5170a52347a51d0a8c05263212594db2d65d5a03dfd6e1b121c4416693091c";
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 20 * 60 * 1000;
const SERVER_PROJECT = "studyhubofficial-2e2de";

function verifyPassword(candidate) {
  const received = scryptSync(candidate, Buffer.from(PASSWORD_SALT_HEX, "hex"), 64, {N: 16384,r: 8,p: 1,maxmem: 64 * 1024 * 1024});
  const stored = Buffer.from(PASSWORD_SCRYPT_HEX, "hex");
  return received.length === stored.length && timingSafeEqual(received, stored);
}

exports.studyhubSecondaryLogin = onRequest({
  region: "us-central1",
  cors: true, // Allows a separate website domain; CORS is not authorization.
  maxInstances: 3,
  memory: "256MiB",
  timeoutSeconds: 30,
  invoker: "public"
}, async (req, res) => {
  res.set("Cache-Control", "no-store, private");
  res.set("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") { res.set("Allow", "POST"); return res.status(405).json({error:"Method not allowed"}); }
  if (!req.is("application/json")) return res.status(415).json({error:"JSON required"});
  if (Number(req.get("content-length") || 0) > 3000) return res.status(413).json({error:"Request too large"});
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (email.length > 150 || password.length > 180 || !email || !password) return res.status(400).json({error:"Invalid request"});
  if (process.env.GCLOUD_PROJECT && process.env.GCLOUD_PROJECT !== SERVER_PROJECT) return res.status(503).json({error:"Wrong Firebase project"});

  // A database-backed limiter works across Cloud Function instances.
  const ipAddress = String(req.ip || req.socket?.remoteAddress || "unknown");
  const ipHash = createHash("sha256").update("studyhub-admin-login:" + ipAddress).digest("hex");
  const limiterRef = db.collection("_internal_admin_login_limits").doc(ipHash);
  const now = Date.now();
  try {
    const isCorrectEmail = email === ADMIN_EMAIL;
    const isCorrectPassword = verifyPassword(password);
    const isValid = isCorrectEmail && isCorrectPassword;
    const state = await db.runTransaction(async (tx) => {
      const doc = await tx.get(limiterRef);
      const previous = doc.exists ? doc.data() : {};
      if (Number(previous.lockedUntil || 0) > now) return {blocked:true};
      if (isValid) {
        tx.delete(limiterRef);
        return {blocked:false,valid:true};
      }
      const withinWindow = now - Number(previous.windowStartedAt || 0) < WINDOW_MS;
      const count = (withinWindow ? Number(previous.attempts || 0) : 0) + 1;
      tx.set(limiterRef, {
        attempts: count,
        windowStartedAt: withinWindow ? Number(previous.windowStartedAt) : now,
        lockedUntil: count >= MAX_FAILURES ? now + LOCKOUT_MS : 0,
        updatedAt: now
      });
      return {blocked:count >= MAX_FAILURES,valid:false};
    });
    if (state.blocked) return res.status(429).json({error:"Too many attempts. Please try later."});
    if (!state.valid) return res.status(401).json({error:"Invalid administrator credentials"});

    // The Firebase token is generated SERVER-SIDE after a successful password check.
    // No public HTML can mint one. This UID and claim are checked by Firestore rules.
    const token = await admin.auth().createCustomToken(PRIVATE_USER_UID, {studyhub_private_admin:true});
    return res.status(200).json({token});
  } catch (err) {
    console.error("Private admin sign-in failed internally:", err);
    return res.status(503).json({error:"Private administrator service unavailable"});
  }
});
