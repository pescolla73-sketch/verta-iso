import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { policyType, organizationData } = await req.json();
    console.log('Generating policy:', policyType, organizationData);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create system prompt based on policy type
    const systemPrompt = `Sei un esperto di sicurezza informatica ISO 27001. Genera una politica ${policyType} professionale in italiano.
La politica deve includere:
- Titolo e intestazione con nome organizzazione
- Scopo e obiettivi
- Ambito di applicazione
- Ruoli e responsabilità
- Riferimenti normativi (ISO 27001, GDPR se applicabile)
- Procedure e linee guida operative
- Revisione e aggiornamento
- Sezione approvazioni

Usa un tono formale e professionale. Includi sezioni numerate e ben strutturate.`;

    const userPrompt = `Genera una politica di ${policyType} per l'organizzazione "${organizationData.name}".

Informazioni organizzazione:
- Nome: ${organizationData.name}
- Settore: ${organizationData.sector || 'Non specificato'}
- CISO: ${organizationData.ciso || 'Da definire'}
- DPO: ${organizationData.dpo || 'Da definire'}

Asset critici: ${organizationData.criticalAssets?.join(', ') || 'Da definire'}
Controlli implementati: ${organizationData.implementedControls || 'Da valutare'}

Genera una politica completa, professionale e pronta per l'approvazione.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit raggiunto. Riprova tra qualche minuto." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crediti esauriti. Aggiungi crediti al tuo workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const policyContent = data.choices[0]?.message?.content;

    if (!policyContent) {
      throw new Error("No content generated");
    }

    console.log('Policy generated successfully');

    return new Response(
      JSON.stringify({ 
        content: policyContent,
        policyType,
        generatedAt: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error generating policy:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Errore nella generazione della politica" 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});