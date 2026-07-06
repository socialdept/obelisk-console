// Runs once on server boot (Next.js instrumentation hook). Starts the metrics
// poller in the Node.js runtime only (better-sqlite3 is a native addon).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startPoller } = await import("./lib/poller");
    startPoller();
  }
}
