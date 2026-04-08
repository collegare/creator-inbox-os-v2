import { useState, useCallback } from 'react';
import { useAuth } from './contexts';

/* ============================================================
   useGmail — Fetch messages from Gmail API
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
        setError('Session expired — please disconnect and sign in again.');
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

      /* Extract body text — properly decode base64url → UTF-8 */
      const decodeBase64Utf8 = (b64) => {
        try {
          const raw = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
          const bytes = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
          return new TextDecoder('utf-8').decode(bytes);
        } catch { return atob(b64.replace(/-/g, '+').replace(/_/g, '/')); }
      };

      let body = '';
      const extractText = (part) => {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body += decodeBase64Utf8(part.body.data);
        }
        if (part.parts) part.parts.forEach(extractText);
      };
      if (data.payload) extractText(data.payload);

      return {
        id: data.id,
        threadId: data.threadId,
        subject: getH('Subject'),
        from: getH('From'),
        to: getH('To'),
        date: getH('Date'),
        body,
        snippet: data.snippet,
      };
    } catch { return null; }
  }, [accessToken]);

  return { fetchMessages, fetchFullMessage, loading, error };
}

/* ============================================================
   useCalendar — Fetch events from Google Calendar API
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
   useExport — CSV and PDF export
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
