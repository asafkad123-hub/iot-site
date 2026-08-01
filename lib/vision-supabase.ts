import "server-only";
import { createClient } from "@supabase/supabase-js";

const visionUrl = process.env.VISION_SUPABASE_URL;
const visionServiceRoleKey =
  process.env.VISION_SUPABASE_SERVICE_ROLE_KEY;

if (!visionUrl) {
  throw new Error("Missing VISION_SUPABASE_URL");
}

if (!visionServiceRoleKey) {
  throw new Error(
    "Missing VISION_SUPABASE_SERVICE_ROLE_KEY"
  );
}

export const visionSupabase = createClient(
  visionUrl,
  visionServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

export const VISION_STORAGE_BUCKET =
  process.env.VISION_STORAGE_BUCKET ?? "vision-videos";