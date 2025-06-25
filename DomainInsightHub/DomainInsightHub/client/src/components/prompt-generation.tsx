import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bot, Sparkles, Copy, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DomainWithKeywords, Prompt } from "@shared/schema";

interface PromptGenerationProps {
  domain: DomainWithKeywords;
}

const promptCategories = [
  "Marketing Prompts",
  "Content Creation",
  "SEO Analysis", 
  "Brand Strategy",
  "Social Media",
  "Product Development",
];

export default function PromptGeneration({ domain }: PromptGenerationProps) {
  const [selectedCategory, setSelectedCategory] = useState("Marketing Prompts");
  const [selectedEngines, setSelectedEngines] = useState<string[]>(["openai", "gemini"]);
  const { toast } = useToast();

  const { data: prompts, refetch: refetchPrompts } = useQuery({
    queryKey: [`/api/domains/${domain.id}/prompts`],
    enabled: !!domain.id,
  });

  const generateMutation = useMutation({
    mutationFn: async (category: string) => {
      const response = await apiRequest("POST", "/api/prompts/generate", {
        domainId: domain.id,
        category,
      });
      return response.json();
    },
    onSuccess: () => {
      refetchPrompts();
      toast({
        title: "Prompts generated",
        description: "AI has generated new prompts for your domain",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGeneratePrompts = () => {
    generateMutation.mutate(selectedCategory);
  };

  const handleCopyPrompt = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied to clipboard",
        description: "Prompt has been copied to your clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleEngineToggle = (engine: string, checked: boolean) => {
    if (checked) {
      setSelectedEngines([...selectedEngines, engine]);
    } else {
      setSelectedEngines(selectedEngines.filter(e => e !== engine));
    }
  };

  const displayPrompts = (prompts as Prompt[]) || [];

  return (
    <section className="mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900 flex items-center space-x-2">
            <Bot className="w-6 h-6 text-primary" />
            <span>AI Prompt Generation & Analysis</span>
          </h3>
          <div className="flex items-center space-x-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {promptCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleGeneratePrompts}
              disabled={generateMutation.isPending}
              className="bg-accent hover:bg-emerald-600"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Prompts
            </Button>
          </div>
        </div>

        {/* Generated Prompts */}
        {displayPrompts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {displayPrompts.map((prompt, index) => (
              <div key={prompt.id} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">
                    Prompt #{index + 1}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyPrompt(prompt.content)}
                    className="text-slate-400 hover:text-primary"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed">
                  {prompt.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* AI Engine Selection */}
        <div className="mb-6">
          <h4 className="text-lg font-medium text-slate-900 mb-4">AI Engine Analysis</h4>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <Checkbox
                checked={selectedEngines.includes("openai")}
                onCheckedChange={(checked) => handleEngineToggle("openai", checked as boolean)}
              />
              <span className="text-sm font-medium text-slate-700">OpenAI GPT-4</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <Checkbox
                checked={selectedEngines.includes("gemini")}
                onCheckedChange={(checked) => handleEngineToggle("gemini", checked as boolean)}
              />
              <span className="text-sm font-medium text-slate-700">Google Gemini</span>
            </label>
            <div className="ml-auto">
              <Button
                disabled={selectedEngines.length === 0 || displayPrompts.length === 0}
                className="bg-primary hover:bg-blue-600"
              >
                <Play className="w-4 h-4 mr-2" />
                Run Analysis
              </Button>
            </div>
          </div>
        </div>

        {displayPrompts.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Bot className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No prompts generated yet. Click "Generate Prompts" to start.</p>
          </div>
        )}
      </div>
    </section>
  );
}
