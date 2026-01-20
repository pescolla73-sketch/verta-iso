-- Per la modalità demo, creiamo una policy che permette operazioni
-- su rischi dell'organizzazione demo quando non c'è utente autenticato.
-- ATTENZIONE: Questa policy è SOLO per sviluppo e va rimossa in produzione!

-- Variabile per l'organizzazione demo
-- Organization ID: f3bd7c71-2755-43ad-ae20-ffd9c5f56d22

-- Policy SELECT per demo mode (fallback quando auth.uid() è null)
CREATE POLICY "Demo mode can view demo org risks"
ON public.risks
FOR SELECT
TO anon
USING (organization_id = 'f3bd7c71-2755-43ad-ae20-ffd9c5f56d22');

-- Policy INSERT per demo mode
CREATE POLICY "Demo mode can insert demo org risks"
ON public.risks
FOR INSERT
TO anon
WITH CHECK (organization_id = 'f3bd7c71-2755-43ad-ae20-ffd9c5f56d22');

-- Policy UPDATE per demo mode
CREATE POLICY "Demo mode can update demo org risks"
ON public.risks
FOR UPDATE
TO anon
USING (organization_id = 'f3bd7c71-2755-43ad-ae20-ffd9c5f56d22')
WITH CHECK (organization_id = 'f3bd7c71-2755-43ad-ae20-ffd9c5f56d22');

-- Policy DELETE per demo mode
CREATE POLICY "Demo mode can delete demo org risks"
ON public.risks
FOR DELETE
TO anon
USING (organization_id = 'f3bd7c71-2755-43ad-ae20-ffd9c5f56d22');

-- Aggiungo un commento per ricordare di rimuovere queste policy in produzione
COMMENT ON POLICY "Demo mode can view demo org risks" ON public.risks IS 'DEVELOPMENT ONLY - Remove before production deployment';
COMMENT ON POLICY "Demo mode can insert demo org risks" ON public.risks IS 'DEVELOPMENT ONLY - Remove before production deployment';
COMMENT ON POLICY "Demo mode can update demo org risks" ON public.risks IS 'DEVELOPMENT ONLY - Remove before production deployment';
COMMENT ON POLICY "Demo mode can delete demo org risks" ON public.risks IS 'DEVELOPMENT ONLY - Remove before production deployment';