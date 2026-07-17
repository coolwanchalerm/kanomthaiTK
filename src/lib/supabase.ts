import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://btbqalrzvnsuyrbwacob.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0YnFhbHJ6dm5zdXlyYndhY29iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0Njg0NzIsImV4cCI6MjA5OTA0NDQ3Mn0.DS7HNPjlwyg0rA7Fg_u4CzuvD6vUhboVCmzMFa011Mc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
