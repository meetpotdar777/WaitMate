import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";

const aiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(aiKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API placeholders
  app.get("/api/trackers", (req, res) => {
    // In a real app, this would come from a database
    res.json([]);
  });

  app.post("/api/ai/predict", async (req, res) => {
    const { name, currentPrice, history } = req.body;
    
    if (!aiKey) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `Given a product named "${name}" with current price $${currentPrice} 
      and a price history of ${JSON.stringify(history)}, 
      should the user buy now or wait? Provide a 1-sentence reasoning. 
      Format exactly like: RECOMMENDATION: [BUY/WAIT] | REASON: [Reasoning]`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      res.json({ result: text });
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "Failed to generate AI insight" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
