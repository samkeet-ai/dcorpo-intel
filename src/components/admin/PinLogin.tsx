import { useState } from "react";
import { Lock, ArrowRight } from "lucide-react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export function PinLogin() {
  const [pin, setPin] = useState("");
  const { login } = useAdminAuth();

  const handleSubmit = (value: string) => {
    if (value.length === 4) {
      const success = login(value);
      if (!success) {
        toast.error("Invalid PIN");
        setPin("");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass-card p-8 md:p-12 w-full max-w-md text-center animate-scale-in">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">The Newsroom</h1>
        <p className="text-muted-foreground mb-8">Enter your PIN to access the admin dashboard</p>
        
        <div className="flex justify-center mb-8">
          <InputOTP
            maxLength={4}
            value={pin}
            onChange={(value) => {
              setPin(value);
              handleSubmit(value);
            }}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} className="w-14 h-14 text-2xl" />
              <InputOTPSlot index={1} className="w-14 h-14 text-2xl" />
              <InputOTPSlot index={2} className="w-14 h-14 text-2xl" />
              <InputOTPSlot index={3} className="w-14 h-14 text-2xl" />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <p className="text-sm text-muted-foreground">
          Hint: Default PIN is 2025
        </p>
      </div>
    </div>
  );
}
