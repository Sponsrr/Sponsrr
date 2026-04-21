// ── FULL SOC CODE DATABASE ────────────────────────────────────────────────────
// Eligibility tiers post July 2025:
// 'higher' = RQF Level 6+ (degree level) — fully eligible
// 'medium' = RQF Level 3-5 — no longer eligible for new applications from July 2025
// 'ineligible' = not on the skilled worker list

export const SOC_DATABASE = [
  // ── TECHNOLOGY & IT ────────────────────────────────────────────────────────
  { code: '1136', title: 'IT Directors', sector: 'Technology & IT', tier: 'higher', rate: 80000, newEntrantRate: 56000 },
  { code: '2131', title: 'IT Project and Programme Managers', sector: 'Technology & IT', tier: 'higher', rate: 55000, newEntrantRate: 38500 },
  { code: '2132', title: 'IT Managers', sector: 'Technology & IT', tier: 'higher', rate: 58000, newEntrantRate: 40600 },
  { code: '2133', title: 'IT Business Analysts, Architects and Systems Designers', sector: 'Technology & IT', tier: 'higher', rate: 55000, newEntrantRate: 38500 },
  { code: '2134', title: 'Programmers and Software Development Professionals', sector: 'Technology & IT', tier: 'higher', rate: 52000, newEntrantRate: 36400 },
  { code: '2135', title: 'Cyber Security Professionals', sector: 'Technology & IT', tier: 'higher', rate: 55000, newEntrantRate: 38500 },
  { code: '2136', title: 'IT Quality and Testing Professionals', sector: 'Technology & IT', tier: 'higher', rate: 48000, newEntrantRate: 33600 },
  { code: '2137', title: 'IT Network Professionals', sector: 'Technology & IT', tier: 'higher', rate: 50000, newEntrantRate: 35000 },
  { code: '2139', title: 'Information Technology and Telecommunications Professionals (other)', sector: 'Technology & IT', tier: 'higher', rate: 48000, newEntrantRate: 33600 },
  { code: '2141', title: 'Web Design and Development Professionals', sector: 'Technology & IT', tier: 'higher', rate: 45000, newEntrantRate: 31500 },
  { code: '3544', title: 'Data Analysts', sector: 'Technology & IT', tier: 'higher', rate: 43000, newEntrantRate: 30100 },

  // ── HEALTHCARE & MEDICAL ───────────────────────────────────────────────────
  { code: '2211', title: 'Generalist Medical Practitioners (GPs)', sector: 'Healthcare & Medical', tier: 'higher', rate: 62000, newEntrantRate: 43400 },
  { code: '2212', title: 'Specialist Medical Practitioners', sector: 'Healthcare & Medical', tier: 'higher', rate: 78000, newEntrantRate: 54600 },
  { code: '2213', title: 'Medical Practitioners (other)', sector: 'Healthcare & Medical', tier: 'higher', rate: 60000, newEntrantRate: 42000 },
  { code: '2214', title: 'Psychologists', sector: 'Healthcare & Medical', tier: 'higher', rate: 48000, newEntrantRate: 33600 },
  { code: '2215', title: 'Paramedics', sector: 'Healthcare & Medical', tier: 'higher', rate: 36000, newEntrantRate: 25200 },
  { code: '2216', title: 'Midwives', sector: 'Healthcare & Medical', tier: 'higher', rate: 38000, newEntrantRate: 26600 },
  { code: '2217', title: 'Medical Radiographers', sector: 'Healthcare & Medical', tier: 'higher', rate: 40000, newEntrantRate: 28000 },
  { code: '2218', title: 'Physiotherapists', sector: 'Healthcare & Medical', tier: 'higher', rate: 38000, newEntrantRate: 26600 },
  { code: '2219', title: 'Health Professionals (other)', sector: 'Healthcare & Medical', tier: 'higher', rate: 36000, newEntrantRate: 25200 },
  { code: '2231', title: 'Nurses (General)', sector: 'Healthcare & Medical', tier: 'higher', rate: 33000, newEntrantRate: 23100 },
  { code: '2232', title: 'Registered Community Nurses', sector: 'Healthcare & Medical', tier: 'higher', rate: 35000, newEntrantRate: 24500 },
  { code: '2233', title: 'Registered Specialist Nurses', sector: 'Healthcare & Medical', tier: 'higher', rate: 37000, newEntrantRate: 25900 },
  { code: '2235', title: 'Registered Nursing Associates', sector: 'Healthcare & Medical', tier: 'higher', rate: 32000, newEntrantRate: 22400 },
  { code: '2241', title: 'Pharmacists', sector: 'Healthcare & Medical', tier: 'higher', rate: 45000, newEntrantRate: 31500 },
  { code: '2242', title: 'Pharmacologists and Toxicologists', sector: 'Healthcare & Medical', tier: 'higher', rate: 48000, newEntrantRate: 33600 },
  { code: '2251', title: 'Occupational Therapists', sector: 'Healthcare & Medical', tier: 'higher', rate: 38000, newEntrantRate: 26600 },
  { code: '2252', title: 'Speech and Language Therapists', sector: 'Healthcare & Medical', tier: 'higher', rate: 38000, newEntrantRate: 26600 },
  { code: '2253', title: 'Podiatrists and Chiropodists', sector: 'Healthcare & Medical', tier: 'higher', rate: 36000, newEntrantRate: 25200 },
  { code: '2254', title: 'Dietitians', sector: 'Healthcare & Medical', tier: 'higher', rate: 36000, newEntrantRate: 25200 },
  { code: '2255', title: 'Orthoptists and Optometrists', sector: 'Healthcare & Medical', tier: 'higher', rate: 40000, newEntrantRate: 28000 },
  { code: '2256', title: 'Arts Therapists', sector: 'Healthcare & Medical', tier: 'higher', rate: 34000, newEntrantRate: 23800 },
  { code: '2257', title: 'Dental Practitioners', sector: 'Healthcare & Medical', tier: 'higher', rate: 55000, newEntrantRate: 38500 },
  { code: '2258', title: 'Dispensing Opticians', sector: 'Healthcare & Medical', tier: 'higher', rate: 36000, newEntrantRate: 25200 },
  { code: '6141', title: 'Dental Nurses', sector: 'Healthcare & Medical', tier: 'medium', rate: 26000, newEntrantRate: 18200 },
  { code: '6143', title: 'Nursing Auxiliaries and Assistants', sector: 'Healthcare & Medical', tier: 'medium', rate: 24000, newEntrantRate: 16800 },

  // ── SOCIAL CARE ────────────────────────────────────────────────────────────
  { code: '2461', title: 'Social Workers', sector: 'Social Care', tier: 'higher', rate: 38000, newEntrantRate: 26600 },
  { code: '2463', title: 'Probation Officers', sector: 'Social Care', tier: 'higher', rate: 36000, newEntrantRate: 25200 },
  { code: '2442', title: 'Youth and Community Workers', sector: 'Social Care', tier: 'higher', rate: 32000, newEntrantRate: 22400 },
  { code: '6135', title: 'Care Workers and Home Carers', sector: 'Social Care', tier: 'medium', rate: 24000, newEntrantRate: 16800 },
  { code: '6136', title: 'Senior Care Workers', sector: 'Social Care', tier: 'medium', rate: 26000, newEntrantRate: 18200 },

  // ── EDUCATION ──────────────────────────────────────────────────────────────
  { code: '2311', title: 'Higher Education Teaching Professionals', sector: 'Education', tier: 'higher', rate: 45000, newEntrantRate: 31500 },
  { code: '2312', title: 'Further Education Teaching Professionals', sector: 'Education', tier: 'higher', rate: 38000, newEntrantRate: 26600 },
  { code: '2313', title: 'Secondary Education Teaching Professionals', sector: 'Education', tier: 'higher', rate: 38000, newEntrantRate: 26600 },
  { code: '2314', title: 'Primary and Nursery Education Teaching Professionals', sector: 'Education', tier: 'higher', rate: 36000, newEntrantRate: 25200 },
  { code: '2315', title: 'Special Needs Education Teaching Professionals', sector: 'Education', tier: 'higher', rate: 38000, newEntrantRate: 26600 },
  { code: '2316', title: 'Middle School Teaching Professionals', sector: 'Education', tier: 'higher', rate: 36000, newEntrantRate: 25200 },
  { code: '2319', title: 'Teaching and Educational Professionals (other)', sector: 'Education', tier: 'higher', rate: 34000, newEntrantRate: 23800 },
  { code: '2321', title: 'Educational Psychologists', sector: 'Education', tier: 'higher', rate: 48000, newEntrantRate: 33600 },
  { code: '2472', title: 'Senior Professionals of Educational Establishments', sector: 'Education', tier: 'higher', rate: 55000, newEntrantRate: 38500 },

  // ── ENGINEERING ────────────────────────────────────────────────────────────
  { code: '2121', title: 'Civil Engineers', sector: 'Engineering', tier: 'higher', rate: 48000, newEntrantRate: 33600 },
  { code: '2122', title: 'Mechanical Engineers', sector: 'Engineering', tier: 'higher', rate: 48000, newEntrantRate: 33600 },
  { code: '2123', title: 'Electrical Engineers', sector: 'Engineering', tier: 'higher', rate: 50000, newEntrantRate: 35000 },
  { code: '2124', title: 'Electronics Engineers', sector: 'Engineering', tier: 'higher', rate: 50000, newEntrantRate: 35000 },
  { code: '2125', title: 'Chemical Engineers', sector: 'Engineering', tier: 'higher', rate: 50000, newEntrantRate: 35000 },
  { code: '2126', title: 'Design and Development Engineers', sector: 'Engineering', tier: 'higher', rate: 48000, newEntrantRate: 33600 },
  { code: '2127', title: 'Production and Process Engineers', sector: 'Engineering', tier: 'higher', rate: 46000, newEntrantRate: 32200 },
  { code: '2128', title: 'Engineering Professionals (other)', sector: 'Engineering', tier: 'higher', rate: 46000, newEntrantRate: 32200 },
  { code: '2129', title: 'Aerospace Engineers', sector: 'Engineering', tier: 'higher', rate: 52000, newEntrantRate: 36400 },

  // ── FINANCE & BANKING ──────────────────────────────────────────────────────
  { code: '1131', title: 'Financial Managers and Directors', sector: 'Finance & Banking', tier: 'higher', rate: 75000, newEntrantRate: 52500 },
  { code: '2412', title: 'Finance and Investment Analysts', sector: 'Finance & Banking', tier: 'higher', rate: 52000, newEntrantRate: 36400 },
  { code: '2413', title: 'Financial and Accounting Technicians', sector: 'Finance & Banking', tier: 'higher', rate: 42000, newEntrantRate: 29400 },
  { code: '2414', title: 'Financial Advisers and Planners', sector: 'Finance & Banking', tier: 'higher', rate: 48000, newEntrantRate: 33600 },
  { code: '2415', title: 'Actuaries', sector: 'Finance & Banking', tier: 'higher', rate: 60000, newEntrantRate: 42000 },
  { code: '2421', title: 'Chartered and Certified Accountants', sector: 'Accounting & Consulting', tier: 'higher', rate: 50000, newEntrantRate: 35000 },
  { code: '2422', title: 'Management Accountants', sector: 'Accounting & Consulting', tier: 'higher', rate: 48000, newEntrantRate: 33600 },
  { code: '2423', title: 'Taxation Experts', sector: 'Accounting & Consulting', tier: 'higher', rate: 52000, newEntrantRate: 36400 },
  { code: '2424', title: 'Financial and Accounting Managers', sector: 'Accounting & Consulting', tier: 'higher', rate: 55000, newEntrantRate: 38500 },

  // ── LEGAL ──────────────────────────────────────────────────────────────────
  { code: '2411', title: 'Barristers and Judges', sector: 'Legal', tier: 'higher', rate: 70000, newEntrantRate: 49000 },
  { code: '2419', title: 'Solicitors and Lawyers', sector: 'Legal', tier: 'higher', rate: 58000, newEntrantRate: 40600 },
  { code: '2462', title: 'Legal Professionals (other)', sector: 'Legal', tier: 'higher', rate: 48000, newEntrantRate: 33600 },

  // ── SCIENCE & RESEARCH ─────────────────────────────────────────────────────
  { code: '2111', title: 'Chemical Scientists', sector: 'Science & Research', tier: 'higher', rate: 45000, newEntrantRate: 31500 },
  { code: '2112', title: 'Biological Scientists and Biochemists', sector: 'Science & Research', tier: 'higher', rate: 42000, newEntrantRate: 29400 },
  { code: '2113', title: 'Physical Scientists', sector: 'Science & Research', tier: 'higher', rate: 44000, newEntrantRate: 30800 },
  { code: '2114', title: 'Social and Humanities Scientists', sector: 'Science & Research', tier: 'higher', rate: 40000, newEntrantRate: 28000 },
  { code: '2115', title: 'Environmental Scientists', sector: 'Science & Research', tier: 'higher', rate: 42000, newEntrantRate: 29400 },
  { code: '2119', title: 'Natural and Social Science Professionals (other)', sector: 'Science & Research', tier: 'higher', rate: 40000, newEntrantRate: 28000 },
  { code: '2150', title: 'Research Scientists (general)', sector: 'Science & Research', tier: 'higher', rate: 45000, newEntrantRate: 31500 },

  // ── CONSTRUCTION & ARCHITECTURE ────────────────────────────────────────────
  { code: '2431', title: 'Architects', sector: 'Construction & Architecture', tier: 'higher', rate: 48000, newEntrantRate: 33600 },
  { code: '2432', title: 'Town Planners and Urban Designers', sector: 'Construction & Architecture', tier: 'higher', rate: 46000, newEntrantRate: 32200 },
  { code: '2433', title: 'Quantity Surveyors', sector: 'Construction & Architecture', tier: 'higher', rate: 48000, newEntrantRate: 33600 },
  { code: '2434', title: 'Chartered Surveyors (general)', sector: 'Construction & Architecture', tier: 'higher', rate: 50000, newEntrantRate: 35000 },
  { code: '5312', title: 'Construction Project Managers', sector: 'Construction & Architecture', tier: 'higher', rate: 52000, newEntrantRate: 36400 },
  { code: '3122', title: 'Architectural Technologists', sector: 'Construction & Architecture', tier: 'medium', rate: 36000, newEntrantRate: 25200 },

  // ── MARKETING & COMMUNICATIONS ─────────────────────────────────────────────
  { code: '1133', title: 'Marketing and Sales Directors', sector: 'Marketing & Communications', tier: 'higher', rate: 70000, newEntrantRate: 49000 },
  { code: '2471', title: 'Journalists and Newspaper Editors', sector: 'Marketing & Communications', tier: 'higher', rate: 40000, newEntrantRate: 28000 },
  { code: '2491', title: 'Advertising Accounts Managers and Creative Directors', sector: 'Marketing & Communications', tier: 'higher', rate: 50000, newEntrantRate: 35000 },
  { code: '3552', title: 'Marketing Associate Professionals', sector: 'Marketing & Communications', tier: 'medium', rate: 38000, newEntrantRate: 26600 },
  { code: '3553', title: 'PR and Communications Officers', sector: 'Marketing & Communications', tier: 'medium', rate: 36000, newEntrantRate: 25200 },

  // ── CREATIVE & DESIGN ──────────────────────────────────────────────────────
  { code: '2492', title: 'Graphic Designers', sector: 'Creative & Design', tier: 'higher', rate: 38000, newEntrantRate: 26600 },
  { code: '2493', title: 'UX and Product Designers', sector: 'Creative & Design', tier: 'higher', rate: 48000, newEntrantRate: 33600 },
  { code: '2494', title: 'Illustrators and Other Artists', sector: 'Creative & Design', tier: 'higher', rate: 36000, newEntrantRate: 25200 },
  { code: '3411', title: 'Artists', sector: 'Creative & Design', tier: 'medium', rate: 32000, newEntrantRate: 22400 },
  { code: '3412', title: 'Authors, Writers and Translators', sector: 'Creative & Design', tier: 'medium', rate: 34000, newEntrantRate: 23800 },
  { code: '3421', title: 'Graphic Designers (associate)', sector: 'Creative & Design', tier: 'medium', rate: 32000, newEntrantRate: 22400 },

  // ── RECRUITMENT & HR ───────────────────────────────────────────────────────
  { code: '1135', title: 'HR Directors and Managers', sector: 'Recruitment & HR', tier: 'higher', rate: 60000, newEntrantRate: 42000 },
  { code: '2443', title: 'HR and Training Officers', sector: 'Recruitment & HR', tier: 'higher', rate: 40000, newEntrantRate: 28000 },
  { code: '3562', title: 'HR and Industrial Relations Officers', sector: 'Recruitment & HR', tier: 'medium', rate: 36000, newEntrantRate: 25200 },

  // ── CONSULTING ─────────────────────────────────────────────────────────────
  { code: '2444', title: 'Management Consultants and Business Analysts', sector: 'Accounting & Consulting', tier: 'higher', rate: 55000, newEntrantRate: 38500 },
  { code: '2445', title: 'Business and Financial Project Management Professionals', sector: 'Accounting & Consulting', tier: 'higher', rate: 58000, newEntrantRate: 40600 },

  // ── TRANSPORT & LOGISTICS ──────────────────────────────────────────────────
  { code: '2141', title: 'Supply Chain Managers', sector: 'Transport & Logistics', tier: 'higher', rate: 50000, newEntrantRate: 35000 },
  { code: '3550', title: 'Procurement and Purchasing Officers', sector: 'Transport & Logistics', tier: 'medium', rate: 38000, newEntrantRate: 26600 },
  { code: '3541', title: 'Logistics and Distribution Managers', sector: 'Transport & Logistics', tier: 'medium', rate: 40000, newEntrantRate: 28000 },

  // ── HOSPITALITY (mostly ineligible post July 2025) ─────────────────────────
  { code: '1223', title: 'Restaurant and Catering Managers', sector: 'Hospitality & Food', tier: 'medium', rate: 32000, newEntrantRate: 22400 },
  { code: '5434', title: 'Chefs', sector: 'Hospitality & Food', tier: 'medium', rate: 30000, newEntrantRate: 21000 },
  { code: '9273', title: 'Kitchen and Catering Assistants', sector: 'Hospitality & Food', tier: 'ineligible', rate: null, newEntrantRate: null },
  { code: '9274', title: 'Waiters and Waitresses', sector: 'Hospitality & Food', tier: 'ineligible', rate: null, newEntrantRate: null },

  // ── RETAIL (mostly ineligible) ─────────────────────────────────────────────
  { code: '1150', title: 'Retail and Wholesale Managers', sector: 'Retail & Fashion', tier: 'medium', rate: 35000, newEntrantRate: 24500 },
  { code: '7111', title: 'Sales and Retail Assistants', sector: 'Retail & Fashion', tier: 'ineligible', rate: null, newEntrantRate: null },
  { code: '7130', title: 'Customer Service Occupations', sector: 'Retail & Fashion', tier: 'ineligible', rate: null, newEntrantRate: null },

  // ── SECURITY ───────────────────────────────────────────────────────────────
  { code: '3314', title: 'Security and Intelligence Analysts', sector: 'Security', tier: 'higher', rate: 45000, newEntrantRate: 31500 },
  { code: '9241', title: 'Security Guards', sector: 'Security', tier: 'ineligible', rate: null, newEntrantRate: null },

  // ── SPORT & FITNESS ────────────────────────────────────────────────────────
  { code: '3441', title: 'Sports Coaches and Instructors', sector: 'Sport & Fitness', tier: 'medium', rate: 30000, newEntrantRate: 21000 },
  { code: '2449', title: 'Sports and Fitness Professionals (other)', sector: 'Sport & Fitness', tier: 'higher', rate: 38000, newEntrantRate: 26600 },

  // ── CHARITY ────────────────────────────────────────────────────────────────
  { code: '2446', title: 'Social Policy and Development Professionals', sector: 'Charity & Non-profit', tier: 'higher', rate: 38000, newEntrantRate: 26600 },

  // ── ADMIN (generally ineligible) ──────────────────────────────────────────
  { code: '4111', title: 'Administrative Occupations (general)', sector: 'Other', tier: 'ineligible', rate: null, newEntrantRate: null },
  { code: '4112', title: 'Receptionists', sector: 'Other', tier: 'ineligible', rate: null, newEntrantRate: null },
  { code: '4122', title: 'Payroll Clerks', sector: 'Other', tier: 'ineligible', rate: null, newEntrantRate: null },

  // ── DRIVING / TRANSPORT WORKERS (ineligible) ───────────────────────────────
  { code: '8211', title: 'HGV Drivers', sector: 'Transport & Logistics', tier: 'ineligible', rate: null, newEntrantRate: null },
  { code: '8215', title: 'Bus and Coach Drivers', sector: 'Transport & Logistics', tier: 'ineligible', rate: null, newEntrantRate: null },
  { code: '8221', title: 'Taxi and Private Hire Drivers', sector: 'Transport & Logistics', tier: 'ineligible', rate: null, newEntrantRate: null },

  // ── CONSTRUCTION TRADES (ineligible post July 2025) ────────────────────────
  { code: '5311', title: 'Bricklayers and Masons', sector: 'Construction & Architecture', tier: 'ineligible', rate: null, newEntrantRate: null },
  { code: '5316', title: 'Plumbers and Gas Fitters', sector: 'Construction & Architecture', tier: 'ineligible', rate: null, newEntrantRate: null },
  { code: '5321', title: 'Electricians and Electrical Fitters', sector: 'Construction & Architecture', tier: 'ineligible', rate: null, newEntrantRate: null },
  { code: '5330', title: 'Construction and Building Trades (other)', sector: 'Construction & Architecture', tier: 'ineligible', rate: null, newEntrantRate: null },

  // ── MANUFACTURING / PROCESS (ineligible) ──────────────────────────────────
  { code: '8111', title: 'Production Managers and Directors (Manufacturing)', sector: 'Engineering', tier: 'medium', rate: 45000, newEntrantRate: 31500 },
  { code: '8131', title: 'Machine Operatives', sector: 'Other', tier: 'ineligible', rate: null, newEntrantRate: null },
  { code: '8139', title: 'Plant and Machine Operatives (other)', sector: 'Other', tier: 'ineligible', rate: null, newEntrantRate: null },
];