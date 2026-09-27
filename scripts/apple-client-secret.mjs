#!/usr/bin/env node
/**
 * The Sign in with Apple client secret for Supabase (Authentication →
 * Providers → Apple → Secret Key). Apple caps it at six months, so this is
 * rerun twice a year with the same .p8 key.
 *
 *   node scripts/apple-client-secret.mjs <path-to-AuthKey_XXXX.p8>
 *
 * The secret goes to the clipboard (and, with Handoff on, to your iPhone's
 * clipboard too); it is never printed.
 */
import { readFileSync } from "node:fs";
import { createPrivateKey, sign } from "node:crypto";
import { execSync } from "node:child_process";
import { basename } from "node:path";

const TEAM_ID = "8SZST4B8CD";
const SERVICES_ID = "com.threadology.web";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/apple-client-secret.mjs <AuthKey_XXXX.p8>");
  process.exit(1);
}
const keyId = basename(file).match(/AuthKey_([A-Z0-9]+)\.p8$/)?.[1] ?? process.argv[3];
if (!keyId) {
  console.error("Couldn't read the Key ID from the file name — pass it as a second argument.");
  process.exit(1);
}

const key = createPrivateKey(readFileSync(file));
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const exp = now + 180 * 86400;
const input = `${b64({ alg: "ES256", kid: keyId, typ: "JWT" })}.${b64({
  iss: TEAM_ID,
  iat: now,
  exp,
  aud: "https://appleid.apple.com",
  sub: SERVICES_ID,
})}`;
const sig = sign("sha256", Buffer.from(input), { key, dsaEncoding: "ieee-p1363" }).toString("base64url");

execSync("pbcopy", { input: `${input}.${sig}` });
console.log(`Copied. Paste it into Supabase → Apple → Secret Key. It expires ${new Date(exp * 1000).toISOString().slice(0, 10)} — rerun this before then.`);
