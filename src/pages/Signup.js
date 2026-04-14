import React, { useState } from 'react';
import { supabase } from '../supabase';

function Signup() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setStep(2);
      setLoading(false);
    }
  }

  return (
    <div style={{ background:'#080808', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      <style>{`
        .auth-input:focus { border-color: rgba(200,255,0,0.5) !important; outline: none; }
        .auth-btn:hover { background: #b8ef00 !important; }
        .auth-link:hover { color: #c8ff00 !important; }
      `}</style>

      <a href="/" style={{ textDecoration:'none', marginBottom:'2.5rem' }}>
        <div style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.5rem', letterSpacing:'-0.04em', color:'#f0ede8' }}>
          Sponsrr<span style={{ color:'#c8ff00' }}>.</span>
        </div>
      </a>

      {step === 1 && (
        <div style={{ background:'#111', border:'1px solid rgba(240,237,232,0.07)', borderRadius:24, padding:'2.5rem', width:'100%', maxWidth:420 }}>
          <h1 style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.8rem', letterSpacing:'-0.04em', color:'#f0ede8', marginBottom:'0.5rem' }}>
            Create your account.
          </h1>
          <p style={{ fontSize:'0.9rem', color:'rgba(240,237,232,0.4)', marginBottom:'2rem' }}>
            Join thousands finding sponsored roles in the UK.
          </p>

          {error && (
            <div style={{ background:'rgba(255,77,0,0.1)', border:'1px solid rgba(255,77,0,0.2)', borderRadius:12, padding:'0.85rem 1rem', marginBottom:'1.5rem', fontSize:'0.85rem', color:'#ff4d00' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div>
              <label style={labelStyle}>Full name</label>
              <input className="auth-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Preet Varvanic" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input className="auth-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input className="auth-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} style={inputStyle} />
            </div>
            <button className="auth-btn" type="submit" disabled={loading} style={{ background:'#c8ff00', color:'#080808', border:'none', borderRadius:100, padding:'0.95rem', fontWeight:700, fontSize:'0.95rem', cursor: loading ? 'default' : 'pointer', marginTop:'0.5rem', transition:'background 0.2s', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating account...' : 'Create account →'}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:'0.85rem', color:'rgba(240,237,232,0.35)', marginTop:'1.5rem' }}>
            Already have an account?{' '}
            <a href="/login" className="auth-link" style={{ color:'rgba(240,237,232,0.6)', textDecoration:'none', fontWeight:600, transition:'color 0.2s' }}>Sign in</a>
          </p>
        </div>
      )}

      {step === 2 && <Onboarding name={name} />}
    </div>
  );
}

function Onboarding({ name }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [jobTitle, setJobTitle] = useState('');
  const [experience, setExperience] = useState('');
  const [isNewEntrant, setIsNewEntrant] = useState('');
  const [gradYear, setGradYear] = useState('');
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [locations, setLocations] = useState([]);
  const [salaryBand, setSalaryBand] = useState(4);

  const firstName = name ? name.split(' ')[0] : 'there';

  const experienceOptions = [
    'Less than 1 year',
    '1 to 3 years',
    '3 to 5 years',
    '5 to 10 years',
    '10 years or more',
  ];

  const locationOptions = [
    'London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol',
    'Edinburgh', 'Glasgow', 'Cardiff', 'Liverpool', 'Nottingham',
    'Sheffield', 'Cambridge', 'Oxford', 'Newcastle', 'Leicester',
  ];

  const salaryBands = [
    'Under £25,000', '£25k – £30k', '£30k – £35k', '£35k – £40k',
    '£40k – £45k', '£45k – £50k', '£50k – £60k', '£60k – £75k',
    '£75k – £100k', '£100k+',
  ];

  const gradYears = ['2026', '2025', '2024', '2023', '2022', '2021'];

  function toggleLocation(loc) {
    if (locations.includes(loc)) {
      setLocations(locations.filter(l => l !== loc));
    } else if (locations.length < 3) {
      setLocations([...locations, loc]);
    }
  }

  async function handleFinish() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: name,
        job_title: jobTitle,
        experience,
        is_new_entrant: isNewEntrant === 'yes',
        grad_year: gradYear || null,
        university: university || null,
        course: course || null,
        preferred_locations: locations,
        target_salary_band: salaryBands[salaryBand],
        updated_at: new Date().toISOString(),
      });
    }
    window.location.href = '/dashboard';
  }

  const progress = (step / 4) * 100;

  return (
    <div style={{ width:'100%', maxWidth:520 }}>
      {/* Progress bar */}
      <div style={{ height:3, background:'rgba(240,237,232,0.08)', borderRadius:100, marginBottom:'2rem', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${progress}%`, background:'#c8ff00', borderRadius:100, transition:'width 0.4s ease' }} />
      </div>

      <div style={{ background:'#111', border:'1px solid rgba(240,237,232,0.07)', borderRadius:24, padding:'2.5rem' }}>

        {/* STEP 1 -- Job title and experience */}
        {step === 1 && (
          <>
            <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#c8ff00', marginBottom:'0.75rem' }}>Step 1 of 4</div>
            <h2 style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.6rem', letterSpacing:'-0.03em', color:'#f0ede8', marginBottom:'0.5rem' }}>
              Hi {firstName}! Tell us about your work.
            </h2>
            <p style={{ fontSize:'0.88rem', color:'rgba(240,237,232,0.4)', marginBottom:'2rem' }}>
              We use this to match your SOC code and visa eligibility automatically.
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:'1.2rem' }}>
              <div>
                <label style={labelStyle}>Your job title</label>
                <input
                  className="auth-input"
                  type="text"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  placeholder="e.g. Software Engineer, Marketing Manager"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Years of experience</label>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                  {experienceOptions.map(opt => (
                    <button key={opt} onClick={() => setExperience(opt)} style={{ background: experience === opt ? 'rgba(200,255,0,0.1)' : 'rgba(240,237,232,0.04)', border: experience === opt ? '1px solid rgba(200,255,0,0.4)' : '1px solid rgba(240,237,232,0.08)', borderRadius:12, padding:'0.75rem 1rem', color: experience === opt ? '#c8ff00' : 'rgba(240,237,232,0.6)', fontSize:'0.88rem', fontWeight: experience === opt ? 600 : 400, cursor:'pointer', textAlign:'left', transition:'all 0.2s' }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => setStep(2)} disabled={!jobTitle || !experience} style={nextBtn(!jobTitle || !experience)}>
              Next →
            </button>
          </>
        )}

        {/* STEP 2 -- New entrant */}
        {step === 2 && (
          <>
            <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#c8ff00', marginBottom:'0.75rem' }}>Step 2 of 4</div>
            <h2 style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.6rem', letterSpacing:'-0.03em', color:'#f0ede8', marginBottom:'0.5rem' }}>
              Are you a new entrant?
            </h2>
            <p style={{ fontSize:'0.88rem', color:'rgba(240,237,232,0.4)', marginBottom:'2rem' }}>
              New entrants qualify for a lower salary threshold — £33,400 instead of £41,700. You qualify if you're under 26 or a recent UK graduate.
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom:'1.5rem' }}>
              {[
                { val:'under26', label:'Yes — I am under 26', desc:'You automatically qualify for new entrant rates' },
                { val:'yes', label:'Yes — I am a recent UK graduate', desc:'Graduated from a UK university within the last 2 years' },
                { val:'no', label:'No — I am an experienced worker', desc:'Standard Skilled Worker threshold of £41,700 applies' },
              ].map(opt => (
                <button key={opt.val} onClick={() => setIsNewEntrant(opt.val)} style={{ background: isNewEntrant === opt.val ? 'rgba(200,255,0,0.1)' : 'rgba(240,237,232,0.04)', border: isNewEntrant === opt.val ? '1px solid rgba(200,255,0,0.4)' : '1px solid rgba(240,237,232,0.08)', borderRadius:12, padding:'1rem', color:'#f0ede8', cursor:'pointer', textAlign:'left', transition:'all 0.2s' }}>
                  <div style={{ fontWeight:600, fontSize:'0.9rem', color: isNewEntrant === opt.val ? '#c8ff00' : '#f0ede8' }}>{opt.label}</div>
                  <div style={{ fontSize:'0.78rem', color:'rgba(240,237,232,0.4)', marginTop:'0.25rem' }}>{opt.desc}</div>
                </button>
              ))}
            </div>

            {/* Sub questions for recent graduate */}
            {isNewEntrant === 'yes' && (
              <div style={{ background:'rgba(200,255,0,0.04)', border:'1px solid rgba(200,255,0,0.1)', borderRadius:16, padding:'1.2rem', marginBottom:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
                <div style={{ fontSize:'0.75rem', fontWeight:700, color:'#c8ff00', letterSpacing:'0.08em', textTransform:'uppercase' }}>Tell us about your degree</div>

                <div>
                  <label style={labelStyle}>Graduation year</label>
                  <select value={gradYear} onChange={e => setGradYear(e.target.value)} style={{ ...inputStyle, cursor:'pointer', appearance:'none', backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23c8ff00' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 1rem center', paddingRight:'2.5rem' }}>
                    <option value="">Select year</option>
                    {gradYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>University</label>
                  <input className="auth-input" type="text" value={university} onChange={e => setUniversity(e.target.value)} placeholder="e.g. University of Birmingham" style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Course / Degree subject</label>
                  <input className="auth-input" type="text" value={course} onChange={e => setCourse(e.target.value)} placeholder="e.g. Computer Science, Business Management" style={inputStyle} />
                </div>
              </div>
            )}

            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button onClick={() => setStep(1)} style={{ flex:1, background:'rgba(240,237,232,0.06)', border:'1px solid rgba(240,237,232,0.1)', borderRadius:100, padding:'0.85rem', color:'rgba(240,237,232,0.6)', fontSize:'0.88rem', fontWeight:600, cursor:'pointer' }}>← Back</button>
              <button onClick={() => setStep(3)} disabled={!isNewEntrant} style={{ ...nextBtn(!isNewEntrant), flex:2, marginTop:0 }}>Next →</button>
            </div>
          </>
        )}

        {/* STEP 3 -- Locations */}
        {step === 3 && (
          <>
            <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#c8ff00', marginBottom:'0.75rem' }}>Step 3 of 4</div>
            <h2 style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.6rem', letterSpacing:'-0.03em', color:'#f0ede8', marginBottom:'0.5rem' }}>
              Where do you want to work?
            </h2>
            <p style={{ fontSize:'0.88rem', color:'rgba(240,237,232,0.4)', marginBottom:'2rem' }}>
              Pick up to 3 locations. We'll prioritise jobs and sponsors in these areas.
            </p>

            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', marginBottom:'1.5rem' }}>
              {locationOptions.map(loc => {
                const selected = locations.includes(loc);
                const disabled = !selected && locations.length >= 3;
                return (
                  <button key={loc} onClick={() => toggleLocation(loc)} disabled={disabled} style={{ background: selected ? '#c8ff00' : 'rgba(240,237,232,0.06)', border: selected ? '1px solid #c8ff00' : '1px solid rgba(240,237,232,0.1)', borderRadius:100, padding:'0.5rem 1rem', color: selected ? '#080808' : disabled ? 'rgba(240,237,232,0.2)' : 'rgba(240,237,232,0.7)', fontSize:'0.85rem', fontWeight: selected ? 700 : 400, cursor: disabled ? 'default' : 'pointer', transition:'all 0.2s' }}>
                    {loc}
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize:'0.78rem', color:'rgba(240,237,232,0.3)', marginBottom:'1.5rem' }}>
              {locations.length}/3 selected
            </div>

            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button onClick={() => setStep(2)} style={{ flex:1, background:'rgba(240,237,232,0.06)', border:'1px solid rgba(240,237,232,0.1)', borderRadius:100, padding:'0.85rem', color:'rgba(240,237,232,0.6)', fontSize:'0.88rem', fontWeight:600, cursor:'pointer' }}>← Back</button>
              <button onClick={() => setStep(4)} disabled={locations.length === 0} style={{ ...nextBtn(locations.length === 0), flex:2, marginTop:0 }}>Next →</button>
            </div>
          </>
        )}

        {/* STEP 4 -- Salary */}
        {step === 4 && (
          <>
            <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#c8ff00', marginBottom:'0.75rem' }}>Step 4 of 4</div>
            <h2 style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.6rem', letterSpacing:'-0.03em', color:'#f0ede8', marginBottom:'0.5rem' }}>
              What's your target salary?
            </h2>
            <p style={{ fontSize:'0.88rem', color:'rgba(240,237,232,0.4)', marginBottom:'2rem' }}>
              We use this to flag which jobs meet the visa salary threshold for your role.
            </p>

            <div style={{ marginBottom:'2rem' }}>
              <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
                <div style={{ fontFamily:'Syne, sans-serif', fontSize:'2rem', fontWeight:800, color:'#c8ff00', letterSpacing:'-0.04em' }}>
                  {salaryBands[salaryBand]}
                </div>
                <div style={{ fontSize:'0.78rem', color:'rgba(240,237,232,0.35)', marginTop:'0.3rem' }}>per year</div>
              </div>

              <input
                type="range"
                min={0}
                max={salaryBands.length - 1}
                value={salaryBand}
                onChange={e => setSalaryBand(Number(e.target.value))}
                style={{ width:'100%', accentColor:'#c8ff00', cursor:'pointer' }}
              />

              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.72rem', color:'rgba(240,237,232,0.3)', marginTop:'0.5rem' }}>
                <span>Under £25k</span>
                <span>£100k+</span>
              </div>
            </div>

            {/* Eligibility hint */}
            <div style={{ background: salaryBand >= 4 ? 'rgba(200,255,0,0.06)' : 'rgba(255,77,0,0.06)', border: `1px solid ${salaryBand >= 4 ? 'rgba(200,255,0,0.15)' : 'rgba(255,77,0,0.15)'}`, borderRadius:12, padding:'0.85rem 1rem', marginBottom:'1.5rem', fontSize:'0.82rem', color: salaryBand >= 4 ? '#c8ff00' : '#ff4d00' }}>
              {salaryBand >= 4
                ? '✓ This salary meets the standard Skilled Worker threshold of £41,700'
                : salaryBand >= 2
                ? '⚡ This may qualify under new entrant rates (£33,400) if eligible'
                : '⚠ This salary is below the minimum Skilled Worker threshold'}
            </div>

            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button onClick={() => setStep(3)} style={{ flex:1, background:'rgba(240,237,232,0.06)', border:'1px solid rgba(240,237,232,0.1)', borderRadius:100, padding:'0.85rem', color:'rgba(240,237,232,0.6)', fontSize:'0.88rem', fontWeight:600, cursor:'pointer' }}>← Back</button>
              <button onClick={handleFinish} disabled={saving} style={{ flex:2, background:'#c8ff00', color:'#080808', border:'none', borderRadius:100, padding:'0.85rem', fontWeight:700, fontSize:'0.95rem', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1, marginTop:0 }}>
                {saving ? 'Saving...' : 'Find my Sponsrr →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize:'0.78rem',
  fontWeight:600,
  color:'rgba(240,237,232,0.5)',
  letterSpacing:'0.05em',
  textTransform:'uppercase',
  display:'block',
  marginBottom:'0.5rem',
};

const inputStyle = {
  width:'100%',
  background:'rgba(240,237,232,0.05)',
  border:'1px solid rgba(240,237,232,0.1)',
  borderRadius:12,
  padding:'0.85rem 1rem',
  color:'#f0ede8',
  fontSize:'0.95rem',
  boxSizing:'border-box',
  transition:'border-color 0.2s',
};

function nextBtn(disabled) {
  return {
    background: disabled ? 'rgba(200,255,0,0.3)' : '#c8ff00',
    color:'#080808',
    border:'none',
    borderRadius:100,
    padding:'0.85rem',
    fontWeight:700,
    fontSize:'0.95rem',
    cursor: disabled ? 'default' : 'pointer',
    marginTop:'1.5rem',
    width:'100%',
    transition:'all 0.2s',
  };
}

export default Signup;