const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const store = getStore("golf-planner");

  // ── GET: read config or responses ──
  if (event.httpMethod === "GET") {
    const type = event.queryStringParameters?.type || "all";

    try {
      if (type === "config") {
        const raw = await store.get("config");
        if (!raw) return { statusCode: 200, headers, body: JSON.stringify(null) };
        return { statusCode: 200, headers, body: raw };
      }

      if (type === "responses") {
        const raw = await store.get("responses");
        if (!raw) return { statusCode: 200, headers, body: JSON.stringify({}) };
        return { statusCode: 200, headers, body: raw };
      }

      // all
      const [cfgRaw, respRaw] = await Promise.all([
        store.get("config"),
        store.get("responses"),
      ]);
      return {
        statusCode: 200, headers,
        body: JSON.stringify({
          config: cfgRaw ? JSON.parse(cfgRaw) : null,
          responses: respRaw ? JSON.parse(respRaw) : {},
        }),
      };
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  // ── POST: save config or a single response ──
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");

      if (body.type === "config") {
        await store.set("config", JSON.stringify(body.data));
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
      }

      if (body.type === "response") {
        const raw = await store.get("responses");
        const responses = raw ? JSON.parse(raw) : {};
        responses[body.name] = { courseOrder: body.courseOrder, dates: body.dates, ts: Date.now() };
        await store.set("responses", JSON.stringify(responses));
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
      }

      if (body.type === "clear_responses") {
        await store.set("responses", JSON.stringify({}));
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
      }

      return { statusCode: 400, headers, body: JSON.stringify({ error: "Unknown type" }) };
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
};
