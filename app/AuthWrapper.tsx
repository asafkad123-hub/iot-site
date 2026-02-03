"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // דפים שמותר לראות בלי להתחבר
      const publicPages = ["/", "/login"];
      const isPublicPage = publicPages.includes(pathname);

      if (!session && !isPublicPage) {
        // אם לא מחובר ומנסה להיכנס לדף מוגן (דשבורד/סטאפ) -> לוגין
        router.replace("/login");
      } else {
        setReady(true);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setReady(false);
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#05060a] flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}