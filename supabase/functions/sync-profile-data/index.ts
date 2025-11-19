import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    // Authorization check using custom secret
    const authHeader = req.headers.get("Authorization");
    const functionSecret = Deno.env.get("FUNCTION_SECRET");

    if (functionSecret && authHeader !== `Bearer ${functionSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all auth users
    const {
      data: { users },
      error: authError,
    } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    let synced = 0;
    let created = 0;

    // Sync each user with profiles table
    for (const user of users) {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!existingProfile) {
        // Create missing profile
        const { error: insertError } = await supabase.from("profiles").insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          updated_at: new Date().toISOString(),
        });
        if (!insertError) created++;
      } else {
        // Update existing profile with latest auth data
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            email: user.email,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
        if (!updateError) synced++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalUsers: users.length,
        created,
        synced,
        message: `Synced ${synced} profiles, created ${created} new profiles`,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
