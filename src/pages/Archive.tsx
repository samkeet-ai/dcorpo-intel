import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Search, Calendar, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BusinessConnect } from "@/components/BusinessConnect";
import { CookieConsent } from "@/components/CookieConsent";
import { useAllBriefs, useBriefsByMonth } from "@/hooks/useAllBriefs";
import { Input } from "@/components/ui/input";

const Archive = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  
  const { data: briefsByMonth, isLoading: monthsLoading } = useBriefsByMonth();
  const { data: filteredBriefs, isLoading: searchLoading } = useAllBriefs(searchQuery);

  const months = briefsByMonth ? Object.keys(briefsByMonth).sort().reverse() : [];
  const displayBriefs = selectedMonth && briefsByMonth 
    ? briefsByMonth[selectedMonth] || []
    : searchQuery 
      ? filteredBriefs || []
      : [];

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    return format(new Date(parseInt(year), parseInt(month) - 1), "MMMM yyyy");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Latest
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Memory Lane</h1>
            <p className="text-muted-foreground text-lg">
              Browse our archive of past intelligence briefings.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Timeline Sidebar */}
            <aside className="lg:w-64 shrink-0">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Timeline
              </h3>
              <div className="space-y-1">
                {monthsLoading ? (
                  <div className="space-y-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="skeleton h-10 rounded-lg" />
                    ))}
                  </div>
                ) : months.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No archives yet</p>
                ) : (
                  months.map((month) => (
                    <button
                      key={month}
                      onClick={() => {
                        setSelectedMonth(selectedMonth === month ? null : month);
                        setSearchQuery("");
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                        selectedMonth === month
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">{formatMonthLabel(month)}</span>
                      <span className="ml-auto text-sm opacity-60">
                        {briefsByMonth?.[month]?.length || 0}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Search */}
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search briefs... (e.g., DPDPA, AI Act)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedMonth(null);
                  }}
                  className="pl-12 h-14 text-lg bg-card border-border"
                />
              </div>

              {/* Results */}
              {!selectedMonth && !searchQuery ? (
                <div className="glass-card p-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Select a Month</h3>
                  <p className="text-muted-foreground">
                    Choose a month from the timeline or search for specific topics.
                  </p>
                </div>
              ) : searchLoading || monthsLoading ? (
                <div className="grid gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton h-32 rounded-xl" />
                  ))}
                </div>
              ) : displayBriefs.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
                  <p className="text-muted-foreground">
                    Try a different search term or select another month.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {displayBriefs.map((brief, index) => (
                    <article
                      key={brief.id}
                      className="glass-card hover-lift p-6 flex gap-6 animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {brief.cover_image && (
                        <img
                          src={brief.cover_image}
                          alt={brief.title}
                          className="w-32 h-24 object-cover rounded-lg shrink-0 hidden sm:block"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <time className="text-sm text-muted-foreground">
                          {format(parseISO(brief.publish_date), "MMMM d, yyyy")}
                        </time>
                        <h3 className="text-xl font-bold mt-1 mb-2 truncate">
                          {brief.title}
                        </h3>
                        <Link
                          to={`/?brief=${brief.id}`}
                          className="text-primary hover:underline text-sm font-medium"
                        >
                          Read Brief →
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BusinessConnect />
      <CookieConsent />
    </div>
  );
};

export default Archive;
