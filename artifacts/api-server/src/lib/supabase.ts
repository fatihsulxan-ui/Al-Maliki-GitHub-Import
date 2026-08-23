import { createClient } from "@supabase/supabase-js";

const rawUrl = process.env["SUPABASE_URL"];
const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];

let supabaseClient: ReturnType<typeof createClient> | null = null;

if (rawUrl && key) {
  function normalizeSupabaseUrl(raw: string): string {
    if (raw.startsWith("https://") || raw.startsWith("http://")) return raw;
    const pgMatch = raw.match(/db\.([a-z0-9]+)\.supabase\.co/);
    if (pgMatch) return `https://${pgMatch[1]}.supabase.co`;
    return raw;
  }
  const url = normalizeSupabaseUrl(rawUrl);
  supabaseClient = createClient(url, key, { auth: { persistSession: false } });
}

export const supabase = supabaseClient;
export const hasSupabase = !!supabaseClient;
