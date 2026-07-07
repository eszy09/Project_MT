const apiBaseUrl = requiredUrl("STAGING_API_BASE_URL");
const webUrl = requiredUrl("STAGING_WEB_URL");

await retry("API readiness", () =>
  checkJson(`${apiBaseUrl}/actuator/health/readiness`, (body) => {
    if (body.status !== "UP") {
      throw new Error(`API readiness was ${body.status}`);
    }
  }),
);

await retry("web health", () =>
  checkJson(`${webUrl}/api/health`, (body) => {
    if (body.status !== "ok") {
      throw new Error(`Web health was ${body.status}`);
    }
  }),
);

console.log("Staging smoke checks passed");

function requiredUrl(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value.replace(/\/$/, "");
}

async function checkJson(url, assertBody) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  assertBody(await response.json());
}

async function retry(name, operation) {
  const deadline = Date.now() + 5 * 60 * 1000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      await operation();
      return;
    } catch (error) {
      lastError = error;
      console.log(`${name} not ready yet: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    }
  }

  throw lastError;
}
