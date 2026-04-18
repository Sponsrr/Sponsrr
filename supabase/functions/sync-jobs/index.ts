import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ADZUNA_APP_ID  = '8204bb0d';
const ADZUNA_APP_KEY = '25ddabb84c2bd761074f9d6133317038';
const REED_API_KEY   = 'e77e52ab-e146-446f-bd33-ef5c473e1203';
const SUPABASE_URL   = Deno.env.get('SB_URL')!;
const SUPABASE_KEY   = Deno.env.get('SB_SERVICE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Minimum salary threshold — Skilled Worker going rate floor
const SALARY_THRESHOLD = 41700;

// Search term batches — rotated hourly so we cover everything across the day
const TERM_BATCHES: Record<number, string[]> = {
  0:  ['software engineer', 'data engineer', 'devops engineer'],
  1:  ['nurse', 'staff nurse', 'registered nurse'],
  2:  ['accountant', 'finance manager', 'financial analyst'],
  3:  ['teacher', 'lecturer', 'education manager'],
  4:  ['mechanical engineer', 'electrical engineer', 'civil engineer'],
  5:  ['product manager', 'project manager', 'programme manager'],
  6:  ['doctor', 'gp', 'consultant physician'],
  7:  ['architect', 'structural engineer', 'quantity surveyor'],
  8:  ['data scientist', 'machine learning engineer', 'ai engineer'],
  9:  ['social worker', 'care manager', 'support worker'],
  10: ['marketing manager', 'digital marketing', 'seo manager'],
  11: ['solicitor', 'lawyer', 'legal counsel'],
  12: ['pharmacist', 'clinical pharmacist', 'pharmacy manager'],
  13: ['chef', 'head chef', 'sous chef'],
  14: ['cyber security', 'information security', 'security analyst'],
  15: ['hr manager', 'human resources', 'talent acquisition'],
  16: ['radiographer', 'radiologist', 'imaging specialist'],
  17: ['supply chain manager', 'logistics manager', 'operations manager'],
  18: ['business analyst', 'systems analyst', 'it consultant'],
  19: ['therapist', 'occupational therapist', 'physiotherapist'],
  20: ['dentist', 'dental surgeon', 'oral surgeon'],
  21: ['ux designer', 'ui designer', 'product designer'],
  22: ['frontend developer', 'backend developer', 'full stack developer'],
  23: ['construction manager', 'site manager', 'project engineer'],
};

// ── HELPERS ───────────────────────────────────────────────────────────────────

function generateSlug(title: string, company: string, location: string, id: string): string {
  const base = `${title}-${company}-${location}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
  return `${base}-${id.slice(0, 8)}`;
}

function meetsThreshold(salaryMin: number | null, salaryMax: number | null): boolean {
  // If no salary info at all, let it through as "possible" — we can't verify
  if (!salaryMin && !salaryMax) return true;
  const salary = salaryMin || salaryMax || 0;
  return salary >= SALARY_THRESHOLD;
}

async function matchCompany(companyName: string) {
  if (!companyName) return null;
  const { data } = await supabase
    .from('companies')
    .select('id, name')
    .ilike('name', `%${companyName}%`)
    .limit(1)
    .single();
  return data;
}

// ── ADZUNA SYNC ───────────────────────────────────────────────────────────────

async function syncAdzuna(terms: string[]): Promise<number> {
  let inserted = 0;

  for (const term of terms) {
    try {
      // Pull 2 pages per term = 100 jobs per term
      for (let page = 1; page <= 2; page++) {
        const url = `https://api.adzuna.com/v1/api/jobs/gb/search/${page}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=50&what=${encodeURIComponent(term)}&content-type=application/json`;

        const res = await fetch(url);
        if (!res.ok) break;
        const data = await res.json();
        const jobs = data.results || [];
        if (jobs.length === 0) break;

        for (const job of jobs) {
          const companyName = job.company?.display_name || '';
          if (!companyName) continue;

          const salaryMin = job.salary_min ? Math.round(job.salary_min) : null;
          const salaryMax = job.salary_max ? Math.round(job.salary_max) : null;

          // Skip jobs clearly below threshold
          if (!meetsThreshold(salaryMin, salaryMax)) continue;

          const match = await matchCompany(companyName);
          const externalId = `adzuna_${job.id?.toString() || ''}`;
          const slug = generateSlug(job.title || '', companyName, job.location?.display_name || '', externalId);

          await supabase.from('jobs').upsert({
            external_id:      externalId,
            slug,
            title:            job.title,
            company_name:     companyName,
            company_id:       match?.id || null,
            location:         job.location?.display_name || '',
            description:      job.description,
            apply_url:        job.redirect_url,
            salary_min:       salaryMin,
            salary_max:       salaryMax,
            source:           'adzuna',
            sponsorship_tier: match ? 'confirmed' : 'possible',
            is_active:        true,
            posted_at:        job.created ? new Date(job.created).toISOString() : new Date().toISOString(),
          }, { onConflict: 'external_id' });

          inserted++;
        }
      }
    } catch (e) {
      console.error(`Adzuna error for term "${term}":`, e);
    }
  }

  return inserted;
}

