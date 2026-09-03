// supabase/functions/sync-to-sheets/index.ts
// Edge Function: Web (Supabase) → Google Sheets FULL API (service account JWT)
// 1 arah: create/update/archive → sheets.spreadsheets.values.append / update
// Env: GOOGLE_SERVICE_ACCOUNT_JSON (raw JSON string), SPREADSHEET_ID, SHEET_NAME (default TEAM ARI)

const SPREADSHEET_ID = Deno.env.get("SPREADSHEET_ID") ?? "";
const SHEET_NAME = Deno.env.get("SHEET_NAME") ?? "TEAM ARI";
const SA_JSON_RAW = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON") ?? "";

const TEAM_ARI_HEADERS = [
  "No",
  "Consultant",
  "Bugs / Improvements",
  "Client",
  "Nama Screen / report",
  "Request",
  "Status",
  "Assign Programmer",
  "Sql Server",
  "Database",
  "Target",
  "Sisa Hari",
  "Keterangan",
] as const;

type SyncAction = "create" | "update" | "archive";
interface SyncPayload {
  action: SyncAction;
  taskId: string;
  row?: {
    consultant: string;
    type: string;
    client: string;
    screenReport: string;
    request: string;
    status: string;
    programmer: string;
    sqlServer: string;
    database: string;
    targetDate: string | null; // YYYY-MM-DD
    notes: string;
  };
  status?: string; // for archive/update fallback
}

function b64url(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let b64 = "";
  // Deno: use btoa on binary string
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

async function getAccessToken(): Promise<string> {
  if (!SA_JSON_RAW) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");
  const sa = JSON.parse(SA_JSON_RAW) as { client_email: string; private_key: string };
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(payload));
  const signingInput = `${h}.${p}`;
  const key = await importPrivateKey(sa.private_key);
  const sigBuf = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(signingInput));
  const sig = b64url(new Uint8Array(sigBuf));
  const assertion = `${signingInput}.${sig}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${encodeURIComponent(assertion)}`,
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`token error ${res.status}: ${JSON.stringify(j)}`);
  return j.access_token as string;
}

function corsHeaders(): Record<string, string> {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "authorization, content-type, x-sheets-sync-token",
    "access-control-allow-methods": "POST, OPTIONS",
  };
}

function taskToRowValues(taskId: string, row: NonNullable<SyncPayload["row"]>, rowNumber: number): (string | number)[] {
  // A-M, L is formula =IF(K...), so we set values A-K + M; L is formula string
  // A No = rowNumber (sheet row index, not task number)
  // K Target = targetDate as string YYYY-MM-DD (Sheets will parse as date if formatted)
  const target = row.targetDate ?? "";
  // L formula — will be set as USER_ENTERED; rowNumber is actual sheet row
  const formulaL = `=IF(K${rowNumber}="","No Target",IF(G${rowNumber}="Done","",(K${rowNumber}-TODAY())))`;
  return [
    rowNumber - 1, // No (relative; Sheets can keep manual No)
    row.consultant,
    row.type,
    row.client,
    row.screenReport,
    row.request,
    row.status,
    row.programmer,
    row.sqlServer,
    row.database,
    target,
    formulaL,
    row.notes ?? "",
  ];
}

async function sheetsGetValues(token: string, range: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const j = await r.json();
  if (!r.ok) throw new Error(`sheets get ${r.status}: ${JSON.stringify(j)}`);
  return j as { values?: string[][] };
}

async function sheetsAppend(token: string, range: string, values: (string | number)[][], valueInputOption = "USER_ENTERED") {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=${valueInputOption}&insertDataOption=INSERT_ROWS`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ values, majorDimension: "ROWS" }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`sheets append ${r.status}: ${JSON.stringify(j)}`);
  return j;
}

async function sheetsUpdate(token: string, range: string, values: (string | number)[][], valueInputOption = "USER_ENTERED") {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=${valueInputOption}`;
  const r = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ values, majorDimension: "ROWS" }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`sheets update ${r.status}: ${JSON.stringify(j)}`);
  return j;
}

