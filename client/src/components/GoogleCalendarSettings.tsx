import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CheckCircle, RefreshCw, AlertCircle, Loader2, Link2Off } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GoogleCalendarStatus {
  connected: boolean;
  enabled: boolean;
  googleEmail?: string | null;
  settings: {
    id: string;
    userId: string;
    calendarId: string | null;
    syncEnabled: boolean;
    syncClasses: boolean;
    syncReschedules: boolean;
    syncCancellations: boolean;
  } | null;
}

interface CalendarOption {
  id: string;
  summary: string;
  primary?: boolean;
}

export function GoogleCalendarSettings() {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
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

  const { data: calendars, isLoading: calendarsLoading } = useQuery<CalendarOption[]>({
    queryKey: ["/api/google-calendar/calendars"],
    enabled: status?.connected === true,
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
      queryClient.invalidateQueries({ queryKey: ["/api/google-calendar/calendars"] });
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

  const updateSettings = useMutation({
    mutationFn: async (settings: {
      calendarId?: string;
      syncEnabled?: boolean;
      syncClasses?: boolean;
      syncReschedules?: boolean;
      syncCancellations?: boolean;
    }) => {
      const response = await apiRequest("POST", "/api/google-calendar/settings", settings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/google-calendar/status"] });
      toast({
        title: "Settings updated",
        description: "Your Google Calendar settings have been saved.",
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

  const handleConnect = async () => {
    setIsConnecting(true);
    connectGoogle.mutate();
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      await syncAll.mutateAsync();
    } finally {
      setIsSyncing(false);
    }
  };

  if (statusLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isConnected = status?.connected;
  const settings = status?.settings;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar Integration
        </CardTitle>
        <CardDescription>
          Sync your class schedules, reschedules, and cancellations with Google Calendar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            <div>
              <p className="font-medium">
                {isConnected ? "Connected" : "Not Connected"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isConnected && status?.googleEmail
                  ? `Linked to ${status.googleEmail}`
                  : isConnected
                  ? "Your Google Calendar is linked"
                  : "Connect your Google account to sync events"}
              </p>
            </div>
          </div>
          {isConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => disconnectGoogle.mutate()}
              disabled={disconnectGoogle.isPending}
              data-testid="button-disconnect-google"
            >
              {disconnectGoogle.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link2Off className="mr-2 h-4 w-4" />
              )}
              Disconnect
            </Button>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={isConnecting || connectGoogle.isPending}
              data-testid="button-connect-google"
            >
              {isConnecting || connectGoogle.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <SiGoogle className="mr-2 h-4 w-4" />
              )}
              Connect with Google
            </Button>
          )}
        </div>

        {isConnected && (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sync-enabled">Enable Sync</Label>
                <p className="text-sm text-muted-foreground">
                  Turn on automatic calendar synchronization
                </p>
              </div>
              <Switch
                id="sync-enabled"
                data-testid="switch-sync-enabled"
                checked={settings?.syncEnabled ?? false}
                onCheckedChange={(checked) =>
                  updateSettings.mutate({ syncEnabled: checked })
                }
              />
            </div>

            {(settings?.syncEnabled ?? false) && (
              <>
                <div className="space-y-3">
                  <Label>Select Calendar</Label>
                  <Select
                    value={settings?.calendarId || "primary"}
                    onValueChange={(value) =>
                      updateSettings.mutate({ calendarId: value })
                    }
                  >
                    <SelectTrigger data-testid="select-calendar">
                      <SelectValue placeholder="Choose a calendar" />
                    </SelectTrigger>
                    <SelectContent>
                      {calendarsLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading calendars...
                        </SelectItem>
                      ) : (
                        calendars?.map((cal) => (
                          <SelectItem key={cal.id} value={cal.id}>
                            {cal.summary} {cal.primary && "(Primary)"}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Sync Options</Label>
                  <div className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sync-classes" className="font-normal">
                        Sync class schedules
                      </Label>
                      <Switch
                        id="sync-classes"
                        data-testid="switch-sync-classes"
                        checked={settings?.syncClasses ?? true}
                        onCheckedChange={(checked) =>
                          updateSettings.mutate({ syncClasses: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sync-reschedules" className="font-normal">
                        Sync reschedules and time changes
                      </Label>
                      <Switch
                        id="sync-reschedules"
                        data-testid="switch-sync-reschedules"
                        checked={settings?.syncReschedules ?? true}
                        onCheckedChange={(checked) =>
                          updateSettings.mutate({ syncReschedules: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sync-cancellations" className="font-normal">
                        Sync cancellations
                      </Label>
                      <Switch
                        id="sync-cancellations"
                        data-testid="switch-sync-cancellations"
                        checked={settings?.syncCancellations ?? true}
                        onCheckedChange={(checked) =>
                          updateSettings.mutate({ syncCancellations: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSyncAll}
                    disabled={isSyncing || syncAll.isPending}
                    data-testid="button-sync-all"
                  >
                    {isSyncing || syncAll.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync All Events
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
