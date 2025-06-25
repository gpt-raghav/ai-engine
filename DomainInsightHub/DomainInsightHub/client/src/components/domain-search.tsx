import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DomainWithKeywords } from "@shared/schema";

interface DomainSearchProps {
  onDomainAnalyzed: (domain: DomainWithKeywords) => void;
}

export default function DomainSearch({ onDomainAnalyzed }: DomainSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isValidDomain, setIsValidDomain] = useState(false);
  const { toast } = useToast();

  const validateDomain = (domain: string) => {
    // Basic domain validation
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
      onDomainAnalyzed(data);
      toast({
        title: "Domain analyzed successfully",
        description: `Found ${data.keywords.length} keywords for ${data.name}`,
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
    <section className="mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Analyze Any Domain with AI
          </h2>
          <p className="text-slate-600">
            Enter a domain name to extract keywords, descriptions, and generate AI-powered insights
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-slate-400" />
              </div>
              <Input
                type="text"
                placeholder="Enter domain name (e.g., example.com)"
                value={searchQuery}
                onChange={(e) => handleInputChange(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              />
            </div>
            <Button 
              onClick={handleAnalyze}
              disabled={!isValidDomain || analyzeMutation.isPending}
              className="px-6"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {analyzeMutation.isPending ? "Analyzing..." : "Analyze Domain"}
            </Button>
          </div>

          {/* Domain validation feedback */}
          {searchQuery && (
            <div className="mt-3">
              <div className={`flex items-center space-x-2 text-sm ${
                isValidDomain ? "text-green-600" : "text-red-600"
              }`}>
                {isValidDomain ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Valid domain format detected</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span>Please enter a valid domain format</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
