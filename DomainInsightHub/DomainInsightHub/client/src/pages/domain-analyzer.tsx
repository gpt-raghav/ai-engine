import { useState } from "react";
import { Globe, Bell, User } from "lucide-react";
import DomainSearch from "@/components/domain-search";
import DomainAnalysis from "@/components/domain-analysis";
import KeywordsManagement from "@/components/keywords-management";
import PromptGeneration from "@/components/prompt-generation";
import AIComparison from "@/components/ai-comparison";
import DatabaseStatus from "@/components/database-status";
import type { DomainWithKeywords } from "@shared/schema";

export default function DomainAnalyzer() {
  const [selectedDomain, setSelectedDomain] = useState<DomainWithKeywords | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleDomainAnalyzed = (domain: DomainWithKeywords) => {
    setSelectedDomain(domain);
    setShowResults(true);
  };

  return (
    <div className="font-inter bg-slate-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Globe className="text-white w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Domain AI Analyzer</h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-slate-600 hover:text-slate-900 font-medium">Dashboard</a>
              <a href="#" className="text-slate-600 hover:text-slate-900 font-medium">History</a>
              <a href="#" className="text-slate-600 hover:text-slate-900 font-medium">Settings</a>
            </nav>

            <div className="flex items-center space-x-4">
              <button className="text-slate-600 hover:text-slate-900">
                <Bell className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                <User className="text-slate-600 w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <DomainSearch onDomainAnalyzed={handleDomainAnalyzed} />

        {/* Analysis Results */}
        {showResults && selectedDomain && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <DomainAnalysis 
                domain={selectedDomain} 
                onDomainUpdated={setSelectedDomain}
              />
              <KeywordsManagement 
                domain={selectedDomain}
                onKeywordsUpdated={setSelectedDomain}
              />
            </div>

            <PromptGeneration domain={selectedDomain} />
            <AIComparison domain={selectedDomain} />
          </>
        )}

        {/* Database Status */}
        <DatabaseStatus />
      </main>
    </div>
  );
}