// ── REED SYNC ─────────────────────────────────────────────────────────────────

async function syncReed(terms: string[]): Promise<number> {
  let inserted = 0;

  for (const term of terms) {
    try {
      // Reed returns up to 100 results per call, paginate with resultsToSkip
      for (let skip = 0; skip <= 100; skip += 100) {
        const url = `https://www.reed.co.uk/api/1.0/search?keywords=${encodeURIComponent(term)}&locationName=United Kingdom&minimumSalary=${SALARY_THRESHOLD}&resultsToTake=100&resultsToSkip=${skip}`;

        const res = await fetch(url, {
          headers: {
            'Authorization': `Basic ${btoa(REED_API_KEY + ':')}`,
          },
        });

        if (!res.ok) break;
        const data = await res.json();
        const jobs = data.results || [];
        if (jobs.length === 0) break;

        for (const job of jobs) {
          const companyName = job.employerName || '';
          if (!companyName) continue;

          const salaryMin = job.minimumSalary ? Math.round(job.minimumSalary) : null;
          const salaryMax = job.maximumSalary ? Math.round(job.maximumSalary) : null;

          if (!meetsThreshold(salaryMin, salaryMax)) continue;

          const match = await matchCompany(companyName);
          const externalId = `reed_${job.jobId?.toString() || ''}`;
          const slug = generateSlug(job.jobTitle || '', companyName, job.locationName || '', externalId);

          await supabase.from('jobs').upsert({
            external_id:      externalId,
            slug,
            title:            job.jobTitle,
            company_name:     companyName,
            company_id:       match?.id || null,
            location:         job.locationName || '',
            description:      job.jobDescription,
            apply_url:        job.jobUrl,
            salary_min:       salaryMin,
            salary_max:       salaryMax,
            source:           'reed',
            sponsorship_tier: match ? 'confirmed' : 'possible',
            is_active:        true,
            posted_at:        job.date ? new Date(job.date).toISOString() : new Date().toISOString(),
          }, { onConflict: 'external_id' });

          inserted++;
        }

        // If we got less than 100 results, no point paginating further
        if (jobs.length < 100) break;
      }
    } catch (e) {
      console.error(`Reed error for term "${term}":`, e);
    }
  }

  return inserted;
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));

    // Which batch to run — passed in by cron or manually
    // If not specified, use current hour to auto-select batch
    const hour = body.batch ?? new Date().getUTCHours();
    const terms = TERM_BATCHES[hour % 24] || TERM_BATCHES[0];

    // Alternate sources by hour — even hours = Adzuna, odd hours = Reed
    // This means each source gets 12 runs per day
    const source = body.source || (hour % 2 === 0 ? 'adzuna' : 'reed');

    console.log(`Running ${source} sync for hour ${hour}, terms: ${terms.join(', ')}`);

    let inserted = 0;
    if (source === 'reed') {
      inserted = await syncReed(terms);
    } else {
      inserted = await syncAdzuna(terms);
    }

    

    return new Response(JSON.stringify({
      success: true,
      source,
      hour,
      terms,
      inserted,
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Sync error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});