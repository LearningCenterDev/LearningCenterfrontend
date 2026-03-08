import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckCircle, RefreshCw, Loader2, Link2Off } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GoogleCalendarStatus {
  connected: boolean;
  enabled: boolean;
  googleEmail?: string | null;
  settings: {
    syncEnabled: boolean;
  } | null;
}

export function GoogleCalendarButton() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('calendar_connected') === 'true') {
      toast({
        title: "Connected",
        description: "Your Google Calendar has been connected successfully.",
      });
      window.history.replaceState({}, '', window.location.pathname);
      queryClient.invalidateQueries({ queryKey: ["/api/google-calendar/status"] });
    }
    if (params.get('calendar_error')) {
      toast({
        title: "Connection failed",
        description: "Unable to connect Google Calendar. Please try again.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location, toast]);

  const { data: status, isLoading: statusLoading } = useQuery<GoogleCalendarStatus>({
    queryKey: ["/api/google-calendar/status"],
  });

  const connectGoogle = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/google-calendar/auth-url");
      const data = await response.json();
      return data.authUrl;
    },
    onSuccess: (authUrl: string) => {
      window.location.href = authUrl;
    },
    onError: (error: Error) => {
      setIsConnecting(false);
      toast({
        title: "Connection failed",
        description: error.message || "Unable to start Google authentication",
        variant: "destructive",
      });
    },
  });

  const disconnectGoogle = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/google-calendar/disconnect");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/google-calendar/status"] });
      toast({
        title: "Disconnected",
        description: "Your Google Calendar has been disconnected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncAll = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/google-calendar/sync/all");
      return response.json() as Promise<{ synced: number; failed: number; errors: string[] }>;
    },
    onSuccess: (data: { synced: number; failed: number; errors: string[] }) => {
      toast({
        title: "Sync complete",
        description: `Synced ${data.synced} events${data.failed > 0 ? `, ${data.failed} failed` : ""}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    setIsConnecting(true);
    connectGoogle.mutate();
  };

  const isConnected = status?.connected;
  const isSyncEnabled = status?.settings?.syncEnabled;

  if (statusLoading) {
    return (
      <Button variant="outline" size="sm" disabled data-testid="button-google-calendar-loading">
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (!isConnected) {
    return (
      <Button
        size="sm"
        onClick={handleConnect}
        disabled={isConnecting || connectGoogle.isPending}
        data-testid="button-google-calendar-connect"
        className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-sm"
      >
        {isConnecting || connectGoogle.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <SiGoogle className="h-4 w-4" />
            <span className="hidden sm:inline">Sync Calendar</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          data-testid="button-google-calendar"
          className="gap-2"
        >
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="hidden sm:inline">Synced</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <div className="space-y-1">
          {status?.googleEmail && (
            <p className="text-xs text-muted-foreground px-2 py-1 truncate">
              {status.googleEmail}
            </p>
          )}
          {isSyncEnabled && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => syncAll.mutate()}
              disabled={syncAll.isPending}
              data-testid="button-sync-now"
            >
              {syncAll.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync Now
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={() => disconnectGoogle.mutate()}
            disabled={disconnectGoogle.isPending}
            data-testid="button-disconnect"
          >
            {disconnectGoogle.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link2Off className="h-4 w-4" />
            )}
            Disconnect
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
