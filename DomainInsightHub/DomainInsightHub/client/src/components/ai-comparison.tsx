import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TrendingUp, Download, Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DomainWithKeywords, Prompt, Analysis } from "@shared/schema";

interface AIComparisonProps {
  domain: DomainWithKeywords;
}

export default function AIComparison({ domain }: AIComparisonProps) {
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: prompts } = useQuery({
    queryKey: [`/api/domains/${domain.id}/prompts`],
    enabled: !!domain.id,
  });

  const { data: analyses, refetch: refetchAnalyses } = useQuery({
    queryKey: [`/api/prompts/${selectedPromptId}/analyses`],
    enabled: !!selectedPromptId,
  });

  const analyzeMutation = useMutation({
    mutationFn: async ({ promptId, engines }: { promptId: number; engines: string[] }) => {
      const response = await apiRequest("POST", `/api/prompts/${promptId}/analyze`, { engines });
      return response.json();
    },
    onSuccess: () => {
      refetchAnalyses();
      toast({
        title: "Analysis completed",
        description: "AI engines have analyzed the prompt",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRunAnalysis = (promptId: number) => {
    setSelectedPromptId(promptId);
    analyzeMutation.mutate({ promptId, engines: ["openai", "gemini"] });
  };

  const handleExportResults = () => {
    if (!analyses) return;
    
    const exportData = {
      domain: domain.name,
      analyses: analyses,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${domain.name}-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Results exported",
      description: "Analysis results have been downloaded",
    });
  };

  const displayPrompts = (prompts as Prompt[]) || [];
  const displayAnalyses = (analyses as Analysis[]) || [];
  const openaiAnalysis = displayAnalyses.find(a => a.engine === "openai");
  const geminiAnalysis = displayAnalyses.find(a => a.engine === "gemini");

  return (
    <section className="mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900 flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            <span>AI Analysis Comparison</span>
          </h3>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleExportResults}
              disabled={!analyses || displayAnalyses.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Results
            </Button>
            <Button disabled={!analyses || displayAnalyses.length === 0}>
              <Save className="w-4 h-4 mr-2" />
              Save Analysis
            </Button>
          </div>
        </div>

        {/* Prompt Selection */}
        {displayPrompts.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-medium text-slate-900 mb-4">Select Prompt to Analyze</h4>
            <div className="grid grid-cols-1 gap-3">
              {displayPrompts.map((prompt, index) => (
                <div
                  key={prompt.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPromptId === prompt.id
                      ? "border-primary bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  onClick={() => setSelectedPromptId(prompt.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-slate-600">
                          Prompt #{index + 1}
                        </span>
                        <Badge variant="outline">{prompt.category}</Badge>
                      </div>
                      <p className="text-sm text-slate-700 line-clamp-2">
                        {prompt.content}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunAnalysis(prompt.id);
                      }}
                      disabled={analyzeMutation.isPending}
                    >
                      Analyze
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {displayAnalyses.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* OpenAI Results */}
            {openaiAnalysis && (
              <div className="border border-slate-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-slate-900">OpenAI GPT-4</h4>
                  </div>
                  <span className="text-xs text-slate-500">
                    Response time: {(openaiAnalysis.responseTime / 1000).toFixed(1)}s
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-medium text-slate-700 mb-2">
                      Sentiment Score
                    </h5>
                    <div className="flex items-center space-x-2">
                      <Progress 
                        value={openaiAnalysis.sentimentScore || 0} 
                        className="flex-1 h-2"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {openaiAnalysis.sentimentScore || 0}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-slate-700 mb-2">
                      Full Response
                    </h5>
                    <ScrollArea className="h-32">
                      <div className="p-3 bg-slate-50 rounded text-xs text-slate-600">
                        {openaiAnalysis.response}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            )}

            {/* Gemini Results */}
            {geminiAnalysis && (
              <div className="border border-slate-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-slate-900">Google Gemini</h4>
                  </div>
                  <span className="text-xs text-slate-500">
                    Response time: {(geminiAnalysis.responseTime / 1000).toFixed(1)}s
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-medium text-slate-700 mb-2">
                      Sentiment Score
                    </h5>
                    <div className="flex items-center space-x-2">
                      <Progress 
                        value={geminiAnalysis.sentimentScore || 0} 
                        className="flex-1 h-2"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {geminiAnalysis.sentimentScore || 0}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-slate-700 mb-2">
                      Full Response
                    </h5>
                    <ScrollArea className="h-32">
                      <div className="p-3 bg-slate-50 rounded text-xs text-slate-600">
                        {geminiAnalysis.response}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Comparison Summary */}
        {openaiAnalysis && geminiAnalysis && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">Analysis Summary</h5>
            <p className="text-sm text-blue-800">
              Both AI engines have analyzed the prompt. OpenAI scored {openaiAnalysis.sentimentScore}% 
              sentiment while Gemini scored {geminiAnalysis.sentimentScore}%. 
              Compare the detailed responses above to understand different perspectives on your domain strategy.
            </p>
          </div>
        )}

        {displayPrompts.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>Generate prompts first to start AI analysis and comparison.</p>
          </div>
        )}
      </div>
    </section>
  );
}
