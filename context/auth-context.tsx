"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import type { Tables } from "@/lib/database.types"

type UserProfile = Tables<'user_profiles'>;

type AuthContextType = {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<void>
  signInWithLinkedIn: () => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (profile: Partial<UserProfile>) => Promise<{ error: any }>
  refreshSession: () => Promise<void>
}

// Utility functions for session/user/profile storage
const SESSION_STORAGE_KEYS = {
  USER_ID: 'userId',
  USER_PROFILE: 'userProfile'
};

const storageAvailable = typeof window !== 'undefined' && !!window.sessionStorage;

const getFromStorage = (key: string) => {
  if (!storageAvailable) return null;
  try {
    return sessionStorage.getItem(key);
  } catch (e) {
    console.error(`[AuthStorage] Error getting ${key} from storage:`, e);
    return null;
  }
};

const saveToStorage = (key: string, value: any) => {
  if (!storageAvailable) return;
  try {
    if (value === null) {
      sessionStorage.removeItem(key);
    } else {
      const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
      sessionStorage.setItem(key, valueToStore);
    }
  } catch (e) {
    console.error(`[AuthStorage] Error saving ${key} to storage:`, e);
  }
};

const clearAuthStorage = () => {
  if (!storageAvailable) return;
  Object.values(SESSION_STORAGE_KEYS).forEach(key => {
    sessionStorage.removeItem(key);
  });
};

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Init state from storage - synchronously to avoid flashing
  const cachedUserId = getFromStorage(SESSION_STORAGE_KEYS.USER_ID);
  const cachedProfileStr = getFromStorage(SESSION_STORAGE_KEYS.USER_PROFILE);
  const cachedProfile = cachedProfileStr ? JSON.parse(cachedProfileStr) : null;
  
  // State 
  const [user, setUser] = useState<User | null>(cachedUserId ? { id: cachedUserId } as User : null);
  const [profile, setProfile] = useState<UserProfile | null>(cachedProfile);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(!cachedUserId); // Only loading if no cached user
  
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const initialized = useRef(false);

  // Only fetch profile if needed (no spinner)
  const syncProfileIfNeeded = useCallback(async (userId: string, showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      
      if (data) {
        setProfile(data);
        saveToStorage(SESSION_STORAGE_KEYS.USER_PROFILE, data);
      } else {
        setProfile(null);
        saveToStorage(SESSION_STORAGE_KEYS.USER_PROFILE, null);
        console.error("[AuthSync] Error fetching profile:", error);
      }
    } catch (err) {
      console.error("[AuthSync] Exception in syncProfileIfNeeded:", err);
      setProfile(null);
      saveToStorage(SESSION_STORAGE_KEYS.USER_PROFILE, null);
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  }, [supabase]);

  // Check session explicitly (only on mount)
  const checkSession = useCallback(async () => {
    if (initialized.current) return;
    initialized.current = true;
    
    if (!user) setIsLoading(true);
    
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("[AuthSync] Error getting session:", error);
        clearAuthData();
        return;
      }
      
      if (currentSession?.user) {
        // We have a session
        setSession(currentSession);
        setUser(currentSession.user);
        saveToStorage(SESSION_STORAGE_KEYS.USER_ID, currentSession.user.id);
        
        // Only fetch profile if we don't have it cached
        if (!profile || profile.id !== currentSession.user.id) {
          await syncProfileIfNeeded(currentSession.user.id);
        }
      } else {
        // No session
        clearAuthData();
      }
    } catch (err) {
      console.error("[AuthSync] Exception in checkSession:", err);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user, profile, syncProfileIfNeeded]);

  // Clear auth data helper
  const clearAuthData = useCallback(() => {
    setSession(null);
    setUser(null);
    setProfile(null);
    clearAuthStorage();
  }, []);

  // Manual session refresh exposed to UI if needed
  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error || !currentSession) {
        clearAuthData();
      } else {
        setSession(currentSession);
        setUser(currentSession.user);
        saveToStorage(SESSION_STORAGE_KEYS.USER_ID, currentSession.user.id);
        await syncProfileIfNeeded(currentSession.user.id);
      }
    } catch (e) {
      console.error("[AuthSync] Error in refreshSession:", e);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  }, [supabase, syncProfileIfNeeded, clearAuthData]);

  // First mount effect - check session once
  useEffect(() => {
    checkSession();
    
    // Silent refresh on visibility change (tab focus) - no spinner
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        if (user?.id) {
          console.log("[AuthSync] Tab visible - silently checking session");
          try {
            const { data: { session: currentSession }, error } = await supabase.auth.getSession();
            
            if (error || !currentSession?.user) {
              console.warn("[AuthSync] Session lost on tab refocus");
              clearAuthData();
              return;
            }
            
            if (currentSession.user.id !== user.id) {
              console.log("[AuthSync] User changed on tab refocus");
              setSession(currentSession);
              setUser(currentSession.user);
              saveToStorage(SESSION_STORAGE_KEYS.USER_ID, currentSession.user.id);
              await syncProfileIfNeeded(currentSession.user.id);
            }
          } catch (e) {
            console.error("[AuthSync] Error in visibility change handler:", e);
          }
        }
      }
    };
    
    // Use visibility change instead of onAuthStateChange
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkSession, user, supabase, syncProfileIfNeeded, clearAuthData]);

  // Auth actions
  const signUp = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (data.user) {
        // Create profile
        const profileData = {
          id: data.user.id,
          full_name: fullName,
          streak_count: 0,
          weekly_goal_hours: 5,
          avatar_url: null,
          updated_at: null,
        };
        
        const { error: insertError } = await supabase
          .from("user_profiles")
          .insert(profileData);
          
        if (insertError) {
          console.error("[AuthSync] Error creating profile after signup:", insertError);
          return { error: insertError };
        }
        
        setUser(data.user);
        setProfile(profileData);
        saveToStorage(SESSION_STORAGE_KEYS.USER_ID, data.user.id);
        saveToStorage(SESSION_STORAGE_KEYS.USER_PROFILE, profileData);
      }
      
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (!error && data.user) {
        setSession(data.session);
        setUser(data.user);
        saveToStorage(SESSION_STORAGE_KEYS.USER_ID, data.user.id);
        await syncProfileIfNeeded(data.user.id);
      }
      
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (result.error) {
        console.error("[AuthSync] Error signing in with Google:", result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithLinkedIn = async () => {
    setIsLoading(true);
    try {
      const result = await supabase.auth.signInWithOAuth({
        provider: "linkedin",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (result.error) {
        console.error("[AuthSync] Error signing in with LinkedIn:", result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      clearAuthData();
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) return { error: new Error("No user logged in") };
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update(profileData)
        .eq("id", user.id);
        
      if (!error) {
        await syncProfileIfNeeded(user.id);
      }
      
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  // Only log states for debugging
  console.log(`[AuthSync] State: isLoading=${isLoading}, user=${!!user}, profile=${!!profile}`);

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
        signInWithLinkedIn,
        signOut,
        updateProfile,
        refreshSession
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
