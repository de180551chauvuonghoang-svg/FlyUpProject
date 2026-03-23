import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import InstructorSidebar from "../components/InstructorSidebar";
import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

// Set pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function InstructorToolsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState("tts");

  // TTS state
  const [ttsText, setTtsText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [speechRate, setSpeechRate] = useState(1);
  const utteranceRef = useRef(null);
  const cloudAudioRef = useRef(null);

  // Summary state
  const [summaryText, setSummaryText] = useState("");
  const [summaryResult, setSummaryResult] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryLanguage, setSummaryLanguage] = useState("vi");

  // Auth check
  useEffect(() => {
    if (loading) return;
    if (!user) {
      toast.error("Please login as an instructor");
      navigate("/login?role=instructor");
      return;
    }
    const roleValue = (user.role || user.Role || "").trim().toLowerCase();
    if (!user.instructor && !user.instructorId && roleValue !== "instructor") {
      toast.error("You do not have instructor privileges");
      navigate("/");
    }
  }, [user, loading, navigate]);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        const defaultVoice = availableVoices.find(v => v.lang.startsWith("en")) || availableVoices[0];
        setSelectedVoice(defaultVoice.name);
      }
    };
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      speechSynthesis.cancel();
    };
  }, [selectedVoice]);

  // TTS functions
  const handleSpeak = async (text = null, forceLang = null) => {
    const speakText = typeof text === "string" ? text : ttsText;
    if (!speakText.trim()) {
      toast.error("Please enter text to speak");
      return;
    }
    
    if (cloudAudioRef.current) {
      cloudAudioRef.current.pause();
      cloudAudioRef.current = null;
    }
    speechSynthesis.cancel();
    
    if (forceLang) {
      try {
        const speechLang = forceLang === "vi" ? "vi" : "en";
        const token = localStorage.getItem("accessToken");
        setIsSpeaking(true);
        setIsPaused(false);
        const res = await fetch(`${API_URL}/chatbot/tts`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ text: speakText, lang: speechLang })
        });
        if (!res.ok) throw new Error("API error");
        const { urls } = await res.json();
        
        let index = 0;
        const playNext = () => {
          if (index >= urls.length) {
            setIsSpeaking(false);
            cloudAudioRef.current = null;
            return;
          }
          const chunk = urls[index];
          // google-tts-api getAllAudioBase64 returns an array where each object has .base64
          const audio = new Audio("data:audio/mp3;base64," + (chunk.base64 || chunk.url));
          cloudAudioRef.current = audio;
          audio.onended = () => {
            index++;
            playNext();
          };
          audio.onerror = () => {
            setIsSpeaking(false);
            cloudAudioRef.current = null;
          };
          audio.play().catch(() => {
            setIsSpeaking(false);
          });
        };
        playNext();
      } catch (err) {
        console.error(err);
        toast.error("Lỗi kết nối bộ đọc Cloud TTS");
        setIsSpeaking(false);
      }
    } else {
      const utterance = new SpeechSynthesisUtterance(speakText);
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) utterance.voice = voice;
      utterance.rate = speechRate;
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      setIsPaused(false);
    }
  };

  const handlePause = () => {
    if (cloudAudioRef.current) {
      if (isPaused) {
        cloudAudioRef.current.play();
        setIsPaused(false);
      } else {
        cloudAudioRef.current.pause();
        setIsPaused(true);
      }
    } else {
      if (isPaused) {
        speechSynthesis.resume();
        setIsPaused(false);
      } else {
        speechSynthesis.pause();
        setIsPaused(true);
      }
    }
  };

  const handleStop = () => {
    if (cloudAudioRef.current) {
      cloudAudioRef.current.pause();
      cloudAudioRef.current = null;
    }
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  // File Upload function
  const handleFileUpload = async (event, targetTool) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      let extractedText = "";

      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        extractedText = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (error) => reject(error);
          reader.readAsText(file);
        });
      } else if (
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
        file.name.endsWith(".docx")
      ) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map(item => item.str);
          extractedText += strings.join(" ") + "\n";
        }
      } else {
        toast.error("Unsupported file type. Please upload .txt, .docx, or .pdf");
        event.target.value = null;
        return;
      }

      if (targetTool === "tts") {
        setTtsText(extractedText);
      } else {
        setSummaryText(extractedText);
      }
      toast.success("File imported successfully!");
    } catch (error) {
      console.error("File extraction error:", error);
      toast.error("Failed to extract text from file.");
    } finally {
      event.target.value = null;
    }
  };

  // Summary function
  const handleSummarize = async () => {
    if (!summaryText.trim()) {
      toast.error("Please enter text to summarize");
      return;
    }
    setIsSummarizing(true);
    setSummaryResult("");
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: `Please provide a concise summary of the following text. The summary MUST be in ${summaryLanguage === 'vi' ? 'Vietnamese' : 'English'}. Focus on the key points and main ideas:\n\n${summaryText}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSummaryResult(data.response || "No summary available.");
      } else {
        toast.error("Failed to generate summary");
      }
    } catch (error) {
      console.error("Summary error:", error);
      toast.error("Failed to generate summary");
    } finally {
      setIsSummarizing(false);
    }
  };

  const tools = [
    { key: "tts", label: "Text to Speech", icon: "record_voice_over", color: "from-blue-600 to-cyan-600" },
    { key: "summary", label: "Summary", icon: "summarize", color: "from-purple-600 to-pink-600" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-display overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 blur-3xl"></div>
      </div>

      <InstructorSidebar />

      <main className="lg:ml-64 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/5 bg-slate-950/40">
          <div className="px-6 lg:px-10 py-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-blue-400">build</span>
              Tools
            </h1>
            <p className="text-slate-400 mt-1">
              Useful tools to enhance your teaching workflow
            </p>
          </div>
        </header>

        <div className="px-6 lg:px-10 py-8">
          {/* Tool Selector */}
          <div className="flex gap-4 mb-8">
            {tools.map((tool) => (
              <button
                key={tool.key}
                onClick={() => setActiveTool(tool.key)}
                className={`flex-1 max-w-xs flex items-center gap-3 px-6 py-5 rounded-2xl text-sm font-bold transition-all ${
                  activeTool === tool.key
                    ? `bg-gradient-to-r ${tool.color} text-white shadow-lg`
                    : "bg-white/5 text-slate-400 border border-white/10 hover:border-purple-500/50 hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined">{tool.icon}</span>
                {tool.label}
              </button>
            ))}
          </div>

          {/* Text to Speech Tool */}
          {activeTool === "tts" && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <span className="material-symbols-outlined text-blue-400 text-2xl">record_voice_over</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Text to Speech</h2>
                  <p className="text-sm text-slate-400">Convert text to audio using browser speech synthesis</p>
                </div>
              </div>

              {/* Controls Row */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Voice</label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                  >
                    {voices.map((voice) => (
                      <option key={voice.name} value={voice.name} className="bg-slate-900">
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-40">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Speed: {speechRate.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>

              {/* File Upload & Text input */}
              <div className="flex justify-between items-end mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Content</label>
                <div>
                  <input 
                    type="file" 
                    id="tts-file-upload" 
                    accept=".txt,.docx,.pdf" 
                    className="hidden" 
                    onChange={(e) => handleFileUpload(e, "tts")}
                  />
                  <label 
                    htmlFor="tts-file-upload" 
                    className="cursor-pointer text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20"
                  >
                    <span className="material-symbols-outlined text-sm">upload_file</span>
                    Import File (.txt, .docx, .pdf)
                  </label>
                </div>
              </div>
              <textarea
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                placeholder="Enter text you want to convert to speech..."
                rows={6}
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 text-sm resize-none mb-6"
              />

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!isSpeaking ? (
                  <button
                    onClick={handleSpeak}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:from-blue-500 hover:to-cyan-500 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    <span className="material-symbols-outlined">play_arrow</span>
                    Speak
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handlePause}
                      className="px-6 py-3 bg-yellow-600/20 text-yellow-400 font-bold rounded-xl hover:bg-yellow-600/30 transition-all flex items-center gap-2 border border-yellow-500/30"
                    >
                      <span className="material-symbols-outlined">
                        {isPaused ? "play_arrow" : "pause"}
                      </span>
                      {isPaused ? "Resume" : "Pause"}
                    </button>
                    <button
                      onClick={handleStop}
                      className="px-6 py-3 bg-red-600/20 text-red-400 font-bold rounded-xl hover:bg-red-600/30 transition-all flex items-center gap-2 border border-red-500/30"
                    >
                      <span className="material-symbols-outlined">stop</span>
                      Stop
                    </button>
                  </>
                )}
              </div>

              {isSpeaking && (
                <div className="mt-4 flex items-center gap-2 text-blue-400 text-sm">
                  <div className="flex gap-1">
                    <div className="w-1 h-4 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-1 h-6 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-1 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "300ms" }}></div>
                    <div className="w-1 h-5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "450ms" }}></div>
                    <div className="w-1 h-4 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "600ms" }}></div>
                  </div>
                  <span className="font-semibold">{isPaused ? "Paused" : "Speaking..."}</span>
                </div>
              )}
            </div>
          )}

          {/* Summary Tool */}
          {activeTool === "summary" && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <span className="material-symbols-outlined text-purple-400 text-2xl">summarize</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Text Summary</h2>
                  <p className="text-sm text-slate-400">Summarize long text into key points using AI</p>
                </div>
              </div>

              {/* Language, File Upload & Input */}
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Content</label>
                  <select
                    value={summaryLanguage}
                    onChange={(e) => setSummaryLanguage(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg text-white text-xs px-2 py-1 focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="vi" className="bg-slate-900">Vietnamese</option>
                    <option value="en" className="bg-slate-900">English</option>
                  </select>
                </div>
                <div>
                  <input 
                    type="file" 
                    id="summary-file-upload" 
                    accept=".txt,.docx,.pdf" 
                    className="hidden" 
                    onChange={(e) => handleFileUpload(e, "summary")}
                  />
                  <label 
                    htmlFor="summary-file-upload" 
                    className="cursor-pointer text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20"
                  >
                    <span className="material-symbols-outlined text-sm">upload_file</span>
                    Import File (.txt, .docx, .pdf)
                  </label>
                </div>
              </div>
              <textarea
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                placeholder="Paste or type the text you want to summarize..."
                rows={8}
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 text-sm resize-none mb-6"
              />

              <button
                onClick={handleSummarize}
                disabled={isSummarizing}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-500/20 mb-6"
              >
                <span className="material-symbols-outlined">
                  {isSummarizing ? "hourglass_empty" : "auto_awesome"}
                </span>
                {isSummarizing ? "Summarizing..." : "Summarize"}
              </button>

              {/* Result */}
              {summaryResult && (
                <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 border border-purple-500/20 rounded-xl p-6">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-purple-400 text-sm">auto_awesome</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-400">AI Summary</span>
                    </div>
                    {/* Speak Button */}
                    <div className="flex gap-2">
                      {!isSpeaking ? (
                        <button
                          onClick={() => handleSpeak(summaryResult, summaryLanguage)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 text-purple-300 hover:text-white hover:bg-purple-500/40 rounded-lg transition-colors text-xs font-bold border border-purple-500/30"
                        >
                          <span className="material-symbols-outlined text-sm">volume_up</span>
                          Listen
                        </button>
                      ) : (
                        <button
                          onClick={handleStop}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-300 hover:text-white hover:bg-red-500/40 rounded-lg transition-colors text-xs font-bold border border-red-500/30"
                        >
                          <span className="material-symbols-outlined text-sm">stop</span>
                          Stop
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {summaryResult}
                  </p>
                </div>
              )}

              {isSummarizing && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="w-10 h-10 border-3 border-white/10 border-t-purple-500 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-slate-400 text-sm">Generating summary...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
