import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { sweepExpired } from "./services/cbt.service.js";

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`PrepMaster API running on http://localhost:${info.port}/v1`);
});

// Auto-submit abandoned CBT attempts once their deadline has passed.
setInterval(() => {
  sweepExpired()
    .then((n) => n && console.log(`Auto-submitted ${n} expired attempt(s)`))
    .catch((e) => console.error("sweepExpired failed", e));
}, 60_000);
