const ALLOWED_ORIGINS = [
  "https://threetwosix.co.uk",
  "https://pwllheli-bid.org.uk",
  "https://www.pwllheli-bid.org.uk"
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin"
  };
}

function isValidProposal(payload) {
  return [
    "name",
    "address",
    "postcode",
    "email",
    "proposal_type",
    "market",
    "selection",
    "odds",
    "stake",
    "gbp_equivalent"
  ].every(field => typeof payload[field] === "string" && payload[field].trim() !== "");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    // Serve the main site directly at the root (/, /index.html, or /pwllheli)
    if (url.pathname === "/" || url.pathname === "" || url.pathname === "/pwllheli" || url.pathname === "/pwllheli/") {
      url.pathname = "/thirdcrossing/index.html";
      return env.ASSETS.fetch(new Request(url, request));
    }

    if (url.pathname !== "/proposal") {
      // If it's another static asset, make sure it pulls from /thirdcrossing/ if needed, or pass through
      if (!url.pathname.startsWith("/thirdcrossing/")) {
        url.pathname = "/thirdcrossing" + url.pathname;
      }
      return env.ASSETS.fetch(new Request(url, request));
    }

    if (!ALLOWED_ORIGINS.includes(origin) && origin !== null) {
      return new Response("Origin not allowed", { status: 403 });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders(origin)
      });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response(JSON.stringify({ success: false, error: "Invalid request body." }), {
        status: 400,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" }
      });
    }

    if (!isValidProposal(payload)) {
      return new Response(JSON.stringify({ success: false, error: "Incomplete proposal details." }), {
        status: 400,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" }
      });
    }

    try {
      const response = await env.VOLUNTEER_FORM.fetch(
        new Request("https://tendring-volunteer.twells-tet.workers.dev/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
      );
      const contentType = response.headers.get("Content-Type") || "";
      const body = contentType.includes("application/json")
        ? await response.text()
        : JSON.stringify({
            success: false,
            error: "The proposal service returned an unexpected response."
          });

      return new Response(body, {
        status: response.status,
        headers: {
          ...corsHeaders(origin),
          "Content-Type": "application/json"
        }
      });
    } catch {
      return new Response(JSON.stringify({
        success: false,
        error: "The proposal service is unavailable. Please try again later."
      }), {
        status: 502,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" }
      });
    }
  }
};
