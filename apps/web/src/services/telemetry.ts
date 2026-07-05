import "server-only";

type ApiFailureEvent = {
  requestId: string;
  method: string;
  route: string;
  status: number;
  durationMs: number;
};

export function logApiFailure(event: ApiFailureEvent) {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      service: "project-mt-web",
      event: "api_request_failed",
      requestId: event.requestId,
      http: {
        method: event.method,
        route: event.route,
        status: event.status,
        durationMs: event.durationMs,
      },
    }),
  );
}
