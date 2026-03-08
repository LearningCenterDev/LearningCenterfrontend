import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, getQueryFn } from "@/lib/queryClient";
import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";

export function useAuth() {
  const [, navigate] = useLocation();
  
  const { data: user, isLoading: queryLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 30 * 1000, // 30 seconds - prevents redundant refetches during navigation
    gcTime: 5 * 60 * 1000, // 5 minutes cache retention
    refetchOnMount: true, // Default: only refetch if stale
    refetchOnWindowFocus: false, // Don't refetch on focus to improve UX
    refetchOnReconnect: true,
  });

  const [isLoggingOutInternal, setIsLoggingOutInternal] = useState(false);
  
  // Only skip loading if we're actively logging out
  const isLoading = isLoggingOutInternal ? false : queryLoading;

  const logout = useCallback(async () => {
    try {
      // Show logging out state in UI
      setIsLoggingOutInternal(true);
      
      // 1. CALL LOGOUT API AND WAIT FOR IT TO COMPLETE
      await fetch("/api/auth/logout", { 
        method: "POST", 
        credentials: "include" 
      }).catch(() => {});
      
      // 2. CLEAR AUTH CACHE AND NAVIGATE ATOMICALLY
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
      
      // 3. NAVIGATE TO HOME - use client-side navigation
      navigate("/");
        
    } catch (error) {
      console.error("Logout error:", error);
      window.location.replace("/");
    } finally {
      // Ensure state is reset if navigation is slow or fails
      setIsLoggingOutInternal(false);
    }
  }, []);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await logout();
      return { success: true };
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    isLoggingOut: logoutMutation.isPending || isLoggingOutInternal,
  };
}