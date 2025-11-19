import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  console.log("Keep-alive ping received at:", new Date().toISOString());

  const responseMessage = {
    message: "Keep-alive ping successful!",
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(responseMessage), {
    headers: {
      "Content-Type": "application/json",
      Connection: "keep-alive",
    },
  });
});
