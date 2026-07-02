import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FINNHUB_API_KEY = Deno.env.get('FINNHUB_API_KEY')

Deno.serve(async (req) => {
  // Gère les requêtes CORS (nécessaire pour que le navigateur soit autorisé à appeler cette fonction)
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { symbole } = await req.json()

    if (!symbole) {
      return new Response(JSON.stringify({ error: 'Symbole manquant' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Appel à Finnhub pour le cours actuel
    const reponseCours = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbole}&token=${FINNHUB_API_KEY}`
    )
    const cours = await reponseCours.json()

    // Appel à Finnhub pour les infos de l'entreprise
    const reponseProfil = await fetch(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${symbole}&token=${FINNHUB_API_KEY}`
    )
    const profil = await reponseProfil.json()

    return new Response(
      JSON.stringify({
        symbole,
        coursActuel: cours.c,
        variationJour: cours.dp,
        nom: profil.name,
        logo: profil.logo,
        secteur: profil.finnhubIndustry,
      }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})