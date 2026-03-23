import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import InstructorLayout from "../components/InstructorLayout";
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
    <InstructorLayout
      title="Tools"
      subtitle="Useful tools to enhance your teaching workflow"
    >
      {/* Tool Selector */}
      <div className="flex flex-wrap gap-4 mb-10">
        {tools.map((tool) => (
          <button
            key={tool.key}
            onClick={() => setActiveTool(tool.key)}
            className={`flex-1 min-w-[200px] flex items-center gap-4 px-8 py-6 rounded-3xl text-sm font-black tracking-wide transition-all ${
              activeTool === tool.key
                ? `bg-gradient-to-br ${tool.color} text-white shadow-2xl`
                : "bg-white/5 text-slate-400 border border-white/10 hover:border-purple-500/50 hover:text-white"
            }`}
          >
            <div className={`p-3 rounded-2xl ${activeTool === tool.key ? 'bg-white/20' : 'bg-white/5'}`}>
              <span className="material-symbols-outlined">{tool.icon}</span>
            </div>
            {tool.label}
          </button>
        ))}
      </div>

      {/* Text to Speech Tool */}
      {activeTool === "tts" && (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-4 bg-blue-500/20 rounded-2xl">
              <span className="material-symbols-outlined text-blue-400 text-3xl">record_voice_over</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Text to Speech</h2>
              <p className="text-slate-400 font-medium">Convert lesson content to audio using browser speech engine</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Voice Selection</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm font-bold focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
              >
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name} className="bg-slate-900">
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1 flex justify-between">
                <span>Speech Rate</span>
                <span className="text-blue-400">{speechRate.toFixed(1)}x</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          <div className="space-y-3 mb-8">
            <div className="flex justify-between items-end">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Input Content</label>
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
                  className="cursor-pointer text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-all bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20"
                >
                  <span className="material-symbols-outlined text-sm">upload_file</span>
                  Import Document
                </label>
              </div>
            </div>
            <textarea
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              placeholder="Paste the text you want to convert into speech here..."
              className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 text-base font-medium resize-none min-h-[240px] transition-all"
            />
          </div>

          <div className="flex items-center gap-4">
            {!isSpeaking ? (
              <button
                onClick={handleSpeak}
                className="px-10 py-5 bg-blue-500 text-white font-black rounded-2xl hover:bg-blue-600 transition-all flex items-center gap-3 shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)]"
              >
                <span className="material-symbols-outlined">play_arrow</span>
                Start Speaking
              </button>
            ) : (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handlePause}
                  className="flex-1 sm:flex-none px-8 py-5 bg-white/5 text-yellow-400 font-bold rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 border border-white/10"
                >
                  <span className="material-symbols-outlined">
                    {isPaused ? "play_arrow" : "pause"}
                  </span>
                  {isPaused ? "Resume" : "Pause"}
                </button>
                <button
                  onClick={handleStop}
                  className="flex-1 sm:flex-none px-8 py-5 bg-red-500/10 text-red-400 font-bold rounded-2xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 border border-red-500/20"
                >
                  <span className="material-symbols-outlined">stop</span>
                  Stop
                </button>

                <div className="hidden sm:flex items-center gap-2 ml-4 px-6 py-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400">
                  <div className="flex gap-1.5">
                    <div className="w-1 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-1 h-5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-1 h-4 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">{isPaused ? "Paused" : "Live Output"}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Tool */}
      {activeTool === "summary" && (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-4 bg-purple-500/20 rounded-2xl">
              <span className="material-symbols-outlined text-purple-400 text-3xl">summarize</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">AI Text Summary</h2>
              <p className="text-slate-400 font-medium">Distill massive documents into strategic key points</p>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-4">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Content</label>
                <select
                  value={summaryLanguage}
                  onChange={(e) => setSummaryLanguage(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 focus:outline-none focus:border-purple-500/50"
                >
                  <option value="vi" className="bg-slate-900">Tiếng Việt</option>
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
                  className="cursor-pointer text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-all bg-purple-500/10 px-4 py-2 rounded-xl border border-purple-500/20"
                >
                  <span className="material-symbols-outlined text-sm">upload_file</span>
                  Import Document
                </label>
              </div>
            </div>
            <textarea
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
              placeholder="Paste the raw content here for AI distillation..."
              className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 text-base font-medium resize-none min-h-[300px] transition-all"
            />
          </div>

          <button
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="w-full sm:w-auto px-10 py-5 bg-purple-500 text-white font-black rounded-2xl hover:bg-purple-600 transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_-15px_rgba(168,85,247,0.3)] mb-10 disabled:opacity-50"
          >
            <span className="material-symbols-outlined">
              {isSummarizing ? "hourglass_empty" : "auto_awesome"}
            </span>
            {isSummarizing ? "Analyzing Data..." : "Generate AI Summary"}
          </button>

          {/* Result */}
          {summaryResult && (
            <div className="bg-gradient-to-br from-purple-500/10 via-white/[0.02] to-pink-500/5 border border-purple-500/20 rounded-3xl p-8 animate-in zoom-in-95 duration-700">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-400 text-base">auto_awesome</span>
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-purple-400">AI Intelligence Report</span>
                </div>
                
                <div className="flex gap-2">
                  {!isSpeaking ? (
                    <button
                      onClick={() => handleSpeak(summaryResult, summaryLanguage)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 text-purple-300 hover:text-white hover:bg-purple-500/20 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-white/10"
                    >
                      <span className="material-symbols-outlined text-sm">volume_up</span>
                      Listen
                    </button>
                  ) : (
                    <button
                      onClick={handleStop}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-300 hover:text-white hover:bg-red-500/20 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-red-500/20"
                    >
                      <span className="material-symbols-outlined text-sm">stop</span>
                      Stop
                    </button>
                  )}
                </div>
              </div>
              
              <div className="prose prose-invert max-w-none">
                <p className="text-[17px] text-slate-200 leading-[1.8] font-medium whitespace-pre-wrap">
                  {summaryResult}
                </p>
              </div>
            </div>
          )}

          {isSummarizing && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-12 h-12 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">AI is reading your document...</p>
            </div>
          )}
        </div>
      )}
    </InstructorLayout>
  );
}
