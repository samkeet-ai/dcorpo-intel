import { useState } from "react";
import { ArrowLeft, Save, Send, Eye, EyeOff } from "lucide-react";
import { AdminBrief, useUpdateBrief, usePublishBrief, useUnpublishBrief } from "@/hooks/useAdminBriefs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BriefEditorProps {
  brief: AdminBrief;
  onBack: () => void;
}

const CATEGORIES = [
  "General",
  "Cyber Law",
  "DPDPA",
  "AI Regulation",
  "Data Privacy",
  "Corporate Law",
  "Intellectual Property",
];

export function BriefEditor({ brief, onBack }: BriefEditorProps) {
  const [formData, setFormData] = useState({
    title: brief.title,
    content: brief.content || "",
    category: brief.category || "General",
  });

  const updateBrief = useUpdateBrief();
  const publishBrief = usePublishBrief();
  const unpublishBrief = useUnpublishBrief();

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateBrief.mutate({
      id: brief.id,
      title: formData.title,
      content: formData.content,
      category: formData.category,
    });
  };

  const handlePublish = () => {
    handleSave();
    publishBrief.mutate(brief.id);
  };

  const handleUnpublish = () => {
    unpublishBrief.mutate(brief.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Briefs
        </button>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={updateBrief.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          {brief.is_published ? (
            <Button
              variant="outline"
              onClick={handleUnpublish}
              disabled={unpublishBrief.isPending}
            >
              <EyeOff className="w-4 h-4 mr-2" />
              Unpublish
            </Button>
          ) : (
            <Button
              className="btn-gold"
              onClick={handlePublish}
              disabled={publishBrief.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            brief.is_published
              ? "bg-accent/20 text-accent"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          {brief.is_published ? "Published" : "Draft"}
        </span>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary/20 text-primary">
          {brief.category}
        </span>
      </div>

      {/* Form */}
      <div className="space-y-6">
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-lg">Brief Details</h3>

          <div className="grid gap-4 sm:grid-cols-2">
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
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-lg">Content (Markdown)</h3>
          <p className="text-sm text-muted-foreground">
            Write or edit the AI-generated content below. Supports Markdown formatting.
          </p>
          <Textarea
            value={formData.content}
            onChange={(e) => handleChange("content", e.target.value)}
            placeholder="# Brief Content&#10;&#10;Write your legal brief content here using Markdown..."
            rows={20}
            className="font-mono text-sm"
          />
        </div>
      </div>
    </div>
  );
}
