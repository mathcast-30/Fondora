Deno.serve(async (req) => {
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Anti brute-force : 5 essais / 15 min
  const since = new Date(Date.now() - 15 * 60_000).toISOString();
  const { count } = await admin.from("mfa_recovery_attempts")
    .select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("attempted_at", since);
  if ((count ?? 0) >= 5) return new Response("Trop d'essais", { status: 429 });
  await admin.from("mfa_recovery_attempts").insert({ user_id: user.id });

  const { code } = await req.json();
  const hash = await sha256(code.trim().toUpperCase());
  const { data: row } = await admin.from("mfa_recovery_codes").select("id")
    .eq("user_id", user.id).eq("code_hash", hash).is("used_at", null).maybeSingle();
  if (!row) return new Response("Code invalide", { status: 400 });

  await admin.from("mfa_recovery_codes").update({ used_at: new Date().toISOString() }).eq("id", row.id);

  const { data: { factors } } = await admin.auth.admin.mfa.listFactors({ userId: user.id });
  for (const f of factors ?? []) await admin.auth.admin.mfa.deleteFactor({ id: f.id, userId: user.id });

  // + email Resend "Ta 2FA a été réinitialisée avec un code de secours"
  return Response.json({ success: true }); // le front redirige vers l'enrôlement d'un nouveau facteur
});