const ALLOWED_ORIGIN = "https://threetwosix.co.uk";
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
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
    if (url.pathname !== "/proposal") {
      return env.ASSETS.fetch(request);
    }

    if (request.headers.get("Origin") !== ALLOWED_ORIGIN) {
      return new Response("Origin not allowed", { status: 403 });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders()
      });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response(JSON.stringify({ success: false, error: "Invalid request body." }), {
        status: 400,
        headers: { ...corsHeaders(), "Content-Type": "application/json" }
      });
    }

    if (!isValidProposal(payload)) {
      return new Response(JSON.stringify({ success: false, error: "Incomplete proposal details." }), {
        status: 400,
        headers: { ...corsHeaders(), "Content-Type": "application/json" }
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
          ...corsHeaders(),
          "Content-Type": "application/json"
        }
      });
    } catch {
      return new Response(JSON.stringify({
        success: false,
        error: "The proposal service is unavailable. Please try again later."
      }), {
        status: 502,
        headers: { ...corsHeaders(), "Content-Type": "application/json" }
      });
    }
  }
};
