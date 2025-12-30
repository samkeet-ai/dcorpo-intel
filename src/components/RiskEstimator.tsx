import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { AlertTriangle } from "lucide-react";

export function RiskEstimator() {
  const [userCount, setUserCount] = useState([1000]);
  
  // DPDPA fine calculation: Up to ₹250 Crore for significant breach
  // Simplified: Base fine + per-user component
  const calculateFine = (users: number) => {
    const baseFine = 5; // ₹5 Crore base
    const perUserFine = users * 0.0001; // ₹1000 per 10,000 users
    return Math.min(baseFine + perUserFine, 250).toFixed(1);
  };

  const fine = calculateFine(userCount[0]);
  const riskLevel = userCount[0] > 100000 ? "HIGH" : userCount[0] > 10000 ? "MEDIUM" : "LOW";
  const riskColor = riskLevel === "HIGH" ? "text-destructive" : riskLevel === "MEDIUM" ? "text-gold" : "text-accent";

  return (
    <div className="glass-card hover-lift p-6 animate-slide-up" style={{ animationDelay: "0.5s" }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-destructive/20">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <h2 className="text-lg font-bold">DPDPA Risk Estimator</h2>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm text-muted-foreground">User Data Count</label>
            <span className="font-mono font-semibold text-primary">
              {userCount[0].toLocaleString()} users
            </span>
          </div>
          <Slider
            value={userCount}
            onValueChange={setUserCount}
            min={100}
            max={1000000}
            step={100}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>100</span>
            <span>1M</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-secondary/50 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Risk Level</span>
            <span className={`font-bold ${riskColor}`}>{riskLevel}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-muted-foreground">Potential Fine:</span>
            <span className="text-2xl font-bold text-gradient-gold">₹{fine} Cr</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          *Estimates based on DPDPA 2023 penalty framework. Actual fines vary by breach severity.
        </p>
      </div>
    </div>
  );
}
