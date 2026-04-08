import { useState } from 'react';
import { PageHeader } from './Common';
import { Search, ExternalLink, Globe, Instagram, Building2 } from 'lucide-react';

export default function Research() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ---- Brand lookup using Clearbit Logo + autocomplete ---- */
  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);

    /* Build potential domain from brand name */
    const domain = query.toLowerCase().replace(/\s+/g, '') + '.com';
    const altDomain = query.toLowerCase().replace(/\s+/g, '-') + '.com';

    /* Use Clearbit's free logo API for brand logos */
    const result = {
      name: query.trim(),
      domain,
      logo: `https://logo.clearbit.com/${domain}`,
      altLogo: `https://logo.clearbit.com/${altDomain}`,
      searchUrl: `https://www.google.com/search?q=${encodeURIComponent(query + ' brand partnerships creator collaborations')}`,
      socialUrl: `https://www.instagram.com/${query.toLowerCase().replace(/\s+/g, '')}`,
      linkedinUrl: `https://www.linkedin.com/company/${query.toLowerCase().replace(/\s+/g, '-')}`,
    };

    /* Check if logo loads */
    try {
      const img = new Image();
      img.src = result.logo;
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
      result.logoValid = true;
    } catch {
      result.logoValid = false;
    }

    setResults(prev => [result, ...prev.filter(r => r.name.toLowerCase() !== result.name.toLowerCase())]);
    setLoading(false);
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Brand Research" subtitle="Look up brands before you reply. Pull logos, links, and context." />

      {/* ---- Search Bar ---- */}
      <div className="card p-5 mb-6">
        <div className="flex gap-3">
          <div className="flex items-center gap-2.5 flex-1 bg-brand-surface-alt border border-brand-border-l rounded-sm px-3.5 focus-within:border-brand-primary transition-colors">
            <Search size={16} className="text-brand-text-muted" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Enter brand name (e.g. Glossier, Nike, Fenty Beauty)"
              className="input border-none px-0 py-2.5 bg-transparent"
            />
          </div>
          <button onClick={handleSearch} disabled={loading || !query.trim()} className="btn btn-primary">
            {loading ? 'Searching...' : 'Look Up'}
          </button>
        </div>
      </div>

      {/* ---- Results ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((r, i) => (
          <div key={i} className="card p-6 hover:shadow-md transition-all">
            <div className="flex items-start gap-4 mb-4">
              {r.logoValid ? (
                <img src={r.logo} alt={r.name} className="w-14 h-14 rounded-md object-contain bg-white border border-brand-border-l p-1" onError={e => { e.target.style.display = 'none'; }} />
              ) : (
                <div className="w-14 h-14 rounded-md bg-brand-surface-alt flex items-center justify-center text-brand-text-muted">
                  <Building2 size={24} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold">{r.name}</h3>
                <p className="text-xs text-brand-text-muted mt-0.5">{r.domain}</p>
              </div>
            </div>

            {/* Quick links */}
            <div className="flex flex-wrap gap-2">
              <a href={`https://${r.domain}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                <Globe size={14} /> Website
              </a>
              <a href={r.socialUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                <Instagram size={14} /> Instagram
              </a>
              <a href={r.linkedinUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                <Building2 size={14} /> LinkedIn
              </a>
              <a href={r.searchUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                <ExternalLink size={14} /> Search Partnerships
              </a>
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && (
        <div className="text-center py-16 text-brand-text-muted">
          <Search size={48} className="mx-auto opacity-40 mb-4" />
          <p className="text-[15px] mb-2">Search for a brand to get started</p>
          <p className="text-sm max-w-md mx-auto">Enter a brand name to look up their logo, social profiles, and partnership history.</p>
        </div>
      )}
    </div>
  );
}