async function findRowByTaskId(token: string, taskId: string): Promise<number | null> {
  // Heuristic: taskId may be in column M (Keterangan) as `[TASK-...]` or hidden; also try full sheet scan on column M and G lookup
  // Fast path: scan A:M
  const j = await sheetsGetValues(token, `${SHEET_NAME}!A2:M`);
  const rows = j.values ?? [];
  // Strategy 1: Keterangan contains taskId
  for (let i = 0; i < rows.length; i++) {
    const m = rows[i]?.[12] ?? "";
    if (m.includes(taskId)) return i + 2;
  }
  // Strategy 2: exact match across all cols (fallback)
  for (let i = 0; i < rows.length; i++) {
    if (rows[i]?.some((c) => c === taskId)) return i + 2;
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders(), "content-type": "application/json" } });
  }

  const syncToken = Deno.env.get("SHEETS_SYNC_TOKEN");
  if (syncToken) {
    const got = req.headers.get("x-sheets-sync-token") ?? new URL(req.url).searchParams.get("token") ?? "";
    if (got !== syncToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders(), "content-type": "application/json" } });
    }
  }

  if (!SPREADSHEET_ID) {
    return new Response(JSON.stringify({ error: "Missing SPREADSHEET_ID" }), { status: 500, headers: { ...corsHeaders(), "content-type": "application/json" } });
  }

  let body: SyncPayload;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { ...corsHeaders(), "content-type": "application/json" } });
  }

  if (!body?.taskId || !body?.action) {
    return new Response(JSON.stringify({ error: "Missing taskId/action" }), { status: 400, headers: { ...corsHeaders(), "content-type": "application/json" } });
  }

  try {
    const token = await getAccessToken();

    if (body.action === "create") {
      if (!body.row) return new Response(JSON.stringify({ error: "Missing row" }), { status: 400, headers: { ...corsHeaders(), "content-type": "application/json" } });
      // Determine next row number
      const existing = await sheetsGetValues(token, `${SHEET_NAME}!A2:A`);
      const nextRow = (existing.values?.length ?? 0) + 2;
      // Embed taskId in Keterangan for future find/update: append ` [TASK-xxx]`
      const notesWithId = body.row.notes ? `${body.row.notes} [${body.taskId}]` : `[${body.taskId}]`;
      const rowWithId = { ...body.row, notes: notesWithId };
      const values = taskToRowValues(body.taskId, rowWithId, nextRow);
      await sheetsAppend(token, `${SHEET_NAME}!A${nextRow}:M${nextRow}`, [values]);
      return new Response(JSON.stringify({ ok: true, sheetRow: nextRow }), { headers: { ...corsHeaders(), "content-type": "application/json" } });
    }

    if (body.action === "update") {
      const rowNum = await findRowByTaskId(token, body.taskId);
      if (!rowNum) {
        // fallback to create if not found
        if (!body.row) return new Response(JSON.stringify({ error: "Not found and no row to create" }), { status: 404, headers: { ...corsHeaders(), "content-type": "application/json" } });
        const existing = await sheetsGetValues(token, `${SHEET_NAME}!A2:A`);
        const nextRow = (existing.values?.length ?? 0) + 2;
        const notesWithId = body.row.notes ? `${body.row.notes} [${body.taskId}]` : `[${body.taskId}]`;
        const rowWithId = { ...body.row, notes: notesWithId };
        const values = taskToRowValues(body.taskId, rowWithId, nextRow);
        await sheetsAppend(token, `${SHEET_NAME}!A${nextRow}:M${nextRow}`, [values]);
        return new Response(JSON.stringify({ ok: true, created: true, sheetRow: nextRow }), { headers: { ...corsHeaders(), "content-type": "application/json" } });
      }
      if (body.row) {
        // Preserve existing Keterangan's taskId tag if present
        const cur = await sheetsGetValues(token, `${SHEET_NAME}!M${rowNum}:M${rowNum}`);
        const curNotes = cur.values?.[0]?.[0] ?? "";
        const hasTag = curNotes.includes(body.taskId);
        const notesWithId = hasTag ? (body.row.notes ? (curNotes.includes(body.row.notes) ? curNotes : `${body.row.notes} ${curNotes.match(/\[TASK-[^\]]+\]/)?.[0] ?? `[${body.taskId}]`}`) : curNotes) : (body.row.notes ? `${body.row.notes} [${body.taskId}]` : `[${body.taskId}]`);
        const rowWithId = { ...body.row, notes: notesWithId };
        const values = taskToRowValues(body.taskId, rowWithId, rowNum);
        await sheetsUpdate(token, `${SHEET_NAME}!A${rowNum}:M${rowNum}`, [values]);
      } else if (body.status) {
        // status-only update: patch G col
        await sheetsUpdate(token, `${SHEET_NAME}!G${rowNum}:G${rowNum}`, [[body.status]]);
      }
      return new Response(JSON.stringify({ ok: true, sheetRow: rowNum }), { headers: { ...corsHeaders(), "content-type": "application/json" } });
    }

    if (body.action === "archive") {
      const rowNum = await findRowByTaskId(token, body.taskId);
      if (!rowNum) return new Response(JSON.stringify({ ok: true, note: "No sheet row for task" }), { headers: { ...corsHeaders(), "content-type": "application/json" } });
      // Option: set status to Done or tag Keterangan with [ARCHIVED]
      // Here we append to Keterangan and optionally set G=Done if not already
      const cur = await sheetsGetValues(token, `${SHEET_NAME}!M${rowNum}:M${rowNum}`);
      const curNotes = cur.values?.[0]?.[0] ?? "";
      const nextNotes = curNotes.includes("[ARCHIVED]") ? curNotes : `${curNotes} [ARCHIVED]`.trim();
      await sheetsUpdate(token, `${SHEET_NAME}!M${rowNum}:M${rowNum}`, [[nextNotes]]);
      return new Response(JSON.stringify({ ok: true, sheetRow: rowNum }), { headers: { ...corsHeaders(), "content-type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders(), "content-type": "application/json" } });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), { status: 500, headers: { ...corsHeaders(), "content-type": "application/json" } });
  }
});
