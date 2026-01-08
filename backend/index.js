const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3001;


const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({
  origin: frontendUrl
}));
app.use(express.json());
require('dotenv').config();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.post("/analyze", async (req, res) => {
  const { text, task } = req.body;

  if (!text || !task) {
    return res.status(400).json({ error: "Missing text or task" });
  }

  try {
    const response = await fetch(`${ML_SERVICE_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, task }),
    });

    const data = await response.json();

    return res.json(data);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "ML service unavailable" });
  }
});

app.post("/explain-tokens", async (req, res) => {
  const {tokenA, tokenB, task, prediction} = req.body;

  try {
    const prompt = `
        You are an AI explaining model decisions.

        Task: ${task}
        Final prediction: ${prediction}

        Token A: "${tokenA.text}" (importance score: ${tokenA.score})
        Token B: "${tokenB.text}" (importance score: ${tokenB.score})

        Explain clearly why one token influenced the prediction more than the other.
        Use simple language and make it short and concise. Do not mention model internals.
        IMPORTANT: Write in plain text only. Do NOT use markdown formatting, asterisks, bold text, headers, or any special formatting. Just write a natural, flowing paragraph.
        `;
    
    // Try multiple free models as fallback
    const models = [
      "google/gemini-flash-1.5-8b:free",
      "meta-llama/llama-3.2-3b-instruct:free",
      "microsoft/phi-3-mini-128k-instruct:free"
    ];
    
    let lastError = null;
    let response = null;
    let data = null;
    
    for (const model of models) {
      try {
        response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: prompt }],
          }),
        });
        
        data = await response.json();
        
        if (response.ok && data.choices && data.choices[0]) {
          break; // Success, exit loop
        } else {
          lastError = data.error || { message: "Unknown error" };
        }
      } catch (err) {
        lastError = { message: err.message };
        continue; // Try next model
      }
    }

    
    if (!response || !response.ok) {
      console.error("OpenRouter API error:", lastError);
      return res.status(response?.status || 500).json({ 
        error: { 
          message: lastError?.message || "Failed to get explanation from AI service. All models failed." 
        } 
      });
    }
    
    return res.json(data);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to explain tokens" });
  }

});



  