import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, Sparkles, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DomainWithKeywords } from "@shared/schema";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isValidDomain, setIsValidDomain] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const validateDomain = (domain: string) => {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  };

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    setIsValidDomain(validateDomain(value));
  };

  const analyzeMutation = useMutation({
    mutationFn: async (domainName: string) => {
      const response = await apiRequest("POST", "/api/domains/analyze", { domainName });
      return response.json();
    },
    onSuccess: (data: DomainWithKeywords) => {
      toast({
        title: "Domain analyzed successfully",
        description: `Found ${data.keywords.length} keywords for ${data.name}`,
      });
      setLocation(`/analysis/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    if (!isValidDomain) {
      toast({
        title: "Invalid domain",
        description: "Please enter a valid domain name",
        variant: "destructive",
      });
      return;
    }
    analyzeMutation.mutate(searchQuery);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Search className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Domain AI Analyzer
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed">
            Discover the power of AI-driven domain analysis. Enter any domain to extract 
            keywords, generate insights, and compare AI engine responses.
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Enter Domain Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-slate-400" />
                </div>
                <Input
                  type="text"
                  placeholder="example.com"
                  value={searchQuery}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="pl-12 h-14 text-lg border-2 focus:border-primary"
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                />
              </div>
            </div>

            {/* Domain validation feedback */}
            {searchQuery && (
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  isValidDomain ? "bg-green-500" : "bg-red-500"
                }`} />
                <span className={`text-sm font-medium ${
                  isValidDomain ? "text-green-700" : "text-red-700"
                }`}>
                  {isValidDomain ? "Valid domain format" : "Invalid domain format"}
                </span>
              </div>
            )}

            <Button 
              onClick={handleAnalyze}
              disabled={!isValidDomain || analyzeMutation.isPending}
              className="w-full h-14 text-lg font-semibold bg-primary hover:bg-blue-600"
            >
              <Sparkles className="w-5 h-5 mr-3" />
              {analyzeMutation.isPending ? "Analyzing..." : "Analyze Domain"}
              <ArrowRight className="w-5 h-5 ml-3" />
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white/50 rounded-xl border border-slate-100">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">AI Analysis</h3>
            <p className="text-sm text-slate-600">Extract keywords and descriptions using advanced AI</p>
          </div>
          
          <div className="text-center p-6 bg-white/50 rounded-xl border border-slate-100">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Prompt Generation</h3>
            <p className="text-sm text-slate-600">Generate targeted prompts for multiple categories</p>
          </div>
          
          <div className="text-center p-6 bg-white/50 rounded-xl border border-slate-100">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <ArrowRight className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">AI Comparison</h3>
            <p className="text-sm text-slate-600">Compare responses from multiple AI engines</p>
          </div>
        </div>
      </div>
    </div>
  );
}