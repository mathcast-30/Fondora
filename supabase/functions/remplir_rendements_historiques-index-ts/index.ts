import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    // Données historiques CAC40/NASDAQ/S&P500 (exemple simplifié)
    const rendements = [
      // CAC40
      { indice: "CAC40", annee: 2000, rendement: -5.2 },
      { indice: "CAC40", annee: 2001, rendement: -21.3 },
      { indice: "CAC40", annee: 2002, rendement: -33.6 },
      { indice: "CAC40", annee: 2003, rendement: 28.5 },
      { indice: "CAC40", annee: 2004, rendement: 13.4 },
      { indice: "CAC40", annee: 2005, rendement: 13.8 },
      { indice: "CAC40", annee: 2006, rendement: 17.0 },
      { indice: "CAC40", annee: 2007, rendement: 1.6 },
      { indice: "CAC40", annee: 2008, rendement: -42.7 },
      { indice: "CAC40", annee: 2009, rendement: 18.3 },
      { indice: "CAC40", annee: 2010, rendement: 15.5 },
      { indice: "CAC40", annee: 2011, rendement: -17.3 },
      { indice: "CAC40", annee: 2012, rendement: 15.2 },
      { indice: "CAC40", annee: 2013, rendement: 18.0 },
      { indice: "CAC40", annee: 2014, rendement: 7.1 },
      { indice: "CAC40", annee: 2015, rendement: 8.5 },
      { indice: "CAC40", annee: 2016, rendement: 4.9 },
      { indice: "CAC40", annee: 2017, rendement: 9.5 },
      { indice: "CAC40", annee: 2018, rendement: -10.9 },
      { indice: "CAC40", annee: 2019, rendement: 26.4 },
      { indice: "CAC40", annee: 2020, rendement: -5.2 },
      { indice: "CAC40", annee: 2021, rendement: 28.9 },
      { indice: "CAC40", annee: 2022, rendement: -9.5 },
      { indice: "CAC40", annee: 2023, rendement: 16.5 },
      { indice: "CAC40", annee: 2024, rendement: 10.2 }, // Exemple
      { indice: "CAC40", annee: 2025, rendement: 5.8 }, // Exemple

      // NASDAQ
      { indice: "NASDAQ", annee: 2000, rendement: -39.3 },
      { indice: "NASDAQ", annee: 2001, rendement: -20.8 },
      { indice: "NASDAQ", annee: 2002, rendement: -31.5 },
      { indice: "NASDAQ", annee: 2003, rendement: 50.0 },
      { indice: "NASDAQ", annee: 2004, rendement: 8.6 },
      { indice: "NASDAQ", annee: 2005, rendement: 1.4 },
      { indice: "NASDAQ", annee: 2006, rendement: 9.5 },
      { indice: "NASDAQ", annee: 2007, rendement: 9.8 },
      { indice: "NASDAQ", annee: 2008, rendement: -40.5 },
      { indice: "NASDAQ", annee: 2009, rendement: 43.9 },
      { indice: "NASDAQ", annee: 2010, rendement: 16.9 },
      { indice: "NASDAQ", annee: 2011, rendement: 1.8 },
      { indice: "NASDAQ", annee: 2012, rendement: 15.9 },
      { indice: "NASDAQ", annee: 2013, rendement: 38.3 },
      { indice: "NASDAQ", annee: 2014, rendement: 13.4 },
      { indice: "NASDAQ", annee: 2015, rendement: 5.7 },
      { indice: "NASDAQ", annee: 2016, rendement: 7.5 },
      { indice: "NASDAQ", annee: 2017, rendement: 28.2 },
      { indice: "NASDAQ", annee: 2018, rendement: -3.9 },
      { indice: "NASDAQ", annee: 2019, rendement: 35.2 },
      { indice: "NASDAQ", annee: 2020, rendement: 43.6 },
      { indice: "NASDAQ", annee: 2021, rendement: 21.4 },
      { indice: "NASDAQ", annee: 2022, rendement: -32.5 },
      { indice: "NASDAQ", annee: 2023, rendement: 43.4 },
      { indice: "NASDAQ", annee: 2024, rendement: 25.8 }, // Exemple
      { indice: "NASDAQ", annee: 2025, rendement: 18.2 }, // Exemple

      // S&P500
      { indice: "S&P500", annee: 2000, rendement: -9.1 },
      { indice: "S&P500", annee: 2001, rendement: -11.9 },
      { indice: "S&P500", annee: 2002, rendement: -22.1 },
      { indice: "S&P500", annee: 2003, rendement: 28.7 },
      { indice: "S&P500", annee: 2004, rendement: 10.9 },
      { indice: "S&P500", annee: 2005, rendement: 4.9 },
      { indice: "S&P500", annee: 2006, rendement: 15.8 },
      { indice: "S&P500", annee: 2007, rendement: 5.5 },
      { indice: "S&P500", annee: 2008, rendement: -37.0 },
      { indice: "S&P500", annee: 2009, rendement: 26.5 },
      { indice: "S&P500", annee: 2010, rendement: 15.1 },
      { indice: "S&P500", annee: 2011, rendement: 2.1 },
      { indice: "S&P500", annee: 2012, rendement: 16.0 },
      { indice: "S&P500", annee: 2013, rendement: 32.4 },
      { indice: "S&P500", annee: 2014, rendement: 13.7 },
      { indice: "S&P500", annee: 2015, rendement: 1.4 },
      { indice: "S&P500", annee: 2016, rendement: 12.0 },
      { indice: "S&P500", annee: 2017, rendement: 19.4 },
      { indice: "S&P500", annee: 2018, rendement: -4.4 },
      { indice: "S&P500", annee: 2019, rendement: 31.5 },
      { indice: "S&P500", annee: 2020, rendement: 16.3 },
      { indice: "S&P500", annee: 2021, rendement: 26.9 },
      { indice: "S&P500", annee: 2022, rendement: -18.1 },
      { indice: "S&P500", annee: 2023, rendement: 24.2 },
      { indice: "S&P500", annee: 2024, rendement: 15.5 }, // Exemple
      { indice: "S&P500", annee: 2025, rendement: 10.1 }, // Exemple
    ];

    // Insérer les données en ignorant les doublons
    for (const r of rendements) {
      const { error } = await supabase
        .from("rendements_historiques")
        .insert(r)
        .ignore();
      if (error) console.error("Erreur insertion:", error);
    }

    return new Response(
      JSON.stringify({ message: "Données historiques insérées avec succès !" }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});