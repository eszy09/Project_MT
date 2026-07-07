const component = process.argv[2];

if (!["api", "web"].includes(component)) {
  throw new Error("Usage: node scripts/staging/trigger-deploy.mjs <api|web>");
}

const operation = process.env.OPERATION ?? "deploy";
const hookUrl =
  component === "api"
    ? process.env.STAGING_API_DEPLOY_HOOK_URL
    : process.env.STAGING_WEB_DEPLOY_HOOK_URL;
const image =
  component === "api" ? process.env.API_IMAGE : process.env.WEB_IMAGE;

if (!hookUrl) {
  throw new Error(`Missing ${component} deployment hook URL`);
}

if (!image) {
  throw new Error(`Missing ${component} image reference`);
}

const headers = {
  "Content-Type": "application/json",
};

if (process.env.STAGING_DEPLOY_HOOK_TOKEN) {
  headers.Authorization = `Bearer ${process.env.STAGING_DEPLOY_HOOK_TOKEN}`;
}

const response = await fetch(hookUrl, {
  method: "POST",
  headers,
  body: JSON.stringify({
    action: operation,
    component,
    environment: "staging",
    image,
    tag: process.env.IMAGE_TAG,
    repository: process.env.GITHUB_REPOSITORY,
    runId: process.env.GITHUB_RUN_ID,
    sha: process.env.GITHUB_SHA,
  }),
});

if (!response.ok) {
  const body = await response.text();
  throw new Error(
    `${component} deployment hook failed with ${response.status}: ${body}`,
  );
}

console.log(`${component} deployment hook accepted image ${image}`);
