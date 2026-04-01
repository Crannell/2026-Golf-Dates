Here it is — select all of this and paste it into GitHub:
javascriptexports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // Use Netlify Blobs via the context object (no import needed)
  const { blobs } = context;

  async function blobGet(key) {
    try {
      const store = blobs.store("golf-planner");
      const result = await store.get(key, { type: "text" });
      return result;
    } catch(e) { return null; }
  }

  async function blobSet(key, value) {
    const store = blobs.store("golf-planner");
    await store.set(key, value);
  }

  // ── GET ──
  if (event.httpMethod === "GET") {
    const type = event.queryStringParameters?.type || "all";
    try {
      if (type === "config") {
        const raw = await blobGet("config");
        return { statusCode: 200, headers, body: raw || JSON.stringify(null) };
      }
      if (type === "responses") {
        const raw = await blobGet("responses");
        return { statusCode: 200, headers, body: raw || JSON.stringify({}) };
      }
      const [cfgRaw, respRaw] = await Promise.all([blobGet("config"), blobGet("responses")]);
      return {
        statusCode: 200, headers,
        body: JSON.stringify({
          config: cfgRaw ? JSON.parse(cfgRaw) : null,
          responses: respRaw ? JSON.parse(respRaw) : {},
        }),
      };
    } catch(e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  // ── POST ──
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      if (body.type === "config") {
        await blobSet("config", JSON.stringify(body.data));
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
      }
      if (body.type === "response") {
        const raw = await blobGet("responses");
        const responses = raw ? JSON.parse(raw) : {};
        responses[body.name] = { courseOrder: body.courseOrder, dates: body.dates, ts: Date.now() };
        await blobSet("responses", JSON.stringify(responses));
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
      }
      if (body.type === "clear_responses") {
        await blobSet("responses", JSON.stringify({}));
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
      }
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Unknown type" }) };
    } catch(e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
};
