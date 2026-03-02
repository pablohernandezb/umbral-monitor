-- ============================================================
-- Delete sports & entertainment articles from news_feed
--
-- STEP 1: Run the SELECT below to preview what will be deleted.
-- STEP 2: Once satisfied, run the DELETE statement.
--
-- Design notes:
--  - "fútbol" alone is NOT used for text matching — it appears in
--    political headlines (e.g. FIFA diplomatic interventions).
--    Only compound sports phrases are matched (e.g. "partido de fútbol").
--  - "actor/actriz" is NOT used — too ambiguous ("actores políticos").
--  - URL path check is the most reliable signal.
-- ============================================================

-- ── PREVIEW ─────────────────────────────────────────────────
SELECT id, source, headline_es, headline_en, external_url, published_at
FROM news_feed
WHERE
  -- 1. URL path signals a sports or entertainment section (most reliable)
  external_url ~* '\/(deportes?|sports?|entertainment|entretenimiento|espectaculos?|farandul)\/'

  -- 2. Unambiguous sports terms in Spanish headline or summary
  OR headline_es ~* '\y(b[eé]isbol|baloncesto|b[aá]squet(bol)?|basketball|voleibol|nataci[oó]n|atletismo|ciclismo|boxeo|tenis|golf|jonr[oó]n|pitcher|bateador|lanzador|cancha|estadio|goleador|grandes? ligas?|LVBP|Copa Am[eé]rica|Copa Libertadores|Copa Davis|mundial de f[uú]tbol|partido de f[uú]tbol|equipo de f[uú]tbol|liga venezolana de b[eé]isbol)\y'
  OR summary_es  ~* '\y(b[eé]isbol|baloncesto|b[aá]squet(bol)?|basketball|voleibol|nataci[oó]n|atletismo|ciclismo|boxeo|tenis|golf|jonr[oó]n|pitcher|bateador|lanzador|cancha|estadio|goleador|grandes? ligas?|LVBP|Copa Am[eé]rica|Copa Libertadores|Copa Davis|mundial de f[uú]tbol|partido de f[uú]tbol|equipo de f[uú]tbol|liga venezolana de b[eé]isbol)\y'

  -- 3. Unambiguous sports terms in English headline or summary
  OR headline_en ~* '\y(baseball|basketball|volleyball|swimming|athletics|cycling|boxing|tennis|golf|home ?run|pitcher|batter|stadium|scorer|major leagues?|MLB|NFL|NBA|FIFA|NHL|Copa Am[eé]rica|Copa Libertadores)\y'
  OR summary_en  ~* '\y(baseball|basketball|volleyball|swimming|athletics|cycling|boxing|tennis|golf|home ?run|pitcher|batter|stadium|scorer|major leagues?|MLB|NFL|NBA|FIFA|NHL|Copa Am[eé]rica|Copa Libertadores)\y'

  -- 4. Entertainment keywords in Spanish (no actor/actriz — too ambiguous)
  OR headline_es ~* '\y(far[aá]ndul|entretenimiento|espect[aá]culo|telenovela|celebridad|cantante|concierto|[aá]lbum musical|pel[ií]cula|temporada televisiva|reality show|influencer)\y'
  OR summary_es  ~* '\y(far[aá]ndul|entretenimiento|espect[aá]culo|telenovela|celebridad|cantante|concierto|[aá]lbum musical|pel[ií]cula|temporada televisiva|reality show|influencer)\y'

  -- 5. Entertainment keywords in English
  OR headline_en ~* '\y(entertainment|celebrity|singer|musician|concert|movie|film|reality show|influencer|telenovela)\y'
  OR summary_en  ~* '\y(entertainment|celebrity|singer|musician|concert|movie|film|reality show|influencer|telenovela)\y'

ORDER BY published_at DESC;


-- ── DELETE (run only after reviewing the SELECT above) ───────
/*

DELETE FROM news_feed
WHERE
  external_url ~* '\/(deportes?|sports?|entertainment|entretenimiento|espectaculos?|farandul)\/'

  OR headline_es ~* '\y(b[eé]isbol|baloncesto|b[aá]squet(bol)?|basketball|voleibol|nataci[oó]n|atletismo|ciclismo|boxeo|tenis|golf|jonr[oó]n|pitcher|bateador|lanzador|cancha|estadio|goleador|grandes? ligas?|LVBP|Copa Am[eé]rica|Copa Libertadores|Copa Davis|mundial de f[uú]tbol|partido de f[uú]tbol|equipo de f[uú]tbol|liga venezolana de b[eé]isbol)\y'
  OR summary_es  ~* '\y(b[eé]isbol|baloncesto|b[aá]squet(bol)?|basketball|voleibol|nataci[oó]n|atletismo|ciclismo|boxeo|tenis|golf|jonr[oó]n|pitcher|bateador|lanzador|cancha|estadio|goleador|grandes? ligas?|LVBP|Copa Am[eé]rica|Copa Libertadores|Copa Davis|mundial de f[uú]tbol|partido de f[uú]tbol|equipo de f[uú]tbol|liga venezolana de b[eé]isbol)\y'

  OR headline_en ~* '\y(baseball|basketball|volleyball|swimming|athletics|cycling|boxing|tennis|golf|home ?run|pitcher|batter|stadium|scorer|major leagues?|MLB|NFL|NBA|FIFA|NHL|Copa Am[eé]rica|Copa Libertadores)\y'
  OR summary_en  ~* '\y(baseball|basketball|volleyball|swimming|athletics|cycling|boxing|tennis|golf|home ?run|pitcher|batter|stadium|scorer|major leagues?|MLB|NFL|NBA|FIFA|NHL|Copa Am[eé]rica|Copa Libertadores)\y'

  OR headline_es ~* '\y(far[aá]ndul|entretenimiento|espect[aá]culo|telenovela|celebridad|cantante|concierto|[aá]lbum musical|pel[ií]cula|temporada televisiva|reality show|influencer)\y'
  OR summary_es  ~* '\y(far[aá]ndul|entretenimiento|espect[aá]culo|telenovela|celebridad|cantante|concierto|[aá]lbum musical|pel[ií]cula|temporada televisiva|reality show|influencer)\y'

  OR headline_en ~* '\y(entertainment|celebrity|singer|musician|concert|movie|film|reality show|influencer|telenovela)\y'
  OR summary_en  ~* '\y(entertainment|celebrity|singer|musician|concert|movie|film|reality show|influencer|telenovela)\y';

*/
