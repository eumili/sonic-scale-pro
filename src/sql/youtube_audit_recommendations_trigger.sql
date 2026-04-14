-- Run this in Supabase SQL Editor
-- Creates trigger to auto-populate recommendations JSONB on youtube_audit

CREATE OR REPLACE FUNCTION public.generate_youtube_audit_recommendations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  items jsonb := '[]'::jsonb;
  red_count int := 0;
  yellow_count int := 0;
  total_count int := 0;
  priority_counter int := 0;
  rec jsonb;
  ind record;
  indicators jsonb;
BEGIN
  indicators := jsonb_build_array(
    jsonb_build_object('key','shorts_publishing','category','Shorts','label','Publicare Shorts',
      'red_issue','Nu publici Shorts deloc sau foarte rar — pierzi vizibilitate organică majoră.',
      'red_action','Începe să publici minim 2-3 Shorts pe săptămână. Folosește clipuri din videoclipuri existente, momente din studio sau behind-the-scenes.',
      'red_impact','Shorts-urile pot genera 5-10x mai multe impresii decât un video obișnuit. Algoritmul YouTube favorizează canalele active pe Shorts.',
      'red_effort','Mic',
      'yellow_issue','Publici Shorts, dar nu suficient de consistent pentru a beneficia de algoritmul YouTube.',
      'yellow_action','Crește frecvența la minim 3 Shorts/săptămână și menține un program regulat de publicare.',
      'yellow_impact','Consistența pe Shorts poate dubla reach-ul organic în 30 de zile.',
      'yellow_effort','Mic'),
    jsonb_build_object('key','shorts_optimization','category','Shorts','label','Optimizare Shorts',
      'red_issue','Shorts-urile tale nu sunt optimizate — lipsesc hashtag-uri, titluri hook și thumbnail-uri atractive.',
      'red_action','Adaugă titluri cu hook puternic (primele 3 secunde contează), hashtag-uri relevante și thumbnail custom.',
      'red_impact','Shorts-urile optimizate pot obține de 3-5x mai multe vizualizări față de cele neoptimizate.',
      'red_effort','Mic',
      'yellow_issue','Shorts-urile au optimizare parțială — unele elemente lipsesc.',
      'yellow_action','Verifică fiecare Short înainte de publicare: titlu cu hook, 3-5 hashtag-uri, thumbnail custom.',
      'yellow_impact','O optimizare completă poate crește CTR-ul cu 20-40%.',
      'yellow_effort','Mic'),
    jsonb_build_object('key','shorts_cta','category','Shorts','label','CTA în Shorts',
      'red_issue','Shorts-urile tale nu au call-to-action — vizitatorii nu știu ce să facă după vizionare.',
      'red_action','Adaugă CTA clar la finalul fiecărui Short: "Abonează-te", "Ascultă piesa pe Spotify", "Link în bio".',
      'red_impact','Un CTA bun poate crește rata de abonare cu 15-25% și trimite trafic către platformele de streaming.',
      'red_effort','Mic',
      'yellow_issue','Unele Shorts-uri au CTA, dar nu toate.',
      'yellow_action','Creează un template standard pentru CTA și include-l în fiecare Short publicat.',
      'yellow_impact','Consistența CTA-urilor crește conversiile cu 10-20% pe termen lung.',
      'yellow_effort','Mic'),
    jsonb_build_object('key','playlists_status','category','Playlists','label','Status Playlists',
      'red_issue','Nu ai playlist-uri organizate pe canal — vizitatorii nu pot descoperi conținutul tău ușor.',
      'red_action','Creează minim 3 playlist-uri: "Toate piesele oficiale", "Live Sessions" și "Cele mai populare".',
      'red_impact','Playlist-urile cresc timpul de vizionare pe canal cu 20-40%.',
      'red_effort','Mic',
      'yellow_issue','Ai playlist-uri, dar sunt incomplete sau dezorganizate.',
      'yellow_action','Actualizează playlist-urile existente, adaugă videoclipuri lipsă și verifică ordinea.',
      'yellow_impact','Playlist-uri complete cresc sesiunile de vizionare cu 15-25%.',
      'yellow_effort','Mic'),
    jsonb_build_object('key','playlists_optimization','category','Playlists','label','Optimizare Playlists',
      'red_issue','Playlist-urile nu au titluri și descrieri optimizate pentru SEO.',
      'red_action','Adaugă titluri descriptive cu keywords și descrieri de minim 100 cuvinte cu link-uri.',
      'red_impact','Playlist-uri SEO-optimizate pot apărea în căutări YouTube și Google.',
      'red_effort','Mic',
      'yellow_issue','Playlist-urile au optimizare parțială.',
      'yellow_action','Completează descrierile tuturor playlist-urilor cu keywords relevante.',
      'yellow_impact','Îmbunătățirea descrierilor poate crește descoperibilitatea cu 15-20%.',
      'yellow_effort','Mic'),
    jsonb_build_object('key','playlists_traffic','category','Playlists','label','Trafic Playlists',
      'red_issue','Playlist-urile nu generează trafic semnificativ.',
      'red_action','Promovează playlist-urile în end screens, carduri, descrieri video și rețele sociale.',
      'red_impact','Promovarea activă a playlist-urilor poate crește vizualizările pe canal cu 25-35%.',
      'red_effort','Mediu',
      'yellow_issue','Playlist-urile au trafic moderat dar pot fi promovate mai agresiv.',
      'yellow_action','Adaugă link-uri către playlist-uri în primele 3 rânduri ale descrierilor video.',
      'yellow_impact','Cross-promovarea poate crește traficul pe playlist-uri cu 20%.',
      'yellow_effort','Mic'),
    jsonb_build_object('key','thumbnails_custom_design','category','Thumbnails','label','Design Custom',
      'red_issue','Nu folosești thumbnail-uri custom — YouTube generează automat imagini care nu atrag click-uri.',
      'red_action','Creează thumbnail-uri custom pentru TOATE videoclipurile: text mare, contrast puternic, fața ta, branding consistent.',
      'red_impact','Thumbnail-uri custom pot dubla CTR-ul și cresc dramatic vizualizările.',
      'red_effort','Mediu',
      'yellow_issue','Ai thumbnail-uri custom pe unele videoclipuri, dar nu pe toate.',
      'yellow_action','Creează un template de thumbnail și aplică-l retroactiv.',
      'yellow_impact','Consistența vizuală crește recunoașterea brandului și CTR-ul cu 15-30%.',
      'yellow_effort','Mediu'),
    jsonb_build_object('key','thumbnails_ctr','category','Thumbnails','label','CTR Thumbnails',
      'red_issue','CTR-ul thumbnail-urilor este sub media platformei.',
      'red_action','Testează A/B thumbnail-uri diferite. Folosește: culori contrastante, text de maxim 4 cuvinte, expresie, curiozitate.',
      'red_impact','Creșterea CTR de la 2% la 5% poate tripla vizualizările organice.',
      'red_effort','Mediu',
      'yellow_issue','CTR-ul este mediu — există potențial de optimizare.',
      'yellow_action','Analizează cele mai performante thumbnail-uri și replică stilul.',
      'yellow_impact','Optimizarea poate crește CTR-ul cu 20-40%.',
      'yellow_effort','Mic'),
    jsonb_build_object('key','community_frequent_posts','category','Community','label','Postări Frecvente',
      'red_issue','Nu folosești tab-ul Community — pierzi o unealtă gratuită de engagement.',
      'red_action','Postează minim 2 ori pe săptămână: sondaje, behind-the-scenes, anunțuri, întrebări.',
      'red_impact','Postările Community cresc engagement-ul cu 30-50%.',
      'red_effort','Mic',
      'yellow_issue','Postezi pe Community, dar nu suficient de regulat.',
      'yellow_action','Creează un calendar: Luni = sondaj, Joi = anunț/behind-the-scenes.',
      'yellow_impact','Regularitatea crește vizibilitatea în feed cu 20-30%.',
      'yellow_effort','Mic'),
    jsonb_build_object('key','community_music_promotion','category','Community','label','Promovare Muzică',
      'red_issue','Nu folosești Community pentru a promova muzica.',
      'red_action','La fiecare lansare, postează pe Community: link Spotify/Apple Music, preview, CTA clar.',
      'red_impact','Poate genera 500-2000 click-uri extra per lansare.',
      'red_effort','Mic',
      'yellow_issue','Promovezi muzica pe Community, dar fără strategie clară.',
      'yellow_action','Adaugă link-uri directe și CTA specific în fiecare postare.',
      'yellow_impact','CTA-uri clare pot crește click-urile cu 40-60%.',
      'yellow_effort','Mic'),
    jsonb_build_object('key','community_discussions','category','Community','label','Discuții',
      'red_issue','Nu interacționezi cu comunitatea — comentariile rămân fără răspuns.',
      'red_action','Răspunde la minim 5 comentarii per videoclip în primele 24h.',
      'red_impact','Interacțiunea semnalează algoritmului că videoclipul generează conversație.',
      'red_effort','Mic',
      'yellow_issue','Interacționezi parțial — unele comentarii primesc răspuns.',
      'yellow_action','Setează 15 min/zi pentru a răspunde la comentarii.',
      'yellow_impact','Consistența crește loialitatea fanilor cu 25-35%.',
      'yellow_effort','Mic'),
    jsonb_build_object('key','end_screens_status','category','Other','label','End Screens',
      'red_issue','Videoclipurile nu au end screens.',
      'red_action','Adaugă end screens pe TOATE videoclipurile: "cel mai recent video" + "playlist populară" + buton abonare.',
      'red_impact','End screens pot crește vizualizările per sesiune cu 20-40%.',
      'red_effort','Mic',
      'yellow_issue','Unele videoclipuri au end screens, dar nu toate.',
      'yellow_action','Adaugă end screens retroactiv și creează un template standard.',
      'yellow_impact','Acoperirea completă crește traficul intern cu 15-25%.',
      'yellow_effort','Mic'),
    jsonb_build_object('key','cards_status','category','Other','label','Carduri',
      'red_issue','Nu folosești carduri interactive în videoclipuri.',
      'red_action','Adaugă 2-3 carduri per videoclip: link la playlist, video similar.',
      'red_impact','Cardurile pot genera 5-10% trafic adițional.',
      'red_effort','Mic',
      'yellow_issue','Folosești carduri pe unele videoclipuri, dar nu consistent.',
      'yellow_action','Adaugă carduri pe toate videoclipurile și include-le în workflow.',
      'yellow_impact','Carduri consistente cresc descoperirea cu 10-15%.',
      'yellow_effort','Mic'),
    jsonb_build_object('key','description_quality','category','Other','label','Calitate Descrieri',
      'red_issue','Descrierile videoclipurilor sunt scurte sau inexistente.',
      'red_action','Scrie descrieri de minim 200 cuvinte: hook + keywords, link-uri streaming, social media, timestamps, hashtag-uri.',
      'red_impact','Descrieri complete pot crește traficul din căutare cu 30-50%.',
      'red_effort','Mediu',
      'yellow_issue','Descrierile au conținut dar lipsesc elemente cheie.',
      'yellow_action','Creează un template și aplică-l pe videoclipurile noi + cele populare.',
      'yellow_impact','Optimizarea poate crește traficul organic cu 15-25%.',
      'yellow_effort','Mic'),
    jsonb_build_object('key','channel_cover_status','category','Other','label','Cover Canal',
      'red_issue','Banner-ul canalului lipsește sau nu este profesional.',
      'red_action','Creează un banner profesional (2560x1440px) cu: numele, genul muzical, programul de upload.',
      'red_impact','Un banner profesional crește rata de abonare cu 10-20%.',
      'red_effort','Mic',
      'yellow_issue','Banner-ul există dar nu este actualizat.',
      'yellow_action','Actualizează cu informații curente: ultima lansare, turneu.',
      'yellow_impact','Un banner actualizat crește conversiile cu 5-10%.',
      'yellow_effort','Mic'),
    jsonb_build_object('key','artist_profile_status','category','Other','label','Profil Artist',
      'red_issue','Profilul YouTube nu este complet.',
      'red_action','Completează "About" cu bio profesională, adaugă link-uri verificate, watermark și trailer.',
      'red_impact','Un profil complet crește rata de abonare cu 15-25%.',
      'red_effort','Mic',
      'yellow_issue','Profilul este parțial completat.',
      'yellow_action','Completează toate secțiunile lipsă.',
      'yellow_impact','Un profil 100% complet crește abonările cu 10-15%.',
      'yellow_effort','Mic'),
    jsonb_build_object('key','titles_tags_quality','category','Video SEO','label','Titluri & Tag-uri',
      'red_issue','Titlurile și tag-urile nu sunt optimizate pentru căutare.',
      'red_action','Folosește keywords în titlu. Adaugă 15-20 tag-uri relevante per video.',
      'red_impact','Pot crește traficul din căutare cu 40-60%.',
      'red_effort','Mic',
      'yellow_issue','Titlurile sunt ok dar tag-urile insuficiente.',
      'yellow_action','Adaugă tag-uri specifice: numele tău, genul muzical, artiști similari.',
      'yellow_impact','Tag-uri relevante îmbunătățesc recomandările cu 20-30%.',
      'yellow_effort','Mic'),
    jsonb_build_object('key','keywords_in_desc','category','Video SEO','label','Keywords în Descrieri',
      'red_issue','Descrierile nu conțin keywords relevante.',
      'red_action','Include keywords principale în primele 2 rânduri + de 2-3 ori în descriere.',
      'red_impact','Poate crește apariția în sugestii cu 25-40%.',
      'red_effort','Mic',
      'yellow_issue','Unele descrieri conțin keywords dar nu consistent.',
      'yellow_action','Creează o listă de 20 keywords și include-le sistematic.',
      'yellow_impact','Consistența crește traficul organic cu 15-25%.',
      'yellow_effort','Mic'),
    jsonb_build_object('key','artist_ranking_keywords','category','Video SEO','label','Ranking Keywords',
      'red_issue','Nu apari în rezultatele de căutare pentru numele tău artistic.',
      'red_action','Optimizează videoclipurile importante cu titluri exacte, descrieri bogate și tag-uri.',
      'red_impact','Ranking-ul pe propriul nume este esențial — fanii trebuie să te găsească pe primul loc.',
      'red_effort','Mediu',
      'yellow_issue','Apari în căutări dar nu pe primele poziții.',
      'yellow_action','Re-optimizează titlurile, descrierile și tag-urile videoclipurilor care nu rankează.',
      'yellow_impact','Poate crește vizualizările organice cu 20-35%.',
      'yellow_effort','Mic'),
    jsonb_build_object('key','channel_tags_status','category','Channel SEO','label','Tag-uri Canal',
      'red_issue','Canalul nu are tag-uri setate.',
      'red_action','Adaugă tag-uri în YouTube Studio > Settings: numele tău, genul muzical, keywords.',
      'red_impact','Tag-urile ajută YouTube să recomande videoclipurile publicului potrivit.',
      'red_effort','Mic',
      'yellow_issue','Canalul are tag-uri dar insuficiente.',
      'yellow_action','Extinde lista cu variante ale numelui, subgenuri și keywords trending.',
      'yellow_impact','Tag-uri mai complete îmbunătățesc recomandările cu 10-20%.',
      'yellow_effort','Mic'),
    jsonb_build_object('key','channel_seo_optimization','category','Channel SEO','label','SEO Canal',
      'red_issue','SEO-ul general al canalului este slab.',
      'red_action','Optimizează: descriere 500+ cuvinte, link-uri verificate, trailer, watermark, secțiuni organizate.',
      'red_impact','Poate crește traficul organic cu 30-50% pe termen lung.',
      'red_effort','Mediu',
      'yellow_issue','SEO-ul este parțial optimizat.',
      'yellow_action','Completează elementele lipsă: link-uri, secțiuni featured, descriere extinsă.',
      'yellow_impact','Fiecare element adăugat contribuie cu 5-10% vizibilitate.',
      'yellow_effort','Mic'),
    jsonb_build_object('key','backlinks_structure','category','Channel SEO','label','Backlink-uri',
      'red_issue','Nu ai backlink-uri externe către canal.',
      'red_action','Adaugă link-ul YouTube pe profiluri sociale, site-ul personal, directoare muzicale.',
      'red_impact','Backlink-urile cresc autoritatea pe Google și generează trafic extern.',
      'red_effort','Mediu',
      'yellow_issue','Ai câteva backlink-uri dar structura poate fi îmbunătățită.',
      'yellow_action','Extinde prezența pe directoare muzicale și platforme de PR.',
      'yellow_impact','Poate crește traficul din Google cu 15-30%.',
      'yellow_effort','Mediu')
  );

  -- First pass: red indicators
  FOR ind IN SELECT * FROM jsonb_array_elements(indicators)
  LOOP
    DECLARE
      key_name text := ind.value->>'key';
      status_val text;
    BEGIN
      EXECUTE format('SELECT ($1).%I::text', key_name) INTO status_val USING NEW;
      IF status_val = 'red' THEN
        priority_counter := priority_counter + 1;
        red_count := red_count + 1;
        rec := jsonb_build_object(
          'indicator', ind.value->>'label',
          'status', 'red',
          'category', ind.value->>'category',
          'priority', priority_counter,
          'issue', ind.value->>'red_issue',
          'action', ind.value->>'red_action',
          'impact', ind.value->>'red_impact',
          'effort', ind.value->>'red_effort'
        );
        items := items || jsonb_build_array(rec);
      END IF;
    END;
  END LOOP;

  -- Second pass: yellow indicators
  FOR ind IN SELECT * FROM jsonb_array_elements(indicators)
  LOOP
    DECLARE
      key_name text := ind.value->>'key';
      status_val text;
    BEGIN
      EXECUTE format('SELECT ($1).%I::text', key_name) INTO status_val USING NEW;
      IF status_val = 'yellow' THEN
        priority_counter := priority_counter + 1;
        yellow_count := yellow_count + 1;
        rec := jsonb_build_object(
          'indicator', ind.value->>'label',
          'status', 'yellow',
          'category', ind.value->>'category',
          'priority', priority_counter,
          'issue', ind.value->>'yellow_issue',
          'action', ind.value->>'yellow_action',
          'impact', ind.value->>'yellow_impact',
          'effort', ind.value->>'yellow_effort'
        );
        items := items || jsonb_build_array(rec);
      END IF;
    END;
  END LOOP;

  total_count := red_count + yellow_count;

  NEW.recommendations := jsonb_build_object(
    'items', items,
    'total', total_count,
    'red', red_count,
    'yellow', yellow_count
  );

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_generate_audit_recommendations ON public.youtube_audit;
CREATE TRIGGER trg_generate_audit_recommendations
  BEFORE INSERT OR UPDATE ON public.youtube_audit
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_youtube_audit_recommendations();

-- Backfill existing rows (trigger fires on UPDATE)
UPDATE public.youtube_audit SET updated_at = now()
WHERE recommendations IS NULL OR NOT (recommendations ? 'items') OR jsonb_array_length(COALESCE(recommendations->'items', '[]'::jsonb)) = 0;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.youtube_audit;
