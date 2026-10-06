import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const sha256 = async (s: string) =>
  Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))))
    .map(b => b.toString(16).padStart(2, "0")).join("");

Deno.serve(async (req) => {
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Exiger aal2 : le JWT doit contenir amr "totp"
  const payload = JSON.parse(atob(token.split(".")[1]));
  if (payload.aal !== "aal2") return new Response("MFA requise", { status: 403 });

  await admin.from("mfa_recovery_codes").delete().eq("user_id", user.id); // régénération = invalide les anciens

  const codes = Array.from({ length: 10 }, () => {
    const b = crypto.getRandomValues(new Uint8Array(5));
    const h = Array.from(b).map(x => x.toString(16).padStart(2, "0")).join("").toUpperCase();
    return `${h.slice(0, 5)}-${h.slice(5)}`;
  });

  await admin.from("mfa_recovery_codes").insert(
    await Promise.all(codes.map(async c => ({ user_id: user.id, code_hash: await sha256(c) })))
  );
  return Response.json({ codes }); // affichés UNE seule fois
});