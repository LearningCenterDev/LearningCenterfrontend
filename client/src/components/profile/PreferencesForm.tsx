import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";
import { getBrowserTimezone, COMMON_TIMEZONES, type TimezoneOption } from "@/lib/timezone";
import { toast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

export default function PreferencesForm({ user, onSuccess }: { user: UserType; onSuccess: () => void }) {
    const { toast } = useToast();
    const [selectedTimezone, setSelectedTimezone] = useState<string>(user.timezone || getBrowserTimezone());
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveTimezone = async () => {
        setIsSaving(true);
        try {
            await apiRequest("PATCH", "/api/auth/user", { timezone: selectedTimezone });
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            toast({ title: "Preferences Updated", description: "Your timezone preference has been saved." });
            onSuccess();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally { setIsSaving(false); }
    };

    const browserTz = getBrowserTimezone();

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold mb-2">Timezone Settings</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Schedule times will be displayed in your selected timezone. Your browser's
                        detected timezone is: <Badge variant="outline">{browserTz.replace(/_/g, ' ')}</Badge>
                    </p>
                </div>
                <div className="grid gap-4 max-w-md">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Your Timezone</label>
                        <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                            <SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger>
                            <SelectContent>
                                {COMMON_TIMEZONES.map((tz: TimezoneOption) => (
                                    <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSaveTimezone} disabled={isSaving || selectedTimezone === user.timezone}>
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? "Saving..." : "Save Preferences"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
