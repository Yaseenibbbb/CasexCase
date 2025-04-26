"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import type { UserProfile } from "@/lib/database.types"

type AuthContextType = {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (profile: Partial<UserProfile>) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  // Log right after client creation to check if it's valid
  console.log("[AuthProvider] Supabase browser client object:", supabase);

  useEffect(() => {
    // Log immediately when the effect runs
    console.log("[AuthProvider] useEffect hook STARTING"); 
    
    console.log("[AuthProvider] useEffect running - Initial fetch");
    const fetchSessionAndProfile = async () => {
      setIsLoading(true); // Ensure loading is true at start
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("[AuthProvider] Error fetching initial session:", sessionError);
      }
      console.log(`[AuthProvider] Initial session fetched: ${!!session}`);
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        console.log(`[AuthProvider] User found (ID: ${currentUser.id}). Fetching profile...`);
        await fetchProfile(currentUser.id);
      } else {
        console.log("[AuthProvider] No user found in initial session.");
        setProfile(null);
      }
      setIsLoading(false);
      console.log("[AuthProvider] Initial fetch complete. isLoading set to false.");
    }

    fetchSessionAndProfile();

    // --- Re-enable onAuthStateChange --- 
    console.log("[AuthProvider] Setting up onAuthStateChange listener...");
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Log heavily inside the listener
      console.log(`[AuthProvider] === onAuthStateChange EVENT START ===`);
      console.log(`[AuthProvider] onAuthStateChange event type: ${event}`);
      console.log(`[AuthProvider] onAuthStateChange session present: ${!!session}`);
      console.log(`[AuthProvider] Current user state before update: ${!!user}`);
      
      setSession(session);
      const changedUser = session?.user ?? null;
      setUser(changedUser);
      console.log(`[AuthProvider] User state updated: ${!!changedUser}`);

      if (changedUser) {
        console.log(`[AuthProvider] onAuthStateChange: User found (ID: ${changedUser.id}). Checking/Fetching profile...`);
        // Re-add profile check/creation logic if needed, or just fetch
        await fetchProfile(changedUser.id); 
      } else {
        console.log("[AuthProvider] onAuthStateChange: No user. Clearing profile.");
        setProfile(null);
      }
       console.log(`[AuthProvider] === onAuthStateChange EVENT END ===`);
    });

    return () => {
      console.log("[AuthProvider] Unsubscribing from onAuthStateChange");
      subscription.unsubscribe();
    };
    // --- End Re-enable ---

  }, []) // Keep dependency array empty for initial fetch only

  const fetchProfile = async (userId: string) => {
     console.log(`[AuthProvider] fetchProfile called for userId: ${userId}`);
    // Use maybeSingle() instead of single() to handle 0 rows gracefully
    const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).maybeSingle();
    console.log(`[AuthProvider] fetchProfile result - data: ${!!data}, error:`, error);

    if (data) {
      setProfile(data);
    } else {
      // Set profile to null if no data (or specifically handle error if it's not PGRST116)
      setProfile(null);
      if (error && error.code !== 'PGRST116') { // Log errors other than '0 rows found'
         console.error("[AuthProvider] Error fetching profile:", error);
      }
    }
  };

  const createProfile = async (userId: string, fullName: string, avatarUrl?: string) => {
    console.log(`[AuthContext] createProfile called for userId: ${userId}, fullName: ${fullName}`); // Log entry
    const profileData: Partial<UserProfile> = {
      id: userId,
      full_name: fullName,
      streak_count: 0,
      weekly_goal_hours: 5, // Default goal
    };
    if (avatarUrl) {
      profileData.avatar_url = avatarUrl;
    }

    console.log("[AuthContext] Attempting to insert profile data:", profileData);
    const { error: insertError } = await supabase.from("user_profiles").insert(profileData);

    if (insertError) {
      console.error("[AuthContext] Error INSERTING profile:", insertError);
      setProfile(null); // Ensure profile state is null if creation fails
      return { error: insertError };
    }

    console.log("[AuthContext] Profile inserted successfully. Fetching created profile...");
    await fetchProfile(userId); // fetchProfile already sets the profile state
    console.log("[AuthContext] fetchProfile completed after creation.");

    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (data.user) {
      await createProfile(data.user.id, fullName, undefined);
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signInWithGoogle = async () => {
    console.log("[AuthContext] Attempting Google Sign-In..."); // Log start
    try {
      const result = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      console.log("[AuthContext] signInWithOAuth result:", result); // Log result
      if (result.error) {
        console.error("[AuthContext] signInWithOAuth error:", result.error);
      }
    } catch (error) {
      console.error("[AuthContext] Exception during signInWithOAuth:", error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) return { error: new Error("No user logged in") }

    const { error } = await supabase.from("user_profiles").update(profileData).eq("id", user.id)

    if (!error) {
      await fetchProfile(user.id)
    }

    return { error }
  };

  console.log(`[AuthProvider] Rendering - isLoading: ${isLoading}, user: ${!!user}`); // Log render state

  // Log right before returning JSX
  console.log("[AuthProvider] Returning Provider JSX...");
  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
