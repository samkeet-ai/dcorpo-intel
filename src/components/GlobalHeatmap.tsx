import { Globe } from "lucide-react";

export function GlobalHeatmap() {
  const regions = [
    { 
      id: "india", 
      name: "India", 
      flag: "🇮🇳", 
      status: "DPDPA Active",
      color: "bg-accent" 
    },
    { 
      id: "eu", 
      name: "European Union", 
      flag: "🇪🇺", 
      status: "GDPR + AI Act",
      color: "bg-primary" 
    },
    { 
      id: "usa", 
      name: "United States", 
      flag: "🇺🇸", 
      status: "State Laws Evolving",
      color: "bg-gold" 
    },
  ];

  return (
    <div className="glass-card hover-lift p-6 animate-slide-up" style={{ animationDelay: "0.6s" }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/20">
          <Globe className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-lg font-bold">Global Compliance Map</h2>
      </div>

      {/* Simplified World Map Visual */}
      <div className="relative aspect-[2/1] bg-secondary/30 rounded-lg mb-4 overflow-hidden">
        {/* Map Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 800 400" className="w-full h-full">
            <path
              d="M100,200 Q200,150 300,180 T500,160 T700,200"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              className="text-border"
            />
            <path
              d="M100,250 Q200,220 300,240 T500,220 T700,250"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              className="text-border"
            />
          </svg>
        </div>

        {/* Region Markers */}
        <div 
          className="absolute w-4 h-4 rounded-full bg-accent animate-pulse"
          style={{ top: "45%", left: "68%" }}
          title="India"
        />
        <div 
          className="absolute w-4 h-4 rounded-full bg-primary animate-pulse"
          style={{ top: "30%", left: "52%" }}
          title="EU"
        />
        <div 
          className="absolute w-4 h-4 rounded-full bg-gold animate-pulse"
          style={{ top: "35%", left: "22%" }}
          title="USA"
        />

        {/* Legend Overlay */}
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
          Live Regulatory Zones
        </div>
      </div>

      {/* Region Cards */}
      <div className="space-y-2">
        {regions.map((region) => (
          <div
            key={region.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <span className="text-2xl">{region.flag}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm">{region.name}</h3>
              <p className="text-xs text-muted-foreground">{region.status}</p>
            </div>
            <div className={`w-2 h-2 rounded-full ${region.color} animate-pulse`} />
          </div>
        ))}
      </div>
    </div>
  );
}
