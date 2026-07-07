import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "documentation/release/SECURITY_PRIVACY_ACCESSIBILITY_REVIEW.md",
  "documentation/release/PRODUCTION_RELEASE_APPROVAL.md",
  "documentation/architecture/data/BODY_CHECKINS.md",
  "documentation/architecture/data/JOURNAL_PRIVACY.md",
  "documentation/architecture/data/MEDIA_UPLOAD_POLICY.md",
  "documentation/architecture/deployment/STAGING_PIPELINE.md",
  "documentation/architecture/deployment/CONTAINER_IMAGES.md",
];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    throw new Error(`Missing release review file: ${file}`);
  }
}

const review = readFileSync(requiredFiles[0], "utf8");
const approval = readFileSync(requiredFiles[1], "utf8");

const requiredSections = [
  "Threat model and authorization test review",
  "Dependency and container scan thresholds",
  "WCAG 2.2 AA critical-flow review",
  "Data export, deletion, consent, and retention verification",
  "Backup restoration and incident procedure tests",
  "Owner production approval",
];

for (const section of requiredSections) {
  if (!review.includes(section)) {
    throw new Error(`Missing release review section: ${section}`);
  }
}

const approvalStatement = "I approve this Project_MT production release";

if (
  process.env.OWNER_APPROVAL &&
  process.env.OWNER_APPROVAL !== approvalStatement
) {
  throw new Error(`Owner approval must exactly equal: ${approvalStatement}`);
}

for (const name of [
  "RELEASE_CANDIDATE",
  "BACKUP_RESTORE_EVIDENCE",
  "INCIDENT_DRILL_EVIDENCE",
]) {
  if (process.env[name] !== undefined && process.env[name].trim().length < 8) {
    throw new Error(`${name} is too short to be useful release evidence`);
  }
}

if (!approval.includes(approvalStatement)) {
  throw new Error(
    "Production approval document is missing the approval statement",
  );
}

console.log("Release review evidence structure is valid");
