import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch


app = FastAPI()
MODEL_NAME = "distilbert-base-uncased-finetuned-sst-2-english"

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)

model.eval()
embedding_layer = model.get_input_embeddings()

class AnalyzeRequest(BaseModel):
    text: str
    task: str

@app.get("/")
def read_root():
    return {"message": "Hello World"}

@app.post("/analyze")
def analyze(request: AnalyzeRequest):
    text = request.text
    tokens = tokenizer.tokenize(text)
    inputs = tokenizer(text, return_tensors="pt")
    input_ids = inputs["input_ids"]
    embeddings = embedding_layer(input_ids)
    embeddings.retain_grad()
    outputs = model(inputs_embeds=embeddings)
    logits = outputs.logits
    probs = torch.softmax(logits, dim=1)
    pred_idx = torch.argmax(probs).item()
    label_map = {0: "NEGATIVE", 1: "POSITIVE"}
    prediction = label_map[pred_idx]
    confidence = probs[0][pred_idx].item()
    logits[0, pred_idx].backward()
    token_importances = embeddings.grad.norm(dim=2)[0]
    token_scores = [
        {
            "token": token,
            "score": float(score)
        }
        for token, score in zip(tokens, token_importances)
    ]


    return {
        "prediction": prediction,
        "confidence": confidence,
        "tokens": token_scores
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
