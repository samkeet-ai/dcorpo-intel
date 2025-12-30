import { useState, useEffect } from "react";
import { Settings, Lock, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function AdminSettings() {
  const { user } = useAuth();
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [existingSettings, setExistingSettings] = useState<{ id: string; pin_code: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("admin_settings")
      .select("id, pin_code")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setExistingSettings(data);
    }
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPin.length < 4) {
      toast.error("PIN must be at least 4 characters");
      return;
    }

    if (newPin !== confirmPin) {
      toast.error("PINs do not match");
      return;
    }

    if (existingSettings && currentPin !== existingSettings.pin_code) {
      toast.error("Current PIN is incorrect");
      return;
    }

    setIsLoading(true);

    try {
      if (existingSettings) {
        // Update existing settings
        const { error } = await supabase
          .from("admin_settings")
          .update({ pin_code: newPin })
          .eq("id", existingSettings.id);

        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from("admin_settings")
          .insert({ user_id: user!.id, pin_code: newPin });

        if (error) throw error;
      }

      toast.success("PIN updated successfully!");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      fetchSettings();
    } catch (error: any) {
      toast.error("Failed to update PIN: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/20">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Settings</h2>
      </div>

      <div className="max-w-md">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Change Access PIN
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Your PIN can be used as an additional security measure. It's stored securely in the database.
        </p>

        <form onSubmit={handleUpdatePin} className="space-y-4">
          {existingSettings && (
            <div className="space-y-2">
              <Label htmlFor="currentPin">Current PIN</Label>
              <Input
                id="currentPin"
                type="password"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="Enter current PIN"
                disabled={isLoading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="newPin">New PIN</Label>
            <Input
              id="newPin"
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="Enter new PIN (min 4 characters)"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPin">Confirm New PIN</Label>
            <Input
              id="confirmPin"
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="Confirm new PIN"
              disabled={isLoading}
              required
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save PIN
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <strong>Account Email:</strong> {user?.email}
        </div>
      </div>
    </div>
  );
}
