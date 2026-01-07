"use client";
import { useState, useEffect, useMemo, memo, useRef } from "react";
import { createPortal } from "react-dom";
import { PieChart } from "@mui/x-charts/PieChart";

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [task, setTask] = useState("sentiment");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [droppedTokens, setDroppedTokens] = useState<any[]>([]);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const getColourFromScore = (score: number) => {
    if (score <= -0.6) return "bg-red-700 text-white";
    if (score <= -0.2) return "bg-red-300 text-red-900";
    if (score <= 0.2) return "bg-gray-400 text-gray-900";
    if (score <= 0.6) return "bg-green-300 text-green-900";
    return "bg-green-700 text-white";
  };

  const getLabelFromScore = (score: number) => {
    if (score <= -0.6) return "Strong Negative";
    if (score <= -0.2) return "Weak Negative";
    if (score <= 0.2) return "Neutral";
    if (score <= 0.6) return "Weak Positive";
    return "Strong Positive";
  };

  const cleanToken = (token: string) => {
    return token.replace(/Ġ/g, " ");
  };

  const stripMarkdown = (text: string) => {
    // Remove markdown formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold **text** -> text
      .replace(/\*(.*?)\*/g, '$1') // Italic *text* -> text
      .replace(/#{1,6}\s+/g, '') // Headers # -> remove
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links [text](url) -> text
      .replace(/`([^`]+)`/g, '$1') // Inline code `code` -> code
      .replace(/```[\s\S]*?```/g, '') // Code blocks
      .replace(/\n{3,}/g, '\n\n') // Multiple newlines -> double newline
      .trim();
  };

  const TokenTooltip = ({ token, score, label, children }: { token: string; score: number; label: string; children: React.ReactNode }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
      setMounted(true);
    }, []);
    
    const handleMouseMove = (e: React.MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    
    const tooltipContent = showTooltip && mounted ? (
      <div 
        className="fixed px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-2xl whitespace-nowrap pointer-events-none border border-gray-700 dark:border-gray-600"
        style={{
          left: `${position.x + 10}px`,
          top: `${position.y - 60}px`,
          zIndex: 99999,
        }}
      >
        <div className="font-semibold mb-1 text-white">{token}</div>
        <div className="text-gray-300 mb-1">{label}</div>
        <div className="text-blue-300 font-mono">Score: {score.toFixed(3)}</div>
      </div>
    ) : null;
    
    return (
      <>
        <span
          className="relative inline-block z-10"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onMouseMove={handleMouseMove}
        >
          {children}
        </span>
        {mounted && createPortal(tooltipContent, document.body)}
      </>
    );
  };

  const LegendItem = ({ colour, label }: { colour: string; label: string }) => (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded ${colour}`} />
      <span className="text-sm text-gray-700 dark:text-[hsl(220,15%,92%)]">{label}</span>
    </div>
  );

  const DonutChart = memo(({ predictions }: { predictions: any[] }) => {
    const colors = [
      "#3b82f6", // blue
      "#8b5cf6", // purple
      "#10b981", // green
      "#f59e0b", // amber
      "#ef4444", // red
      "#06b6d4", // cyan
      "#ec4899", // pink
    ];
    
    // Memoize filtered predictions and chart data
    const { filteredPredictions, chartData } = useMemo(() => {
      // Filter out predictions with 0% probability
      const filtered = predictions.filter(pred => pred.probability > 0);
      
      // Prepare data for MUI PieChart
      const data = filtered.map((pred, index) => ({
        id: `${pred.label}-${index}`,
        value: pred.probability * 100,
        label: pred.label.charAt(0).toUpperCase() + pred.label.slice(1),
        color: colors[index % colors.length],
      }));
      
      return { filteredPredictions: filtered, chartData: data };
    }, [predictions]);
    
    const chartColors = useMemo(() => 
      chartData.map(item => item.color),
      [chartData]
    );
    
    const seriesConfig = useMemo(() => [
      {
        data: chartData,
        innerRadius: 50,
        outerRadius: 100,
        arcLabel: (item: any) => `${item.value.toFixed(1)}%`,
        arcLabelMinAngle: 10,
      },
    ], [chartData]);
    
    return (
      <div className="flex flex-col items-center">
        <PieChart
          series={seriesConfig}
          colors={chartColors}
          width={300}
          height={300}
          skipAnimation={true}
        />
        <div className="grid grid-cols-2 gap-3 w-full mt-6">
          {filteredPredictions.map((pred, index) => {
            const percentage = (pred.probability * 100).toFixed(1);
            const color = colors[index % colors.length];
            const isTopPrediction = index === 0;
            return (
              <div key={`${pred.label}-${index}`} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: color }}
                />
                <span className={`text-sm capitalize ${isTopPrediction ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-[hsl(220,15%,92%)]'}`}>
                  {pred.label}
                </span>
                <span className={`text-sm font-mono ml-auto ${isTopPrediction ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-[hsl(220,15%,92%)]'}`}>
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render), false if different (re-render)
    if (prevProps.predictions.length !== nextProps.predictions.length) {
      return false; // Different length, need to re-render
    }
    // Check if all predictions are the same
    const areEqual = prevProps.predictions.every((pred, index) => {
      const nextPred = nextProps.predictions[index];
      return pred.label === nextPred.label && 
             Math.abs(pred.probability - nextPred.probability) < 0.0001;
    });
    return areEqual; // Return true if equal (skip re-render), false if different (re-render)
  });
  
  DonutChart.displayName = 'DonutChart';

  const analyze = async () => {
    if (!text.trim()) {
      setError("Please enter some text to analyze");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setDroppedTokens([]);
    setExplanation(null);

    try {
      const res = await fetch("http://localhost:3001/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, task }),
      });

      if (!res.ok) {
        throw new Error("Failed to analyze text");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError("Failed to analyze text. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      analyze();
    }
  };

  const handleDragStart = (e: React.DragEvent, token: any) => {
    e.dataTransfer.setData("application/json", JSON.stringify(token));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    try {
      const tokenData = JSON.parse(e.dataTransfer.getData("application/json"));
      const cleanedToken = cleanToken(tokenData.token);
      const tokenWithCleaned = { ...tokenData, text: cleanedToken };
      
      // Check if token is already dropped
      const isDuplicate = droppedTokens.some(
        (t) => t.token === tokenData.token && t.score === tokenData.score
      );
      
      if (isDuplicate) {
        setError("This token is already in the comparison box");
        return;
      }

      const newDroppedTokens = [...droppedTokens, tokenWithCleaned];
      setDroppedTokens(newDroppedTokens);
      setError(null);

      // If we now have 2 tokens, automatically call the explain API
      if (newDroppedTokens.length === 2) {
        await explainTokens(newDroppedTokens[0], newDroppedTokens[1]);
      }
    } catch (err) {
      console.error("Error handling drop:", err);
      setError("Failed to drop token");
    }
  };

  const explainTokens = async (tokenA: any, tokenB: any) => {
    if (!result) return;

    setExplaining(true);
    setExplanation(null);
    setError(null);

    try {
      const res = await fetch("http://localhost:3001/explain-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenA: { text: tokenA.text, score: tokenA.score },
          tokenB: { text: tokenB.text, score: tokenB.score },
          task: task,
          prediction: result.prediction,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get explanation");
      }

      const data = await res.json();
      
      // Check for error in response
      if (data.error) {
        throw new Error(data.error.message || "API error occurred");
      }
      
      // Extract the explanation from the OpenRouter response
      // Handle different possible response structures
      let explanationText = null;
      
      if (data.choices && data.choices[0]) {
        if (data.choices[0].message && data.choices[0].message.content) {
          explanationText = data.choices[0].message.content;
        } else if (data.choices[0].text) {
          explanationText = data.choices[0].text;
        }
      } else if (data.content) {
        explanationText = data.content;
      } else if (data.message) {
        explanationText = data.message;
      }
      
      if (explanationText) {
        // Strip markdown formatting from the explanation
        const cleanedExplanation = stripMarkdown(explanationText);
        setExplanation(cleanedExplanation);
      } else {
        console.error("Unexpected response format:", data);
        throw new Error("Invalid response format. Please check the console for details.");
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to get explanation. Please try again.";
      setError(errorMessage);
      console.error("Error explaining tokens:", err);
    } finally {
      setExplaining(false);
    }
  };

  const clearComparison = () => {
    setDroppedTokens([]);
    setExplanation(null);
    setError(null);
  };

  // Memoize predictions to prevent unnecessary chart re-renders
  const memoizedPredictions = useMemo(() => {
    if (!result?.all_predictions) return null;
    // Return a new array only if the data actually changed
    return result.all_predictions;
  }, [result?.all_predictions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[hsl(230,25%,6%)] dark:to-[hsl(230,25%,8%)]">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-left mb-12">
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Token Importance Visualizer
          </h1>
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-gray-500 dark:text-[hsl(220,15%,92%)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-gray-600 dark:text-[hsl(220,15%,92%)]">
              Educational tool
            </p>
          </div>
        </div>

        {!result ? (
          <div className="flex justify-center animate-in fade-in">
            <div className="w-full max-w-2xl transition-all duration-500 ease-out">
              {/* Main Content Card */}
              <div className="bg-white dark:bg-[hsl(230,22%,10%)] rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 transition-all duration-500 ease-out">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Text Analysis Input</h2>
              {/* Task Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-[hsl(220,15%,92%)] mb-3">
                  Analysis Type
                </label>
                <select
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                  disabled={loading}
                >
                  <option value="sentiment">Sentiment Analysis</option>
                  <option value="emotion">Emotion Classification</option>
                </select>
              </div>

              {/* Text Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-[hsl(220,15%,92%)] mb-3">
                  Text to Analyze
                </label>
                <textarea
                  rows={6}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter text to analyze (e.g., 'I love this product! It makes me so happy.')"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-[hsl(220,15%,92%)]">
                  Press Cmd/Ctrl + Enter to analyze
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Analyze Button */}
              <button
                onClick={analyze}
                disabled={loading || !text.trim()}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <span>Analyze Text</span>
                )}
              </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in layout-transition">
            <div className="space-y-8 animate-in fade-in scale-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
              {/* Main Content Card */}
              <div className="bg-white dark:bg-[hsl(230,22%,10%)] rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 transition-all duration-500 ease-out">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Text Analysis Input</h2>
                {/* Task Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-[hsl(220,15%,92%)] mb-3">
                    Analysis Type
                  </label>
                  <select
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                    disabled={loading}
                  >
                    <option value="sentiment">Sentiment Analysis</option>
                    <option value="emotion">Emotion Classification</option>
                  </select>
                </div>

                {/* Text Input */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-[hsl(220,15%,92%)] mb-3">
                    Text to Analyze
                  </label>
                  <textarea
                    rows={6}
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter text to analyze (e.g., 'I love this product! It makes me so happy.')"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    disabled={loading}
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-[hsl(220,15%,92%)]">
                    Press Cmd/Ctrl + Enter to analyze
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Analyze Button */}
                <button
                  onClick={analyze}
                  disabled={loading || !text.trim()}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <span>Analyze Text</span>
                  )}
                </button>
              </div>

              {/* Prediction Card */}
              <div className="bg-white dark:bg-[hsl(230,22%,10%)] rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Prediction Result</h2>
                <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-6">
                    Prediction Probabilities
                  </h3>
                  {memoizedPredictions && <DonutChart predictions={memoizedPredictions} />}
                </div>
              </div>

            </div>

            {/* Right Column - Token Visualization */}
            <div className="bg-white dark:bg-[hsl(230,22%,10%)] rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-right" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Token Importance Visualization</h2>
              {/* Legend */}
              <div className="mb-8 p-6 bg-gray-50 dark:bg-[hsl(230,22%,12%)] rounded-xl">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
                  Token Importance Legend
                </h4>
                <div className="flex flex-wrap gap-6">
                  <LegendItem colour="bg-green-700" label="Strong Positive" />
                  <LegendItem colour="bg-green-300" label="Weak Positive" />
                  <LegendItem colour="bg-gray-400" label="Neutral" />
                  <LegendItem colour="bg-red-300" label="Weak Negative" />
                  <LegendItem colour="bg-red-700" label="Strong Negative" />
                </div>
              </div>

              {/* Token Visualization */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Token Breakdown
                </h4>
                <div className="p-6 bg-gray-50 dark:bg-[hsl(230,22%,12%)] rounded-xl border border-gray-200 dark:border-gray-600 max-h-[600px] overflow-y-auto relative">
                  <div className="leading-relaxed text-lg break-words">
                    {result.tokens.map((token: any, index: number) => {
                      const label = getLabelFromScore(token.score);
                      const cleanedToken = cleanToken(token.token);
                      return (
                        <TokenTooltip
                          key={index}
                          token={cleanedToken}
                          score={token.score}
                          label={label}
                        >
                          <span
                            draggable
                            onDragStart={(e) => handleDragStart(e, token)}
                            className={`inline-block px-2 py-1 mb-1 mr-1 rounded-2xl ${getColourFromScore(
                              token.score
                            )} transition-all hover:scale-110 hover:shadow-md cursor-move select-none`}
                          >
                            {cleanedToken}
                          </span>
                        </TokenTooltip>
                      );
                    })}
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-500 dark:text-[hsl(220,15%,92%)] italic">
                  Drag tokens to the comparison box below to compare their importance
                </p>
              </div>

              {/* Drag and Drop Comparison Box */}
              <div className="mt-8 bg-white dark:bg-[hsl(230,22%,10%)] rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Compare Tokens
                </h4>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`p-8 rounded-xl border-2 border-dashed transition-all ${
                    dragOver
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[hsl(230,22%,12%)]"
                  }`}
                >
                  {droppedTokens.length === 0 ? (
                    <div className="text-center py-8">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="text-gray-600 dark:text-[hsl(220,15%,92%)] font-medium">
                        Drag and drop 2 tokens here to compare
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                        Drop tokens from the breakdown above
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-3">
                        {droppedTokens.map((token, index) => (
                          <div
                            key={index}
                            className={`px-4 py-2 rounded-2xl ${getColourFromScore(
                              token.score
                            )} flex items-center gap-2`}
                          >
                            <span className="font-medium">{token.text}</span>
                            <button
                              onClick={() => {
                                const newTokens = droppedTokens.filter((_, i) => i !== index);
                                setDroppedTokens(newTokens);
                                if (newTokens.length === 0) {
                                  setExplanation(null);
                                }
                              }}
                              className="ml-2 hover:opacity-70 transition-opacity"
                              aria-label="Remove token"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                        {droppedTokens.length < 2 && (
                          <div className="px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-[hsl(220,15%,92%)] flex items-center">
                            Drop another token here
                          </div>
                        )}
                      </div>
                      {droppedTokens.length > 0 && (
                        <button
                          onClick={clearComparison}
                          className="text-sm text-gray-600 dark:text-[hsl(220,15%,92%)] hover:text-gray-900 dark:hover:text-gray-200 underline"
                        >
                          Clear comparison
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Explanation Result */}
                {explaining && (
                  <div className="mt-6 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <svg
                        className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <p className="text-blue-700 dark:text-blue-300">
                        Getting explanation...
                      </p>
                    </div>
                  </div>
                )}

                {explanation && (
                  <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                      AI Explanation
                    </h5>
                    <p className="text-gray-800 dark:text-[hsl(220,15%,92%)] leading-relaxed whitespace-pre-wrap">
                      {explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-600 dark:text-[hsl(220,15%,92%)] text-sm">
        <p>Made by Sophia 2026 • Powered by Transformers</p>
      </footer> 
    </div>
  );
}
