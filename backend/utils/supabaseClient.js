import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "SUPABASE_URL or SUPABASE_KEY is missing from the environment variables"
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log(
  "SUPABASE_URL in supabaseClient:",
  process.env.SUPABASE_URL || "Not loaded"
);
console.log(
  "SUPABASE_KEY in supabaseClient:",
  process.env.SUPABASE_KEY || "Not loaded"
);
export default supabase;
