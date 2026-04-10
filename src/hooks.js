import { useState, useCallback } from 'react';
import { useAuth } from './contexts';

/* ============================================================
   useGmail â Fetch messages from Gmail API
   ============================================================ */
export function useGmail() {
  const { accessToken, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMessages = useCallback(async (query = '', maxResults = 50) => {
    if (!accessToken) { setError('Not authenticated'); return []; }
    setLoading(true);
    setError(null);
    try {
      /* Step 1: list message IDs */
      const params = new URLSearchParams({ maxResults: String(maxResults) });
      if (query) params.set('q', query);

      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      /* Handle expired / invalid token */
      if (listRes.status === 401) {
        setError('Session expired â please disconnect and sign in again.');
        signOut();
        return [];
      }
      if (!listRes.ok) throw new Error(`Gmail list failed: ${listRes.status}`);
      const listData = await listRes.json();
      if (!listData.messages) { return []; }

      /* Step 2: fetch each message metadata */
      const msgs = await Promise.all(
        listData.messages.map(async (m) => {
          const res = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (!res.ok) return null;
          const data = await res.json();
          const headers = data.payload?.headers || [];
          const getH = (n) => headers.find(h => h.name === n)?.value || '';
          return {
            id: data.id,
            threadId: data.threadId,
            subject: getH('Subject'),
            from: getH('From'),
            date: getH('Date'),
            snippet: data.snippet,
            labels: data.labelIds || [],
          };
        })
      );
      return msgs.filter(Boolean);
    } catch (e) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [accessToken, signOut]);

  /* Shared base64url â UTF-8 decoder */
  const decodeBase64Utf8 = (b64) => {
    try {
      const raw = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      return new TextDecoder('utf-8').decode(bytes);
    } catch { return atob(b64.replace(/-/g, '+').replace(/_/g, '/')); }
  };

  /* Strip HTML tags to produce readable plain text */
  const stripHtml = (html) => {
    if (!html) return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/tr>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  /* Extract body from a Gmail message payload â try plain text first, fall back to HTML */
  const extractBody = (payload) => {
    let plainText = '';
    let htmlText = '';

    const walk = (part) => {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        plainText += decodeBase64Utf8(part.body.data);
      }
      if (part.mimeType === 'text/html' && part.body?.data) {
        htmlText += decodeBase64Utf8(part.body.data);
      }
      if (part.parts) part.parts.forEach(walk);
    };
    if (payload) walk(payload);

    // Prefer plain text; fall back to stripped HTML
    return plainText || stripHtml(htmlText);
  };

  const fetchFullMessage = useCallback(async (messageId) => {
    if (!accessToken) return null;
    try {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      const headers = data.payload?.headers || [];
      const getH = (n) => headers.find(h => h.name === n)?.value || '';

      return {
        id: data.id,
        threadId: data.threadId,
        subject: getH('Subject'),
        from: getH('From'),
        to: getH('To'),
        date: getH('Date'),
        body: extractBody(data.payload),
        snippet: data.snippet,
      };
    } catch { return null; }
  }, [accessToken]);

  /* Fetch an entire Gmail thread â returns array of parsed messages */
  const fetchThread = useCallback(async (threadId) => {
    if (!accessToken || !threadId) return [];
    try {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) return [];
      const data = await res.json();
      const messages = data.messages || [];

      return messages.map((msg) => {
        const headers = msg.payload?.headers || [];
        const getH = (n) => headers.find(h => h.name === n)?.value || '';
        return {
          id: msg.id,
          threadId: msg.threadId,
          subject: getH('Subject'),
          from: getH('From'),
          to: getH('To'),
          date: getH('Date'),
          body: extractBody(msg.payload),
          snippet: msg.snippet,
        };
      });
    } catch { return []; }
  }, [accessToken]);

  /* ── Encode a plain-text email into base64url RFC 2822 format ── */
  const encodeRfc2822 = (to, subject, body) => {
    const lines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      body,
    ].join('\r\n');
    const bytes = new TextEncoder().encode(lines);
    const binStr = Array.from(bytes, b => String.fromCharCode(b)).join('');
    return btoa(binStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  /* ── Archive a message (remove from INBOX) ── */
  const archiveMessage = useCallback(async (messageId) => {
    if (!accessToken) return false;
    try {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ removeLabelIds: ['INBOX'] }),
        }
      );
      return res.ok;
    } catch { return false; }
  }, [accessToken]);

  /* ── Create a Gmail draft ── */
  const createDraft = useCallback(async ({ to, subject, body, threadId }) => {
    if (!accessToken) return null;
    try {
      const raw = encodeRfc2822(to, subject, body);
      const payload = { message: { raw } };
      if (threadId) payload.message.threadId = threadId;
      const res = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/drafts',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }, [accessToken]);

  /* ── Get or create a Gmail label by name, return its ID ── */
  const getOrCreateLabel = useCallback(async (name) => {
    if (!accessToken) return null;
    try {
      const listRes = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/labels',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!listRes.ok) return null;
      const listData = await listRes.json();
      const existing = (listData.labels || []).find(l => l.name === name);
      if (existing) return existing.id;
      const createRes = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/labels',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, labelListVisibility: 'labelShow', messageListVisibility: 'show' }),
        }
      );
      if (!createRes.ok) return null;
      const created = await createRes.json();
      return created.id;
    } catch { return null; }
  }, [accessToken]);

  /* ── Apply a label to a message ── */
  const applyLabel = useCallback(async (messageId, labelId) => {
    if (!accessToken || !labelId) return false;
    try {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ addLabelIds: [labelId] }),
        }
      );
      return res.ok;
    } catch { return false; }
  }, [accessToken]);

  /* ── Smart categorize: scan messages for brand-deal keywords, apply Gmail label ── */
  const BRAND_KEYWORDS = [
    'collaboration', 'collab', 'partnership', 'sponsored', 'sponsorship',
    'gifted', 'gifting', 'paid partnership', 'affiliate', 'campaign',
    'brand deal', 'pr package', 'media kit', 'rate card', 'deliverables',
    'ambassador', 'influencer', 'ugc', 'content creator', 'creator',
  ];

  const categorizeBrandEmails = useCallback(async (messages) => {
    if (!accessToken || !messages?.length) return 0;
    const labelId = await getOrCreateLabel('CIO · Brand Deal');
    if (!labelId) return 0;
    const matches = messages.filter(m => {
      const text = `${m.subject || ''} ${m.snippet || ''}`.toLowerCase();
      return BRAND_KEYWORDS.some(kw => text.includes(kw));
    });
    await Promise.all(matches.map(m => applyLabel(m.id, labelId)));
    return matches.length;
  }, [accessToken, getOrCreateLabel, applyLabel]);

  /* ── Apply a deal-type label when an email is imported as an opportunity ── */
  const applyOppLabel = useCallback(async (messageId, type) => {
    if (!accessToken || !messageId || !type) return;
    const name = `CIO · ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const labelId = await getOrCreateLabel(name);
    if (labelId) await applyLabel(messageId, labelId);
  }, [accessToken, getOrCreateLabel, applyLabel]);

  return {
    fetchMessages, fetchFullMessage, fetchThread,
    archiveMessage, createDraft, categorizeBrandEmails, applyOppLabel,
    loading, error,
  };
}

/* ============================================================
   useCalendar â Fetch events from Google Calendar API
   ============================================================ */
export function useCalendar() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async (timeMin, timeMax) => {
    if (!accessToken) { setError('Not authenticated'); return []; }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax || new Date(Date.now() + 30 * 86400000).toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '50',
      });
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) throw new Error(`Calendar fetch failed: ${res.status}`);
      const data = await res.json();
      return (data.items || []).map(ev => ({
        id: ev.id,
        title: ev.summary || '(No title)',
        start: ev.start?.dateTime || ev.start?.date || '',
        end: ev.end?.dateTime || ev.end?.date || '',
        description: ev.description || '',
        location: ev.location || '',
        source: 'google',
      }));
    } catch (e) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const createEvent = useCallback(async (event) => {
    if (!accessToken) return null;
    try {
      const res = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: event.title,
            start: { dateTime: event.start },
            end: { dateTime: event.end || event.start },
            description: event.description || '',
          }),
        }
      );
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }, [accessToken]);

  return { fetchEvents, createEvent, loading, error };
}

/* ============================================================
   useExport â CSV and PDF export
   ============================================================ */
export function useExport() {
  const exportCSV = useCallback((data, filename = 'export.csv') => {
    import('papaparse').then(({ default: Papa }) => {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, filename);
    });
  }, []);

  const exportPDF = useCallback((data, columns, title = 'Export', filename = 'export.pdf') => {
    Promise.all([import('jspdf'), import('jspdf-autotable')]).then(([{ default: jsPDF }]) => {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(title, 14, 22);
      doc.setFontSize(10);
      doc.text(`Exported ${new Date().toLocaleDateString()}`, 14, 30);
      doc.autoTable({
        startY: 36,
        head: [columns.map(c => c.label)],
        body: data.map(row => columns.map(c => row[c.key] || '')),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [107, 19, 9] },
      });
      doc.save(filename);
    });
  }, []);

  return { exportCSV, exportPDF };
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
