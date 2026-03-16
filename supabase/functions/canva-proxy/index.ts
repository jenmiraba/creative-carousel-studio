const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { canvaToken, action, designId, transactionId, operations } = await req.json();

    if (!canvaToken || !action || !designId) {
      return new Response(
        JSON.stringify({ error: "canvaToken, action, and designId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = `https://api.canva.com/rest/v1/designs/${designId}/editing`;
    let url: string;
    let body: string | undefined;

    switch (action) {
      case "start":
        url = `${baseUrl}/start`;
        break;
      case "perform":
        if (!transactionId || !operations) {
          return new Response(
            JSON.stringify({ error: "transactionId and operations are required for 'perform'" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        url = `${baseUrl}/operations`;
        body = JSON.stringify({ transaction_id: transactionId, operations });
        break;
      case "commit":
        if (!transactionId) {
          return new Response(
            JSON.stringify({ error: "transactionId is required for 'commit'" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        url = `${baseUrl}/commit`;
        body = JSON.stringify({ transaction_id: transactionId });
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const canvaRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${canvaToken}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body } : {}),
    });

    const text = await canvaRes.text();
    console.log(`Canva API [${action}] status=${canvaRes.status}:`, text);

    return new Response(text, {
      status: canvaRes.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Canva proxy error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
