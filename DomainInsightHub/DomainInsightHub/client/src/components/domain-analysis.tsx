import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Info, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DomainWithKeywords } from "@shared/schema";

interface DomainAnalysisProps {
  domain: DomainWithKeywords;
  onDomainUpdated: (domain: DomainWithKeywords) => void;
}

export default function DomainAnalysis({ domain, onDomainUpdated }: DomainAnalysisProps) {
  const [description, setDescription] = useState(domain.description);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (newDescription: string) => {
      const response = await apiRequest("PUT", `/api/domains/${domain.id}`, {
        description: newDescription,
      });
      return response.json();
    },
    onSuccess: (updatedDomain) => {
      const domainWithKeywords = { ...updatedDomain, keywords: domain.keywords };
      onDomainUpdated(domainWithKeywords);
      toast({
        title: "Description updated",
        description: "Domain description has been saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/domains/analyze", {
        domainName: domain.name,
      });
      return response.json();
    },
    onSuccess: (data: DomainWithKeywords) => {
      setDescription(data.description);
      onDomainUpdated(data);
      toast({
        title: "Description regenerated",
        description: "AI has generated a new description for this domain",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Regeneration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (description.trim() !== domain.description) {
      updateMutation.mutate(description);
    }
  };

  const handleRegenerate = () => {
    regenerateMutation.mutate();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
          <Info className="w-5 h-5 text-primary" />
          <span>Domain Analysis</span>
        </h3>
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          Analyzed
        </Badge>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Domain
          </label>
          <div className="p-3 bg-slate-50 rounded-lg font-mono text-sm">
            {domain.name}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            AI-Generated Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none"
            rows={4}
            placeholder="Enter domain description..."
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={handleRegenerate}
            disabled={regenerateMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || description.trim() === domain.description}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
