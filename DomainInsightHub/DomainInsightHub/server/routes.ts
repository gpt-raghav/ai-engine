import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertDomainSchema, 
  insertKeywordSchema, 
  insertPromptSchema, 
  insertAnalysisSchema 
} from "@shared/schema";
import { 
  analyzeDomainWithAI, 
  generatePrompts, 
  analyzeWithOpenAI, 
  analyzeWithGemini 
} from "./services/ai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Domain routes
  app.get("/api/domains", async (req, res) => {
    try {
      const domains = await storage.getAllDomains();
      res.json(domains);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/domains/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const domain = await storage.getDomainWithKeywords(id);
      if (!domain) {
        return res.status(404).json({ error: "Domain not found" });
      }
      res.json(domain);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/domains/analyze", async (req, res) => {
    try {
      const { domainName } = req.body;
      
      if (!domainName) {
        return res.status(400).json({ error: "Domain name is required" });
      }

      // Check if domain already exists
      let domain = await storage.getDomainByName(domainName);
      
      if (!domain) {
        // Analyze with AI
        const analysisResult = await analyzeDomainWithAI(domainName);
        
        // Create domain
        const domainData = insertDomainSchema.parse({
          name: domainName,
          description: analysisResult.description,
        });
        
        domain = await storage.createDomain(domainData);
        
        // Create keywords
        for (const keyword of analysisResult.keywords) {
          const keywordData = insertKeywordSchema.parse({
            domainId: domain.id,
            value: keyword,
          });
          await storage.createKeyword(keywordData);
        }
      }
      
      const domainWithKeywords = await storage.getDomainWithKeywords(domain.id);
      res.json(domainWithKeywords);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/domains/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { description } = req.body;
      
      const updatedDomain = await storage.updateDomain(id, { description });
      if (!updatedDomain) {
        return res.status(404).json({ error: "Domain not found" });
      }
      
      res.json(updatedDomain);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Keyword routes
  app.get("/api/domains/:domainId/keywords", async (req, res) => {
    try {
      const domainId = parseInt(req.params.domainId);
      const keywords = await storage.getKeywordsByDomain(domainId);
      res.json(keywords);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/keywords", async (req, res) => {
    try {
      const keywordData = insertKeywordSchema.parse(req.body);
      const keyword = await storage.createKeyword(keywordData);
      res.json(keyword);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/keywords/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { value } = req.body;
      
      const keyword = await storage.updateKeyword(id, value);
      if (!keyword) {
        return res.status(404).json({ error: "Keyword not found" });
      }
      
      res.json(keyword);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/keywords/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteKeyword(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Keyword not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Prompt routes
  app.post("/api/prompts/generate", async (req, res) => {
    try {
      const { domainId, category } = req.body;
      
      const domain = await storage.getDomainWithKeywords(domainId);
      if (!domain) {
        return res.status(404).json({ error: "Domain not found" });
      }
      
      const keywords = domain.keywords.map(k => k.value);
      const promptResult = await generatePrompts(
        domain.name,
        domain.description,
        keywords,
        category
      );
      
      // Save prompts to database
      const savedPrompts = [];
      for (const prompt of promptResult.prompts) {
        const promptData = insertPromptSchema.parse({
          domainId: domain.id,
          content: prompt.content,
          category: prompt.category,
        });
        const savedPrompt = await storage.createPrompt(promptData);
        savedPrompts.push(savedPrompt);
      }
      
      res.json(savedPrompts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/domains/:domainId/prompts", async (req, res) => {
    try {
      const domainId = parseInt(req.params.domainId);
      const prompts = await storage.getPromptsByDomain(domainId);
      res.json(prompts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Analysis routes
  app.post("/api/prompts/:promptId/analyze", async (req, res) => {
    try {
      const promptId = parseInt(req.params.promptId);
      const { engines } = req.body; // Array of engine names: ['openai', 'gemini']
      
      const prompt = await storage.getPrompt(promptId);
      if (!prompt) {
        return res.status(404).json({ error: "Prompt not found" });
      }
      
      const analyses = [];
      
      // Get domain keywords for analysis
      const domain = await storage.getDomainWithKeywords(prompt.domainId);
      const keywords = domain?.keywords.map(k => k.value) || [];

      if (engines.includes('openai')) {
        try {
          const openaiResult = await analyzeWithOpenAI(prompt.content, keywords);
          const analysisData = insertAnalysisSchema.parse({
            domainId: prompt.domainId,
            promptId: prompt.id,
            engine: 'openai',
            response: openaiResult.response,
            sentimentScore: openaiResult.sentimentScore,
            responseTime: openaiResult.responseTime,
            keywordRelevance: openaiResult.keywordRelevance,
            performanceScore: openaiResult.performanceScore,
          });
          const analysis = await storage.createAnalysis(analysisData);
          analyses.push(analysis);
        } catch (error) {
          console.error('OpenAI analysis failed:', error);
        }
      }
      
      if (engines.includes('gemini')) {
        try {
          const geminiResult = await analyzeWithGemini(prompt.content, keywords);
          const analysisData = insertAnalysisSchema.parse({
            domainId: prompt.domainId,
            promptId: prompt.id,
            engine: 'gemini',
            response: geminiResult.response,
            sentimentScore: geminiResult.sentimentScore,
            responseTime: geminiResult.responseTime,
            keywordRelevance: geminiResult.keywordRelevance,
            performanceScore: geminiResult.performanceScore,
          });
          const analysis = await storage.createAnalysis(analysisData);
          analyses.push(analysis);
        } catch (error) {
          console.error('Gemini analysis failed:', error);
        }
      }
      
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/prompts/:promptId/analyses", async (req, res) => {
    try {
      const promptId = parseInt(req.params.promptId);
      const analyses = await storage.getAnalysesByPrompt(promptId);
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/domains/:domainId/analyses", async (req, res) => {
    try {
      const domainId = parseInt(req.params.domainId);
      const analyses = await storage.getAnalysesByDomain(domainId);
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Statistics route
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get keyword rankings for a domain
  app.get("/api/domains/:id/keyword-rankings", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid domain ID" });
      }

      const rankings = await storage.getKeywordRankings(id);
      res.json(rankings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch keyword rankings" });
    }
  });

  // Get domain performance by AI engine
  app.get("/api/domains/:id/engine-performance", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid domain ID" });
      }

      const performance = await storage.getDomainPerformanceByEngine(id);
      res.json(performance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch engine performance" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
