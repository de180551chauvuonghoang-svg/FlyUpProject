import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Quiz({ courseId, sectionId, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [explanations, setExplanations] = useState({}); // { questionId: { loading, text, error } }

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchQuestions = async () => {
    try {
      const sectionQuery = sectionId ? `&sectionId=${sectionId}` : "";
      const response = await fetch(
        `${API_URL}/quiz/${courseId}/questions?limit=10${sectionQuery}`,
      );
      const data = await response.json();

      if (data.success) {
        setQuestions(data.data.questions);
      } else {
        toast.error("Failed to load quiz");
      }
    } catch (error) {
      console.error("Failed to fetch quiz:", error);
      toast.error("Failed to load quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAnswer = (questionId, choiceId) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: choiceId,
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Fetch AI explanation for a single question
  const fetchExplanation = async (result, questionData) => {
    const questionId = result.questionId;
    setExplanations((prev) => ({
      ...prev,
      [questionId]: { loading: true, text: null, error: null },
    }));

    try {
      const token = localStorage.getItem("accessToken");
      const userChoice = questionData?.choices?.find(
        (c) => c.id === result.userAnswer
      );
      const correctChoice = questionData?.choices?.find(
        (c) => c.id === result.correctAnswer
      );

      const response = await fetch(`${API_URL}/quiz/cat/explain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          questionContent: result.question,
          choices: questionData?.choices?.map((c) => ({ content: c.content })) || [],
          selectedChoiceContent: userChoice?.content || result.userAnswer,
          correctChoiceContent: correctChoice?.content || "",
          isCorrect: result.isCorrect,
          sectionId: sectionId || null,
        }),
      });

      const data = await response.json();
      if (response.ok && data.explanation) {
        setExplanations((prev) => ({
          ...prev,
          [questionId]: { loading: false, text: data.explanation, error: null },
        }));
      } else {
        setExplanations((prev) => ({
          ...prev,
          [questionId]: { loading: false, text: null, error: data.error || "Failed" },
        }));
      }
    } catch (err) {
      console.error("AI explanation error:", err);
      setExplanations((prev) => ({
        ...prev,
        [questionId]: { loading: false, text: null, error: "Failed to load explanation" },
      }));
    }
  };

  const handleSubmit = async () => {
    const unanswered = questions.filter((q) => !selectedAnswers[q.id]);
    if (unanswered.length > 0) {
      toast.error(
        `Please answer all questions (${unanswered.length} remaining)`,
      );
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/quiz/${courseId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers: selectedAnswers }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.data);
        setIsSubmitted(true);
        toast.success(`Quiz submitted! Score: ${data.data.score}%`);

        // Auto-fetch AI explanations for all questions
        if (data.data.results) {
          data.data.results.forEach((result) => {
            const qData = questions.find((q) => q.id === result.questionId);
            fetchExplanation(result, qData);
          });
        }
      } else {
        toast.error("Failed to submit quiz");
      }
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      toast.error("Failed to submit quiz");
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setCurrentQuestion(0);
    setIsSubmitted(false);
    setResults(null);
    setExplanations({});
    fetchQuestions();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center p-12">
        <span className="material-symbols-outlined text-6xl text-slate-700 block mb-4">
          quiz
        </span>
        <h3 className="text-xl font-bold text-white mb-2">No Quiz Available</h3>
        <p className="text-slate-400">
          This course doesn't have quiz questions yet.
        </p>
      </div>
    );
  }

  // Results view
  if (isSubmitted && results) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        {/* Score Card */}
        <div className="glass-panel rounded-2xl p-8 text-center mb-6">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <span className="text-5xl font-bold text-white">
              {results.score}%
            </span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h2>
          <p className="text-lg text-slate-300">
            You got {results.correctCount} out of {results.totalQuestions}{" "}
            questions correct
          </p>
        </div>

        {/* Results Details */}
        <div className="space-y-4">
          {results.results.map((result, index) => {
            const explanation = explanations[result.questionId];
            return (
              <div
                key={result.questionId}
                className={`glass-panel rounded-xl p-6 border-2 ${
                  result.isCorrect
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-red-500/30 bg-red-500/5"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                      result.isCorrect ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    <span className="material-symbols-outlined text-white text-sm">
                      {result.isCorrect ? "check" : "close"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold mb-2">
                      Question {index + 1}
                    </h4>
                    <p className="text-slate-300 mb-3">{result.question}</p>
                    <div className="text-sm">
                      <p className="text-slate-400">
                        {result.isCorrect ? "✓ Correct!" : "✗ Incorrect"}
                      </p>
                      {!result.isCorrect && (
                        <p className="text-green-400 mt-1">
                          Correct answer: {result.explanation}
                        </p>
                      )}
                    </div>

                    {/* AI Explanation Section */}
                    <div className="mt-4">
                      {explanation?.loading && (
                        <div className="rounded-lg bg-white/5 border border-white/10 p-4 animate-pulse">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-5 h-5 rounded-full bg-purple-500/30 animate-spin border-2 border-transparent border-t-purple-400"></div>
                            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                              AI is analyzing...
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="h-3 bg-white/10 rounded w-full"></div>
                            <div className="h-3 bg-white/10 rounded w-4/5"></div>
                            <div className="h-3 bg-white/10 rounded w-3/5"></div>
                          </div>
                        </div>
                      )}

                      {explanation?.text && (
                        <div className={`rounded-lg p-4 border ${
                          result.isCorrect
                            ? "bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20"
                            : "bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20"
                        }`}
                        style={{ animation: "fadeIn 0.5s ease-out" }}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">🤖</span>
                            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                              FlyUp AI Tutor
                            </span>
                          </div>
                          <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                            {explanation.text}
                          </p>
                        </div>
                      )}

                      {explanation?.error && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                          <p className="text-red-300 text-xs">
                            ⚠️ Could not load AI explanation
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={handleRetry}
            className="flex-1 px-6 py-3 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600 transition-all"
          >
            Try Again
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Quiz view
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-slate-400">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span className="text-sm font-bold text-purple-400">
            {progress.toFixed(0)}% Complete
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="glass-panel rounded-2xl p-8 mb-6">
        {/* Difficulty Badge */}
        {question.difficulty && (
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${
              question.difficulty === "Easy"
                ? "bg-green-500/20 text-green-300 border border-green-500/50"
                : question.difficulty === "Medium"
                  ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50"
                  : "bg-red-500/20 text-red-300 border border-red-500/50"
            }`}
          >
            {question.difficulty}
          </span>
        )}

        <h3 className="text-xl font-bold text-white mb-6">
          {question.content}
        </h3>

        {/* Choices */}
        <div className="space-y-3">
          {question.choices.map((choice, index) => {
            const isSelected = selectedAnswers[question.id] === choice.id;
            return (
              <button
                key={choice.id}
                onClick={() => handleSelectAnswer(question.id, choice.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-white/10 bg-white/5 hover:border-purple-500/50 hover:bg-purple-500/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? "border-purple-500 bg-purple-500"
                        : "border-white/30"
                    }`}
                  >
                    {isSelected && (
                      <span className="material-symbols-outlined text-white text-sm">
                        check
                      </span>
                    )}
                  </div>
                  <span
                    className={`font-medium ${
                      isSelected ? "text-white" : "text-slate-300"
                    }`}
                  >
                    {String.fromCharCode(65 + index)}. {choice.content}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="px-6 py-3 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex-1"></div>

        {currentQuestion === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all"
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600 transition-all"
          >
            Next
          </button>
        )}
      </div>

      {/* Question Navigator */}
      <div className="mt-8 glass-panel rounded-xl p-4">
        <p className="text-xs font-bold text-slate-400 uppercase mb-3">
          Question Navigator
        </p>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestion(index)}
              className={`w-10 h-10 rounded-lg font-bold transition-all ${
                selectedAnswers[q.id]
                  ? "bg-purple-500 text-white"
                  : index === currentQuestion
                    ? "bg-white/20 text-white border-2 border-purple-500"
                    : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

