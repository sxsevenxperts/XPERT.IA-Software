/**
 * Edge Function: apple-cal-proxy
 * Integração com Apple Calendar via CalDAV (iCloud).
 *
 * ?action=test          POST { username, password } → testa credenciais
 * ?action=list-events   POST { timeMin, timeMax }   → lista eventos do período
 * ?action=create-event  POST { title, description, start, end } → cria evento
 *
 * Requer: Authorization: Bearer <JWT do usuário>
 * As credenciais Apple são buscadas em agente_config (apple_cal_username / apple_cal_password)
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CALDAV_BASE       = "https://caldav.icloud.com";

const adminDb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const url    = new URL(req.url);
  const action = url.searchParams.get("action") ?? "";

  // Autentica usuário via JWT
  const authHeader = req.headers.get("Authorization") ?? "";
  const userToken  = authHeader.replace("Bearer ", "");
  const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return json({ error: "Não autorizado" }, 401);

  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};

  try {
    if (action === "test") {
      const { username, password } = body;
      if (!username || !password) return json({ error: "username e password são obrigatórios" }, 400);
      const ok = await testCalDAV(username, password);
      return json({ ok });
    }

    if (action === "list-events") {
      const creds = await getCreds(user.id);
      if (!creds) return json({ error: "Apple Calendar não conectado" }, 400);
      const events = await listEvents(creds.username, creds.password, body.timeMin, body.timeMax);
      return json({ events });
    }

    if (action === "create-event") {
      const creds = await getCreds(user.id);
      if (!creds) return json({ error: "Apple Calendar não conectado" }, 400);
      await createEvent(creds.username, creds.password, body);
      return json({ ok: true });
    }

    return json({ error: "Ação desconhecida" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

async function getCreds(userId: string) {
  const { data } = await adminDb.from("agente_config")
    .select("chave,valor")
    .eq("user_id", userId)
    .in("chave", ["apple_cal_username", "apple_cal_password"]);
  if (!data || data.length < 2) return null;
  const map = Object.fromEntries(data.map(r => [r.chave, r.valor]));
  return { username: map.apple_cal_username, password: map.apple_cal_password };
}

function basicAuth(username: string, password: string) {
  return "Basic " + btoa(`${username}:${password}`);
}

async function testCalDAV(username: string, password: string): Promise<boolean> {
  // Descobre o principal CalDAV do iCloud
  const res = await fetch(`${CALDAV_BASE}/.well-known/caldav`, {
    method: "PROPFIND",
    headers: {
      Authorization: basicAuth(username, password),
      Depth: "0",
      "Content-Type": "application/xml",
    },
    body: `<?xml version="1.0"?><d:propfind xmlns:d="DAV:"><d:prop><d:current-user-principal/></d:prop></d:propfind>`,
    redirect: "follow",
  });
  return res.status === 207 || res.status === 200;
}

async function listEvents(username: string, password: string, timeMin: string, timeMax: string) {
  // Busca o home set do usuário
  const principalUrl = await getPrincipalUrl(username, password);
  if (!principalUrl) return [];

  const calHomeUrl = await getCalendarHome(username, password, principalUrl);
  if (!calHomeUrl) return [];

  // Lista calendários
  const cals = await listCalendars(username, password, calHomeUrl);
  if (!cals.length) return [];

  // Busca eventos de todos os calendários no período
  const allEvents: unknown[] = [];
  for (const calUrl of cals) {
    const evs = await fetchEvents(username, password, calUrl, timeMin, timeMax);
    allEvents.push(...evs);
  }
  return allEvents;
}

async function getPrincipalUrl(username: string, password: string): Promise<string | null> {
  const res = await fetch(`${CALDAV_BASE}/.well-known/caldav`, {
    method: "PROPFIND",
    headers: {
      Authorization: basicAuth(username, password),
      Depth: "0",
      "Content-Type": "application/xml",
    },
    body: `<?xml version="1.0"?><d:propfind xmlns:d="DAV:"><d:prop><d:current-user-principal/></d:prop></d:propfind>`,
    redirect: "follow",
  });
  const xml = await res.text();
  const match = xml.match(/<d:href>([^<]+)<\/d:href>/);
  if (!match) return null;
  const path = match[1];
  return path.startsWith("http") ? path : `${CALDAV_BASE}${path}`;
}

async function getCalendarHome(username: string, password: string, principalUrl: string): Promise<string | null> {
  const res = await fetch(principalUrl, {
    method: "PROPFIND",
    headers: {
      Authorization: basicAuth(username, password),
      Depth: "0",
      "Content-Type": "application/xml",
    },
    body: `<?xml version="1.0"?><d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><c:calendar-home-set/></d:prop></d:propfind>`,
  });
  const xml = await res.text();
  const match = xml.match(/<[^:]+:href>([^<]+)<\/[^:]+:href>/g);
  if (!match) return null;
  for (const m of match) {
    const path = m.replace(/<[^>]+>/g, "");
    if (path.includes("/calendars/")) {
      return path.startsWith("http") ? path : `${CALDAV_BASE}${path}`;
    }
  }
  return null;
}

async function listCalendars(username: string, password: string, homeUrl: string): Promise<string[]> {
  const res = await fetch(homeUrl, {
    method: "PROPFIND",
    headers: {
      Authorization: basicAuth(username, password),
      Depth: "1",
      "Content-Type": "application/xml",
    },
    body: `<?xml version="1.0"?><d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><d:resourcetype/></d:prop></d:propfind>`,
  });
  const xml = await res.text();
  const urls: string[] = [];
  const hrefMatches = [...xml.matchAll(/<d:href>([^<]+)<\/d:href>/g)];
  const calMatches  = [...xml.matchAll(/<[^>]*calendar[^>]*\/>/g)];
  if (calMatches.length) {
    // extrai hrefs de blocos que contêm calendar
    const blocks = xml.split("<d:response>");
    for (const block of blocks) {
      if (block.includes(":calendar") || block.includes("calendar/>")) {
        const hm = block.match(/<d:href>([^<]+)<\/d:href>/);
        if (hm) {
          const path = hm[1];
          urls.push(path.startsWith("http") ? path : `${CALDAV_BASE}${path}`);
        }
      }
    }
  }
  return urls;
}

async function fetchEvents(username: string, password: string, calUrl: string, timeMin: string, timeMax: string) {
  const body = `<?xml version="1.0"?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop><d:getetag/><c:calendar-data/></d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VEVENT">
        <c:time-range start="${toIcalDate(timeMin)}" end="${toIcalDate(timeMax)}"/>
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`;

  const res = await fetch(calUrl, {
    method: "REPORT",
    headers: {
      Authorization: basicAuth(username, password),
      Depth: "1",
      "Content-Type": "application/xml",
    },
    body,
  });
  const xml = await res.text();
  return parseICalEvents(xml);
}

function toIcalDate(iso: string): string {
  return iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "").replace("Z", "Z");
}

function parseICalEvents(xml: string) {
  const events: { title: string; start: string; end: string }[] = [];
  const dataBlocks = [...xml.matchAll(/<c:calendar-data[^>]*>([\s\S]*?)<\/c:calendar-data>/g)];
  for (const block of dataBlocks) {
    const ical = block[1];
    const summary = ical.match(/SUMMARY:([^\r\n]+)/)?.[1]?.trim() ?? "Sem título";
    const dtstart = ical.match(/DTSTART[^:]*:([^\r\n]+)/)?.[1]?.trim() ?? "";
    const dtend   = ical.match(/DTEND[^:]*:([^\r\n]+)/)?.[1]?.trim() ?? "";
    if (dtstart) {
      events.push({
        title: summary,
        start: icalDateToISO(dtstart),
        end:   icalDateToISO(dtend),
      });
    }
  }
  return events;
}

function icalDateToISO(ical: string): string {
  // Formato: 20260319T140000Z ou 20260319
  if (ical.length === 8) {
    return `${ical.slice(0,4)}-${ical.slice(4,6)}-${ical.slice(6,8)}`;
  }
  return `${ical.slice(0,4)}-${ical.slice(4,6)}-${ical.slice(6,8)}T${ical.slice(9,11)}:${ical.slice(11,13)}:${ical.slice(13,15)}Z`;
}

async function createEvent(username: string, password: string, data: { title: string; description?: string; start: string; end: string }) {
  const principalUrl = await getPrincipalUrl(username, password);
  if (!principalUrl) throw new Error("Não foi possível localizar o CalDAV do iCloud");
  const calHome = await getCalendarHome(username, password, principalUrl);
  if (!calHome) throw new Error("Calendário iCloud não encontrado");
  const cals = await listCalendars(username, password, calHome);
  if (!cals.length) throw new Error("Nenhum calendário disponível");

  const uid  = crypto.randomUUID();
  const toIcal = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "").replace("Z","Z");
  const ical = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//XPERT.IA//XPERT.IA//PT",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART:${toIcal(data.start)}`,
    `DTEND:${toIcal(data.end)}`,
    `SUMMARY:${data.title}`,
    data.description ? `DESCRIPTION:${data.description}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  const putUrl = `${cals[0]}${uid}.ics`;
  const res = await fetch(putUrl, {
    method: "PUT",
    headers: {
      Authorization: basicAuth(username, password),
      "Content-Type": "text/calendar; charset=utf-8",
    },
    body: ical,
  });
  if (!res.ok) throw new Error(`Falha ao criar evento: ${res.status}`);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
