const N8N_PIXEL_WEBHOOK = "https://jonyai-n8n-webhook.c9hj2a.easypanel.host/webhook/pixel";
const MAX_BODY_BYTES = 24 * 1024;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });
}

export async function onRequestPost(context) {
  const { request } = context;
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");

  if (origin) {
    let originUrl;
    try {
      originUrl = new URL(origin);
    } catch (_) {
      return jsonResponse({ ok: false, error: "origin_not_allowed" }, 403);
    }
    if (originUrl.hostname !== requestUrl.hostname || originUrl.protocol !== requestUrl.protocol) {
      return jsonResponse({ ok: false, error: "origin_not_allowed" }, 403);
    }
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/x-www-form-urlencoded")) {
    return jsonResponse({ ok: false, error: "invalid_content_type" }, 415);
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return jsonResponse({ ok: false, error: "payload_too_large" }, 413);
  }

  const body = await request.text();
  if (!body || new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    return jsonResponse({ ok: false, error: "invalid_payload" }, 400);
  }

  const clientIp = request.headers.get("cf-connecting-ip") || "";
  const userAgent = request.headers.get("user-agent") || "";
  const country = request.cf?.country || "";
  const upstreamHeaders = new Headers({
    "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
    "x-forwarded-for": clientIp,
    "x-real-ip": clientIp,
    "x-client-ip": clientIp,
    "x-client-user-agent": userAgent,
    "x-client-country": country
  });

  const upstream = await fetch(N8N_PIXEL_WEBHOOK, {
    method: "POST",
    headers: upstreamHeaders,
    body
  });

  if (!upstream.ok) {
    return jsonResponse({ ok: false, error: "upstream_failed" }, 502);
  }

  return jsonResponse({ ok: true });
}

export function onRequest() {
  return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
}
