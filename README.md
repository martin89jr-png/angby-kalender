# Min dagskalender – Ängby SK (GitHub + Supabase)

## Funktioner
- Mobilanpassad kalender med månadsnavigering och guldmarkering på datum med uppgifter.
- Uppgifter med datum, tid, viktighet, påminnelseinställning och checklista.
- Markera som klar, ändra och ta bort uppgifter.
- Supabase e-postinloggning och molnlagring med Row Level Security.
- PWA-installation på Windows, Android och iPhone.
- Lokalt sparläge när du inte är inloggad.

> Obs: påminnelsevalet sparas men system-/pushnotiser är inte implementerade än. Offlineändringar synkas inte automatiskt tillbaka senare.

## 1. Supabase
1. Skapa ett projekt på https://supabase.com/.
2. I projektets API-inställningar kopierar du Project URL och publishable key (eller legacy anon key).
3. Öppna SQL Editor och kör hela filen `supabase/schema.sql`.
4. Kontrollera Authentication > Providers att e-postinloggning är aktiverad.

Använd aldrig `service_role`-nyckeln i webbläsaren. Den här appen ska använda en publishable/anon key; RLS-policys begränsar varje konto till sina egna uppgifter.

## 2. GitHub Pages
1. Skapa ett repository, exempelvis `angby-kalender`.
2. Ladda upp innehållet i ZIP-filen till repositoryts rot; `index.html` ska ligga direkt i roten.
3. Gå till Settings > Pages.
4. Välj Deploy from a branch, branch `main`, folder `/(root)`, och spara.
5. När GitHub visar webbadressen öppnar du den. GitHub Pages ger HTTPS.

## 3. Koppla och logga in
1. Öppna den publicerade webbadressen.
2. Klicka Supabase-inställningar och ange Project URL och publishable/anon key.
3. Klicka Logga in > Skapa nytt konto.
4. Logga in med samma konto på datorn och mobilen. Inställningarna behöver fyllas i en gång per enhet.

## 4. Installera
- Windows: öppna sidan i Edge/Chrome och välj Installera app om knappen visas, eller använd webbläsarens meny.
- Android: Chrome-menyn > Installera app / Lägg till på startskärmen.
- iPhone: öppna i Safari > Dela > Lägg till på hemskärmen.

## Begränsningar i första versionen
- Uppgifter som lagts till lokalt före inloggning flyttas inte automatiskt till Supabase.
- Påminnelser sparas som inställning men skickar inte notiser ännu.
- PWA-skalet kan cachelagras, men inloggning och molnsynkronisering kräver internet.

## Automatisk synkronisering och påminnelser
- Appen använder Supabase Realtime för att hämta ändringar från `calendar_tasks` automatiskt. Kontrollera i Supabase att tabellen `public.calendar_tasks` är aktiverad i Realtime / `supabase_realtime` publication.
- Klicka på **Aktivera notiser** i appen och tillåt notiser i webbläsaren.
- Påminnelser med ljud/notis kontrolleras medan kalendern är öppen och körs i den webbläsaren/enheten. Webbläsare och mobilsystem kan pausa sidan när den är i bakgrunden eller enheten är låst. Detta är inte serverbaserade pushnotiser och garanterar inte påminnelser när appen är stängd.
