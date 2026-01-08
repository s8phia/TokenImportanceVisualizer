import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch


app = FastAPI()
SENTIMENT_MODEL_NAME = "distilbert-base-uncased-finetuned-sst-2-english"
EMOTION_MODEL_NAME = "j-hartmann/emotion-english-distilroberta-base"

# Sentiment classification model
sentiment_tokenizer = AutoTokenizer.from_pretrained(SENTIMENT_MODEL_NAME)
sentiment_model = AutoModelForSequenceClassification.from_pretrained(SENTIMENT_MODEL_NAME)
sentiment_model.eval()
sentiment_embedding_layer = sentiment_model.get_input_embeddings() 

# Emotion classification model
emotion_tokenizer = AutoTokenizer.from_pretrained(EMOTION_MODEL_NAME)
emotion_model = AutoModelForSequenceClassification.from_pretrained(EMOTION_MODEL_NAME)
emotion_model.eval()
emotion_embedding_layer = emotion_model.get_input_embeddings()

emotion_label_map = {
    0: "anger",
    1: "disgust",
    2: "fear",
    3: "joy",
    4: "neutral",
    5: "sadness",
    6: "surprise"
}

class AnalyzeRequest(BaseModel):
    text: str
    task: str

@app.get("/")
def read_root():
    return {"message": "Hello World"}

@app.post("/analyze")
def analyze(request: AnalyzeRequest):
    text = request.text
    task = request.task
    if task == "sentiment":
        tokenizer = sentiment_tokenizer
        model = sentiment_model
        embedding_layer = sentiment_embedding_layer
        label_map = {0: "NEGATIVE", 1: "POSITIVE"}

    elif task == "emotion":
        tokenizer = emotion_tokenizer
        model = emotion_model
        embedding_layer = emotion_embedding_layer
        label_map = emotion_label_map

    else:
        return {"error": "error in selecting task"}

    tokens = tokenizer.tokenize(text)
    inputs = tokenizer(text, return_tensors="pt")
    input_ids = inputs["input_ids"]
    embeddings = embedding_layer(input_ids)
    embeddings.retain_grad()
    outputs = model(inputs_embeds=embeddings)
    logits = outputs.logits
    probs = torch.softmax(logits, dim=1)
    pred_idx = torch.argmax(probs).item()
    prediction = label_map[pred_idx]
    confidence = probs[0][pred_idx].item() 
    
    all_probs = probs[0].tolist()
    all_predictions = [
        {
            "label": label_map[i],
            "probability": float(prob)
        }
        for i, prob in enumerate(all_probs)
    ]
    all_predictions.sort(key=lambda x: x["probability"], reverse=True)
    
    logits[0, pred_idx].backward()
    token_importances = embeddings.grad.norm(dim=2)[0]
    signed_token_scores = embeddings.grad.sum(dim=2)[0]
    max_score = token_importances.max().item()
    normalized_importances = token_importances / max_score
    final_token_scores = normalized_importances * torch.sign(signed_token_scores)
    token_scores = [
        {
            "token": token,
            "score": float(score)
        }
        for token, score in zip(tokens, final_token_scores)
    ]
    
    return {
        "prediction": prediction,
        "confidence": confidence,
        "all_predictions": all_predictions,
        "tokens": token_scores
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))  
    uvicorn.run(app, host="0.0.0.0", port=port)
