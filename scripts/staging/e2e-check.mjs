const webUrl = requiredUrl("STAGING_WEB_URL");

await retry("web entry point", async () => {
  const response = await fetch(webUrl, {
    headers: {
      Accept: "text/html",
    },
  });

  if (!response.ok) {
    throw new Error(`Staging web home page returned ${response.status}`);
  }

  const html = await response.text();

  if (!html.includes("Project_MT")) {
    throw new Error(
      "Staging web home page did not include Project_MT branding",
    );
  }

  if (!html.includes("Train with context")) {
    throw new Error(
      "Staging web home page did not include the expected product copy",
    );
  }
});

console.log("Staging end-to-end checks passed");

function requiredUrl(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value.replace(/\/$/, "");
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
