import { useState, useEffect } from "react";
import { ArrowLeft, Save, Send, Linkedin, Copy } from "lucide-react";
import { AdminBrief, useUpdateBrief, usePublishBrief } from "@/hooks/useAdminBriefs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface BriefEditorProps {
  brief: AdminBrief;
  onBack: () => void;
}

export function BriefEditor({ brief, onBack }: BriefEditorProps) {
  const [formData, setFormData] = useState({
    title: brief.title,
    cover_image: brief.cover_image || "",
    deep_dive_text: brief.deep_dive_text || "",
    fun_fact: brief.fun_fact || "",
    radar_points: brief.radar_points.join("\n"),
    jargon_term: brief.jargon_term || "",
    jargon_def: brief.jargon_def || "",
    linkedin_caption: brief.linkedin_caption || "",
  });

  const updateBrief = useUpdateBrief();
  const publishBrief = usePublishBrief();

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateBrief.mutate({
      id: brief.id,
      title: formData.title,
      cover_image: formData.cover_image || null,
      deep_dive_text: formData.deep_dive_text || null,
      fun_fact: formData.fun_fact || null,
      radar_points: formData.radar_points.split("\n").filter(Boolean),
      jargon_term: formData.jargon_term || null,
      jargon_def: formData.jargon_def || null,
      linkedin_caption: formData.linkedin_caption || null,
    });
  };

  const handlePublish = () => {
    handleSave();
    publishBrief.mutate(brief.id);
  };

  const copyLinkedIn = () => {
    navigator.clipboard.writeText(formData.linkedin_caption);
    toast.success("LinkedIn caption copied!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Drafts
        </button>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={updateBrief.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button
            className="btn-gold"
            onClick={handlePublish}
            disabled={publishBrief.isPending}
          >
            <Send className="w-4 h-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            brief.status === "active"
              ? "bg-accent/20 text-accent"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          {brief.status === "active" ? "Published" : "Draft"}
        </span>
      </div>

      {/* Form */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-semibold text-lg">Basic Info</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Brief title..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover_image">Cover Image URL</Label>
              <Input
                id="cover_image"
                value={formData.cover_image}
                onChange={(e) => handleChange("cover_image", e.target.value)}
                placeholder="https://..."
              />
              {formData.cover_image && (
                <img
                  src={formData.cover_image}
                  alt="Cover preview"
                  className="w-full h-40 object-cover rounded-lg mt-2"
                />
              )}
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <h3 className="font-semibold text-lg">Jargon Buster</h3>
            
            <div className="space-y-2">
              <Label htmlFor="jargon_term">Term</Label>
              <Input
                id="jargon_term"
                value={formData.jargon_term}
                onChange={(e) => handleChange("jargon_term", e.target.value)}
                placeholder="Legal term..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jargon_def">Definition</Label>
              <Textarea
                id="jargon_def"
                value={formData.jargon_def}
                onChange={(e) => handleChange("jargon_def", e.target.value)}
                placeholder="Simple explanation..."
                rows={3}
              />
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                LinkedIn Caption
              </h3>
              <Button variant="ghost" size="sm" onClick={copyLinkedIn}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
            <Textarea
              value={formData.linkedin_caption}
              onChange={(e) => handleChange("linkedin_caption", e.target.value)}
              placeholder="Auto-generated LinkedIn post..."
              rows={6}
              className="font-mono text-sm"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-semibold text-lg">Deep Dive Analysis</h3>
            <Textarea
              value={formData.deep_dive_text}
              onChange={(e) => handleChange("deep_dive_text", e.target.value)}
              placeholder="Full analysis text..."
              rows={12}
            />
          </div>

          <div className="glass-card p-6 space-y-4">
            <h3 className="font-semibold text-lg">Fun Fact</h3>
            <Textarea
              value={formData.fun_fact}
              onChange={(e) => handleChange("fun_fact", e.target.value)}
              placeholder="Did you know..."
              rows={3}
            />
          </div>

          <div className="glass-card p-6 space-y-4">
            <h3 className="font-semibold text-lg">Global Radar</h3>
            <p className="text-sm text-muted-foreground">One point per line (start with flag emoji)</p>
            <Textarea
              value={formData.radar_points}
              onChange={(e) => handleChange("radar_points", e.target.value)}
              placeholder="🇪🇺 EU AI Act update...&#10;🇮🇳 India DPDPA...&#10;🇺🇸 US privacy law..."
              rows={5}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
