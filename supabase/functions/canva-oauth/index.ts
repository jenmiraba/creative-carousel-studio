const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  // GET with get_auth_url param: return the authorization URL
  const getAuthUrl = url.searchParams.get("get_auth_url");
  if (getAuthUrl) {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      scope: "design:content:write",
      redirect_uri: redirectUri,
    });
    const authUrl = `https://www.canva.com/api/oauth/authorize?${params}`;
    return new Response(JSON.stringify({ auth_url: authUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  const clientId = Deno.env.get("CANVA_CLIENT_ID") || "";
  const clientSecret = Deno.env.get("CANVA_CLIENT_SECRET") || "";
  const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/canva-oauth`;

  // If there's an error from Canva
  if (error) {
    const errorDesc = url.searchParams.get("error_description") || error;
    return buildRedirectHtml({ error: errorDesc });
  }

  // If we have a code, exchange it for tokens
  if (code) {
    try {
      const tokenRes = await fetch("https://api.canva.com/rest/v1/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenRes.json();
      console.log("Canva token response status:", tokenRes.status);

      if (!tokenRes.ok || tokenData.error) {
        const errMsg = tokenData.error_description || tokenData.error || "Token exchange failed";
        console.error("Canva token error:", errMsg);
        return buildRedirectHtml({ error: errMsg });
      }

      return buildRedirectHtml({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error("Token exchange error:", msg);
      return buildRedirectHtml({ error: msg });
    }
  }

  // POST request: refresh token
  if (req.method === "POST") {
    try {
      const { refresh_token } = await req.json();
      if (!refresh_token) {
        return new Response(
          JSON.stringify({ error: "refresh_token is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenRes = await fetch("https://api.canva.com/rest/v1/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token,
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        return new Response(JSON.stringify(tokenData), {
          status: tokenRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(tokenData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});

function buildRedirectHtml(data: Record<string, unknown>): Response {
  const json = JSON.stringify(data);
  const html = `<!DOCTYPE html>
<html><head><title>Canva OAuth</title></head>
<body>
<script>
  if (window.opener) {
    window.opener.postMessage(${json}, "*");
    window.close();
  } else {
    document.body.innerText = "Podés cerrar esta ventana.";
  }
</script>
<p>Procesando… podés cerrar esta ventana.</p>
</body></html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
