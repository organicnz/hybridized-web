import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const emails = [
  "matias@matias.com",
  "dia.ben@outlook.com",
  "test@gmail.com",
  "teste@teste.com.br",
  "srikanth3199@gmail.com",
  "test@email.com",
  "dantetest@test.com",
  "dhtdghdhdg@gmail.com",
  "dante.grippaldi@codingit.io",
  "mangss52@gmail.com",
  "fernando@coutinhosp.com.br",
  "bashar@gmail.com",
  "cjrob@protonmail.com",
  "nicolas.pineda97@hotmail.com",
  "callu@gmail.com",
  "callucatoo6@gmail.com",
  "ssupawas@gmail.com",
  "rafael@gmail.com",
  "tamerlanium@gmail.com",
  "luissantiagoospinocaceres@gmail.com",
  "geheim@gmail.com",
  "ellinglien@gmail.com",
  "gghj@gmail.com",
  "dsad@dasd.sk",
  "taxtapp@gmail.com",
  "oscarmijael7w7@gmail.com",
  "al@gmail.com",
  "martinwestlake75@gmail.com",
  "firebase@flutterflow.io",
  "test@test.com",
];

serve(async (req) => {
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: existingUsers, error: fetchError } = await supabase
      .from("users")
      .select("email")
      .in("email", emails);

    if (fetchError) {
      return new Response(
        JSON.stringify({
          error: `Failed to fetch existing users: ${fetchError.message}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const existingEmails = new Set(existingUsers.map((user) => user.email));
    const results = [];

    for (const email of emails) {
      if (existingEmails.has(email)) {
        results.push({
          email,
          status: "skipped",
          details: "User already exists",
        });
        continue;
      }

      const { data, error } = await supabase.auth.admin.inviteUserByEmail(
        email,
        {
          redirectTo: "https://yourapp.com/set-password",
        },
      );

      if (error) {
        results.push({
          email,
          status: "failed",
          details: error.message,
        });
      } else {
        results.push({
          email,
          status: "invited",
          details: data,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return new Response(
      JSON.stringify({
        message: "Invitation process complete",
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: `Unexpected error: ${err.message}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
