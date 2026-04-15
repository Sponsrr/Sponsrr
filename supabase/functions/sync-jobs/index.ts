import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ADZUNA_APP_ID = '8204bb0d';
const ADZUNA_APP_KEY = '25ddabb84c2bd761074f9d6133317038';
const SUPABASE_URL = Deno.env.get('SB_URL')!;
const SUPABASE_KEY = Deno.env.get('SB_SERVICE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

Deno.serve(async (req) => {
  try {
    const { term = 'software engineer', pages = 3 } = await req.json().catch(() => ({}));
    let totalInserted = 0;

    for (let page = 1; page <= pages; page++) {
      const url = `https://api.adzuna.com/v1/api/jobs/gb/search/${page}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=50&what=${encodeURIComponent(term)}&content-type=application/json`;

      const res = await fetch(url);
      if (!res.ok) break;
      const data = await res.json();
      const jobs = data.results || [];
      if (jobs.length === 0) break;

      for (const job of jobs) {
        const companyName = job.company?.display_name || '';
        if (!companyName) continue;

        const { data: match } = await supabase
          .from('companies')
          .select('id, name')
          .ilike('name', `%${companyName}%`)
          .limit(1)
          .single();

        await supabase.from('jobs').upsert({
          external_id: job.id,
          title: job.title,
          company_name: companyName,
          company_id: match?.id || null,
          location: job.location?.display_name || '',
          description: job.description,
          apply_url: job.redirect_url,
          salary_min: job.salary_min ? Math.round(job.salary_min) : null,
          salary_max: job.salary_max ? Math.round(job.salary_max) : null,
          source: 'adzuna',
          sponsorship_tier: match ? 'confirmed' : 'possible',
          is_active: true,
          posted_at: job.created ? new Date(job.created).toISOString() : new Date().toISOString(),
        }, { onConflict: 'external_id' });

        totalInserted++;
      }
    }

    return new Response(JSON.stringify({ success: true, term, inserted: totalInserted }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});