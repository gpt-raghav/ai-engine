import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Bot, Sparkles, Copy, Play, ArrowLeft, TrendingUp, Download, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import KeywordRankings from "@/components/keyword-rankings";
import EnginePerformance from "@/components/engine-performance";
import type { DomainWithKeywords, Prompt, Analysis } from "@shared/schema";

const promptCategories = [
  "Marketing Prompts",
  "Content Creation",
  "SEO Analysis", 
  "Brand Strategy",
  "Social Media",
  "Product Development",
];

export default function InsightsPage() {
  const [, params] = useRoute("/insights/:id");
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("Marketing Prompts");
  const [selectedEngines, setSelectedEngines] = useState<string[]>(["openai", "gemini"]);
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);
  const { toast } = useToast();

  const domainId = params?.id ? parseInt(params.id) : null;

  const { data: domain, isLoading: loadingDomain } = useQuery<DomainWithKeywords>({
    queryKey: [`/api/domains/${domainId}`],
    enabled: !!domainId,
  });

  const { data: prompts, refetch: refetchPrompts } = useQuery<Prompt[]>({
    queryKey: [`/api/domains/${domainId}/prompts`],
    enabled: !!domainId,
  });

  const { data: analyses, refetch: refetchAnalyses } = useQuery<Analysis[]>({
    queryKey: [`/api/prompts/${selectedPromptId}/analyses`],
    enabled: !!selectedPromptId,
  });

  const generateMutation = useMutation({
    mutationFn: async (category: string) => {
      const response = await apiRequest("POST", "/api/prompts/generate", {
        domainId: domainId,
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

  const handleRunAnalysis = (promptId: number) => {
    setSelectedPromptId(promptId);
    analyzeMutation.mutate({ promptId, engines: selectedEngines });
  };

  const handleExportResults = () => {
    if (!analyses) return;
    
    const exportData = {
      domain: domain?.name,
      analyses: analyses,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${domain?.name}-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Results exported",
      description: "Analysis results have been downloaded",
    });
  };

  if (loadingDomain) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading domain insights...</p>
        </div>
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Domain not found</p>
          <Button onClick={() => setLocation("/")}>Go Back</Button>
        </div>
      </div>
    );
  }

  const displayPrompts = prompts || [];
  const displayAnalyses = analyses || [];
  const openaiAnalysis = displayAnalyses.find(a => a.engine === "openai");
  const geminiAnalysis = displayAnalyses.find(a => a.engine === "gemini");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button
              variant="ghost"
              onClick={() => setLocation(`/analysis/${domainId}`)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Analysis</span>
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <TrendingUp className="text-white w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">AI Insights</h1>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-600">Step 3 of 3</span>
              <Button onClick={() => setLocation("/")} variant="outline">
                New Analysis
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Domain Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Domain Summary</h2>
            <Badge className="bg-blue-100 text-blue-700">{domain.keywords.length} Keywords</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-slate-700 mb-2">Domain</h3>
              <p className="font-mono text-lg">{domain.name}</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-700 mb-2">Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {domain.keywords.slice(0, 5).map((keyword) => (
                  <Badge key={keyword.id} variant="outline">{keyword.value}</Badge>
                ))}
                {domain.keywords.length > 5 && (
                  <Badge variant="outline">+{domain.keywords.length - 5} more</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Prompt Generation */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center space-x-2">
              <Bot className="w-6 h-6 text-primary" />
              <span>AI Prompt Generation</span>
            </h2>
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

          {displayPrompts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayPrompts.map((prompt, index) => (
                <div key={prompt.id} className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">
                      Prompt #{index + 1}
                    </span>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyPrompt(prompt.content)}
                        className="text-slate-400 hover:text-primary"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRunAnalysis(prompt.id)}
                        disabled={analyzeMutation.isPending || selectedEngines.length === 0}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Analyze
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed">
                    {prompt.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {displayPrompts.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Bot className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No prompts generated yet. Click "Generate Prompts" to start.</p>
            </div>
          )}
        </div>

        {/* AI Engine Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h3 className="text-lg font-medium text-slate-900 mb-4">AI Engine Selection</h3>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center space-x-3 cursor-pointer">
              <Checkbox
                checked={selectedEngines.includes("openai")}
                onCheckedChange={(checked) => handleEngineToggle("openai", checked as boolean)}
              />
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-slate-700">OpenAI GPT-4</span>
              </div>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <Checkbox
                checked={selectedEngines.includes("gemini")}
                onCheckedChange={(checked) => handleEngineToggle("gemini", checked as boolean)}
              />
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-slate-700">Google Gemini</span>
              </div>
            </label>
          </div>
        </div>

        {/* Analysis Results */}
        {displayAnalyses.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Analysis Results</h2>
              <Button
                variant="outline"
                onClick={handleExportResults}
                disabled={displayAnalyses.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Results
              </Button>
            </div>

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
                      Response time: {((openaiAnalysis.responseTime || 0) / 1000).toFixed(1)}s
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
                      Response time: {((geminiAnalysis.responseTime || 0) / 1000).toFixed(1)}s
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
          </div>
        )}

        {/* Analytics Section */}
        {domain && (
          <div className="space-y-6 mb-8">
            <KeywordRankings domain={domain} />
            <EnginePerformance domain={domain} />
          </div>
        )}
      </main>
    </div>
  );
}