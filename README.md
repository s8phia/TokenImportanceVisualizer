# Token Importance Visualizer

An interactive web application that visualizes token-level importance in text classification models. This educational tool helps users understand how machine learning models make predictions by highlighting which words contribute most to the final classification result.

## Features

- Interactive token visualization with color-coded importance scores
- Real-time sentiment and emotion classification
- Token comparison with AI-generated explanations
- Responsive design

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Express.js
- **ML Service**: FastAPI, PyTorch, Hugging Face Transformers
- **Models**: DistilBERT (sentiment), DistilRoBERTa (emotion)

## Installation

### Prerequisites
- Node.js 18+
- Python 3.8+
- OpenRouter API key (for token comparison)

### Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd aiheatmap
   ```

2. **ML Service**
   ```bash
   cd ml-service
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Backend**
   ```bash
   cd ../backend
   npm install
   ```
   
   Create `.env` file:
   ```env
   OPENROUTER_API_KEY=your_key_here
   ```

4. **Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

## Running

Start all three services in separate terminals:

1. **ML Service** 
   ```bash
   cd ml-service
   source venv/bin/activate
   python main.py
   ```

2. **Backend** 
   ```bash
   cd backend
   node index.js
   ```

3. **Frontend** 
   ```bash
   cd frontend
   npm run dev
   ```

**Note**: First run will download pre-trained models from Hugging Face (may take several minutes).

## Usage

1. Select analysis type (Sentiment or Emotion)
2. Enter text and click "Analyze Text" or press `Cmd/Ctrl + Enter`
3. View color-coded tokens:
   - Green = positive influence
   - Red = negative influence  
   - Yellow = neutral
4. Drag tokens to the comparison box to compare their importance

## How It Works

Uses gradient-based attribution to calculate token importance:
1. Text is tokenized and converted to embeddings
2. Model generates predictions
3. Gradients computed with respect to embedding layer
4. Token scores derived from gradient magnitudes and signs
5. Scores normalized and color-coded for visualization

Made by Sophia 2026 • Powered by Hugging Face Transformers

## Demo

https://github.com/user-attachments/assets/2e5af5c2-c6dc-4296-907a-ae5fb80067d9


