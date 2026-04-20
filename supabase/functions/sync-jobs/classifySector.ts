// ── SECTOR CLASSIFIER ────────────────────────────────────────────────────────
// Priority-based phrase matcher covering all 19 Sponsrr sectors
// Longer, more specific phrases are checked before ambiguous single words
// Used at job ingest time in sync-jobs edge function

export function classifySector(title: string): string {
  const t = (title || '').toLowerCase();
  const m = (pattern: string) => new RegExp(pattern).test(t);

  // ── TECHNOLOGY & IT ────────────────────────────────────────────────────────
  if (m('solutions architect|cloud architect|data architect|enterprise architect|software architect|it architect|security architect|network architect|systems architect|technical architect|application architect|integration architect')) return 'Technology & IT';
  if (m('software engineer|software developer|software development|full.?stack|frontend developer|backend developer|front.?end engineer|back.?end engineer')) return 'Technology & IT';
  if (m('data scientist|data engineer|machine learning|artificial intelligence|ai engineer|ml engineer|deep learning|nlp engineer')) return 'Technology & IT';
  if (m('devops|sre|site reliability|platform engineer|infrastructure engineer|cloud engineer|aws engineer|azure engineer|gcp engineer')) return 'Technology & IT';
  if (m('cybersecurity|cyber security|information security|infosec|penetration test|pen test|security analyst|security engineer|soc analyst')) return 'Technology & IT';
  if (m('it manager|it director|it support|helpdesk|service desk|it analyst|systems analyst|it consultant|technology consultant')) return 'Technology & IT';
  if (m('developer|programmer|react |angular|vue\.?js|node\.?js|python developer|java developer|php developer|ios developer|android developer')) return 'Technology & IT';
  if (m('database administrator|dba|data warehouse|bi developer|business intelligence|etl developer|tableau|power bi')) return 'Technology & IT';
  if (m('scrum master|agile coach|test engineer|qa engineer|quality assurance engineer|automation tester|test analyst')) return 'Technology & IT';
  if (m('engineering manager tech|head of engineering tech|vp engineering|cto|chief technology')) return 'Technology & IT';

  // ── HEALTHCARE & MEDICAL ───────────────────────────────────────────────────
  if (m('consultant physician|consultant surgeon|consultant psychiatrist|consultant radiologist|consultant anaesthetist|medical consultant|clinical consultant')) return 'Healthcare & Medical';
  if (m('staff nurse|registered nurse|community nurse|district nurse|theatre nurse|scrub nurse|paediatric nurse|mental health nurse|neonatal nurse|icu nurse|critical care nurse')) return 'Healthcare & Medical';
  if (m('general practitioner|gp partner|gp registrar|locum gp|salaried gp|clinical pharmacist|pharmacy manager|pharmacist')) return 'Healthcare & Medical';
  if (m('physiotherapist|occupational therapist|speech therapist|speech language|radiographer|sonographer|paramedic|operating department|anaesthetic practitioner')) return 'Healthcare & Medical';
  if (m('dentist|dental surgeon|orthodontist|dental nurse|dental therapist|optometrist|orthoptist|podiatrist|chiropodist')) return 'Healthcare & Medical';
  if (m('midwife|health visitor|school nurse|practice nurse|ward manager|clinical lead|ward sister|charge nurse')) return 'Healthcare & Medical';
  if (m('doctor|physician|surgeon|medical officer|house officer|foundation doctor|registrar nhs|nhs consultant')) return 'Healthcare & Medical';
  if (m('healthcare assistant|nursing assistant| hca ')) return 'Healthcare & Medical';

  // ── SOCIAL CARE ────────────────────────────────────────────────────────────
  if (m('social worker|approved mental health|best interests assessor|looked after children|child protection|safeguarding officer|family support worker')) return 'Social Care';
  if (m('care manager|care coordinator|support worker|residential support|supported living|domiciliary care|home care|deputy manager care|registered manager care')) return 'Social Care';
  if (m('youth worker|youth offending|probation officer|outreach worker|family worker|refuge worker|domestic abuse')) return 'Social Care';

  // ── EDUCATION ──────────────────────────────────────────────────────────────
  if (m('primary teacher|secondary teacher|special needs teacher|sen teacher|maths teacher|english teacher|science teacher|pe teacher|art teacher|music teacher|history teacher|geography teacher')) return 'Education';
  if (m('headteacher|head teacher|deputy head|assistant head|school principal|academy principal|executive headteacher')) return 'Education';
  if (m('university lecturer|college lecturer|further education lecturer|higher education lecturer|professor|senior lecturer|associate professor|research fellow|postdoctoral')) return 'Education';
  if (m('teaching assistant|learning support assistant|sen support|classroom assistant|nursery teacher|early years teacher|eyfs|senco')) return 'Education';
  if (m('teacher|lecturer|tutor|educator|curriculum')) return 'Education';

  // ── ENGINEERING ────────────────────────────────────────────────────────────
  if (m('mechanical engineer|electrical engineer|structural engineer|aerospace engineer|chemical engineer|manufacturing engineer|process engineer|production engineer|maintenance engineer|commissioning engineer|design engineer')) return 'Engineering';
  if (m('controls engineer|automation engineer|instrumentation engineer|piping engineer|hvac engineer|fire engineer|acoustics engineer|geotechnical engineer|rail engineer|highways engineer')) return 'Engineering';
  if (m('engineering director|principal engineer|lead engineer|chief engineer|engineering manager')) return 'Engineering';

  // ── CONSTRUCTION & ARCHITECTURE ────────────────────────────────────────────
  if (m('architect|architectural technologist|architectural technician|landscape architect|interior architect')) return 'Construction & Architecture';
  if (m('quantity surveyor|building surveyor|project surveyor|cost manager|estimator construction|site manager|site engineer|site supervisor|contracts manager|construction manager|building manager')) return 'Construction & Architecture';
  if (m('bim manager|bim coordinator|town planner|urban designer|planning officer')) return 'Construction & Architecture';
  if (m('construction|fit out|refurbishment manager|facilities manager|property manager')) return 'Construction & Architecture';

  // ── FINANCE & BANKING ──────────────────────────────────────────────────────
  if (m('investment banker|investment manager|portfolio manager|fund manager|asset manager|hedge fund|private equity|venture capital|wealth manager|financial advisor')) return 'Finance & Banking';
  if (m('credit analyst|credit risk|market risk|operational risk|compliance officer|aml analyst|kyc analyst|financial crime|fraud analyst')) return 'Finance & Banking';
  if (m('actuary|actuarial|underwriter|insurance broker|reinsurance|mortgage advisor|financial planner')) return 'Finance & Banking';
  if (m('treasury analyst|treasury manager|fx trader|equity trader|fixed income|derivatives|quantitative analyst|quant developer')) return 'Finance & Banking';
  if (m('finance manager|financial controller|finance director|head of finance|chief financial|cfo|fp&a|management accountant|financial accountant|group accountant')) return 'Finance & Banking';
  if (m('banker|banking|bank manager|corporate banking|retail banking|private banking')) return 'Finance & Banking';

  // ── ACCOUNTING & CONSULTING ────────────────────────────────────────────────
  if (m('chartered accountant|certified accountant|audit manager|external audit|internal audit|auditor|tax manager|tax accountant|tax advisor|transfer pricing|vat specialist')) return 'Accounting & Consulting';
  if (m('management consultant|strategy consultant|business consultant|transformation consultant|change manager|associate consultant|principal consultant|managing consultant')) return 'Accounting & Consulting';
  if (m('accountant|bookkeeper|payroll manager|payroll specialist|purchase ledger|sales ledger|accounts payable|accounts receivable|credit controller')) return 'Accounting & Consulting';

  // ── LEGAL ──────────────────────────────────────────────────────────────────
  if (m('solicitor|barrister|legal counsel|general counsel|in.?house lawyer|associate lawyer|partner law|legal director|head of legal')) return 'Legal';
  if (m('paralegal|legal assistant|legal secretary|legal executive|conveyancer|licensed conveyancer|trademark attorney|patent attorney|ip lawyer')) return 'Legal';
  if (m('employment lawyer|corporate lawyer|litigation lawyer|family lawyer|criminal lawyer|immigration lawyer|planning lawyer|real estate lawyer')) return 'Legal';

  // ── MARKETING & COMMUNICATIONS ─────────────────────────────────────────────
  if (m('marketing director|head of marketing|chief marketing|brand director|campaign manager|marketing manager')) return 'Marketing & Communications';
  if (m('digital marketing|seo manager|ppc manager|paid search|paid social|performance marketing|growth manager|email marketing|crm manager')) return 'Marketing & Communications';
  if (m('social media manager|community manager|content manager|content strategist|copywriter|communications manager|pr manager|public relations|press officer')) return 'Marketing & Communications';
  if (m('product marketing|demand generation|marketing operations|marketing analyst|market research|brand strategist')) return 'Marketing & Communications';

  // ── CREATIVE & DESIGN ──────────────────────────────────────────────────────
  if (m('ux designer|ui designer|ux/ui|product designer|interaction designer|service designer|user researcher|experience designer')) return 'Creative & Design';
  if (m('graphic designer|visual designer|brand designer|art director|creative director|motion designer|animator|illustrator|packaging designer')) return 'Creative & Design';
  if (m('fashion designer|textile designer|jewellery designer|garment technologist|pattern cutter|costume designer')) return 'Creative & Design';
  if (m('photographer|videographer|video editor|film editor|post production|vfx artist|3d artist|games designer|game artist')) return 'Creative & Design';
  if (m('web designer|digital designer|multimedia designer|interior designer|exhibition designer')) return 'Creative & Design';

  // ── HOSPITALITY & FOOD ─────────────────────────────────────────────────────
  if (m('head chef|executive chef|sous chef|chef de partie|commis chef|pastry chef|kitchen manager|catering manager|banqueting manager')) return 'Hospitality & Food';
  if (m('hotel manager|general manager hotel|front office manager|revenue manager|housekeeping manager|food beverage manager|restaurant manager|bar manager|pub manager')) return 'Hospitality & Food';
  if (m('food technologist|food scientist|food safety|new product development food|bakery manager|production manager food')) return 'Hospitality & Food';
  if (m('chef|hospitality manager|catering|events manager hotel')) return 'Hospitality & Food';

  // ── RETAIL & FASHION ───────────────────────────────────────────────────────
  if (m('retail manager|store manager|shop manager|area manager retail|visual merchandiser|merchandising manager|buying manager|fashion buyer|retail buyer')) return 'Retail & Fashion';
  if (m('ecommerce manager|online trading|digital trading|marketplace manager|amazon manager')) return 'Retail & Fashion';
  if (m('category manager retail|product manager retail|brand manager retail|commercial manager retail')) return 'Retail & Fashion';

  // ── TRANSPORT & LOGISTICS ──────────────────────────────────────────────────
  if (m('logistics manager|supply chain manager|procurement manager|sourcing manager|demand planner|supply planner|inventory manager|warehouse manager|distribution manager|transport manager|fleet manager')) return 'Transport & Logistics';
  if (m('freight manager|import manager|export manager|customs manager|shipping manager|fulfilment manager|delivery manager logistics')) return 'Transport & Logistics';
  if (m('air traffic controller|pilot|captain aviation|first officer|ground operations|airport operations')) return 'Transport & Logistics';

  // ── SCIENCE & RESEARCH ─────────────────────────────────────────────────────
  if (m('research scientist|principal scientist|senior scientist|laboratory manager|lab manager|analytical scientist|formulation scientist|clinical scientist|biomedical scientist')) return 'Science & Research';
  if (m('biologist|biochemist|chemist|physicist|microbiologist|immunologist|geneticist|neuroscientist|toxicologist|pharmacologist|epidemiologist')) return 'Science & Research';

  // ── RECRUITMENT & HR ───────────────────────────────────────────────────────
  if (m('hr director|hr manager|head of hr|chief people|people director|hr business partner|hrbp|hr advisor|hr generalist|hr coordinator|people partner|people operations')) return 'Recruitment & HR';
  if (m('talent acquisition|talent manager|head of talent|recruiter|recruitment manager|resourcing manager|internal recruiter|technical recruiter')) return 'Recruitment & HR';
  if (m('learning development|l&d manager|organisational development|training manager|employee experience|engagement manager|compensation benefits|reward manager')) return 'Recruitment & HR';

  // ── SPORT & FITNESS ────────────────────────────────────────────────────────
  if (m('personal trainer|fitness instructor|gym manager|fitness manager|strength conditioning|sports coach|head coach|football coach|rugby coach|athletics coach|swimming coach')) return 'Sport & Fitness';
  if (m('sports scientist|performance analyst|sport psychologist|sports therapist|sports physiotherapist|sports nutritionist|sports development')) return 'Sport & Fitness';

  // ── CHARITY & NON-PROFIT ───────────────────────────────────────────────────
  if (m('charity manager|ngo manager|non.?profit|fundraising manager|major donor|corporate partnerships charity|grant manager|philanthropy|programme manager charity|policy manager charity')) return 'Charity & Non-profit';
  if (m('advocacy manager|campaigns manager charity|volunteer manager|community engagement|international development|humanitarian|relief coordinator')) return 'Charity & Non-profit';

  // ── SECURITY ───────────────────────────────────────────────────────────────
  if (m('security manager|head of security|security director|security consultant|close protection|protective security|intelligence analyst security|counter terrorism|vetting officer')) return 'Security';
  if (m('information security manager|cyber security manager|security operations|soc manager|threat intelligence|incident response')) return 'Security';

  return 'Other';
}