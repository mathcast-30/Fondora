import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const FINNHUB_KEY = Deno.env.get('FINNHUB_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const body = await req.text();
    if (!body) return new Response("Ticker manquant", { status: 400, headers: corsHeaders });
    
    const { ticker, type } = JSON.parse(body);
    if (!ticker) return new Response("Ticker manquant", { status: 400, headers: corsHeaders });

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // 1. Demander les détails du profil à Finnhub
    const profileRes = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${FINNHUB_KEY}`);
    const profileData = await profileRes.json();

    // 2. Déduire le logo via Clearbit si le domaine web est disponible, sinon icône générique stylisée
    let logoUrl = `https://unavatar.io/duckduckgo/${ticker.toLowerCase()}`;
    if (profileData.weburl) {
      const domain = profileData.weburl.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
      logoUrl = `https://logo.clearbit.com/${domain}`;
    }

    const nomActif = profileData.name || ticker;
    const devise = profileData.currency || 'EUR';

    // 3. Insérer l'actif manquant dans notre catalogue global
    const { data: newAsset, error: insertError } = await supabase
      .from('catalogue_actifs')
      .upsert({ 
        ticker: ticker.toUpperCase(), 
        nom: nomActif, 
        type: type || 'ACTION', 
        devise: devise,
        logo_url: logoUrl 
      }, { onConflict: 'ticker' })
      .select()
      .single();

    if (insertError) throw insertError;

    // 4. Récupérer immédiatement le cours du jour actuel
    const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_KEY}`);
    const quoteData = await quoteRes.json();

    if (quoteData.c) {
      await supabase.from('historique_prix_actifs').upsert({
        actif_id: newAsset.id,
        date: new Date().toISOString().split('T')[0],
        prix_cloture: quoteData.c
      }, { onConflict: 'actif_id,date' });
    }

    return new Response(JSON.stringify({ success: true, asset: newAsset }), {
      headers: corsHeaders
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    }});
  }
});
