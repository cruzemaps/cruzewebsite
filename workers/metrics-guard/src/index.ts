// cruze-metrics-guard: blocks public access to api.cruzemaps.com/metrics.
//
// The Flask backend serves Prometheus metrics at /metrics with no auth (by design for a
// single host, per CruzePlatform services/main-backend/flask_server.py), and the cloudflared
// tunnel exposes the whole host, so /metrics was readable by anyone on the internet.
// Prometheus/Grafana scrape 127.0.0.1:7071/metrics locally on the host, which does not go
// through Cloudflare, so this edge block does not affect internal scraping.
//
// The route in wrangler.jsonc is scoped to exactly api.cruzemaps.com/metrics, so this Worker
// only ever receives that path; every other path still reaches the tunnel. It answers 404 to
// avoid confirming the endpoint exists.
export default {
  async fetch(): Promise<Response> {
    return new Response("Not found\n", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};
