// AIChatbot.jsx
// TWO modes:
// Mode 1: Tries Gemini backend first
// Mode 2: If Gemini fails, uses smart pre-built responses
// Chatbot ALWAYS works even when Gemini quota is exhausted

import { useState, useRef, useEffect } from "react";
import api from "../api/axios";

// ── Suggestion buttons ────────────────────────────────────────────
const SUGGESTIONS = [
  { label: "🏖️ Best beach destinations", msg: "What are the best beach destinations for Australians?" },
  { label: "✈️ Cheap flight tips",        msg: "How do I find cheap international flights?"           },
  { label: "🏨 Hotel booking tips",       msg: "What should I look for when booking a hotel?"         },
  { label: "🗺️ Bali travel guide",        msg: "Give me a travel guide for Bali"                      },
  { label: "💰 Budget Europe trip",       msg: "How much does a 2 week Europe trip cost?"             },
  { label: "🛂 Visa tips",               msg: "Do Australians need a visa for Japan?"                 },
  { label: "🎒 Packing tips",            msg: "What should I pack for a tropical holiday?"            },
  { label: "🍜 Food in Tokyo",           msg: "What food should I try in Tokyo?"                      },
];

// ── Fallback responses when Gemini is unavailable ─────────────────
const FALLBACK_RESPONSES = [
  {
    keywords: ["bali", "indonesia", "ubud", "seminyak"],
    response: "Bali is amazing! 🌴 Best areas: Seminyak for nightlife, Ubud for culture, Nusa Dua for luxury. Must-see: Tanah Lot temple, Tegallalang rice terraces, Sacred Monkey Forest. Best time: April–October (dry season). Budget $50–150/day. Visa on arrival for Australians ✅. What aspect of Bali interests you most? 😊"
  },
  {
    keywords: ["tokyo", "japan", "osaka", "kyoto"],
    response: "Tokyo is incredible! 🗼 Must-visit: Shibuya crossing, Senso-ji temple, Shinjuku, Harajuku. Food: ramen, sushi, tempura, takoyaki. Get an IC card for trains. Budget $80–200/day. Visa-free for Australians up to 90 days ✅. Best time: March–May (cherry blossoms) or Oct–Nov. What would you like to know more about? 🍜"
  },
  {
    keywords: ["maldives"],
    response: "The Maldives is paradise! 🏝️ Best for overwater bungalows, snorkelling and diving. Top resorts: Velaa Private Island, Gili Lankanfushi. Budget options on local islands from $100/night. Best time: November–April. Fly via Singapore or Dubai from Australia. No visa required for Australians ✅. What's your budget range? 💙"
  },
  {
    keywords: ["paris", "france", "europe"],
    response: "Paris is magical! 🗼 Must-see: Eiffel Tower, Louvre, Montmartre, Notre Dame. Stay in Le Marais or Saint-Germain. Try croissants, crêpes and wine! Metro is cheap and easy. Budget $120–250/day. Visa-free for Australians (Schengen 90 days) ✅. Best time: April–June or Sept–Oct. Want restaurant recommendations? 🥐"
  },
  {
    keywords: ["dubai", "uae", "abu dhabi"],
    response: "Dubai is spectacular! 🏙️ Must-see: Burj Khalifa, Dubai Mall, Palm Jumeirah, Desert Safari. Best time: November–March (cooler weather). Budget $100–300/day. Visa on arrival for Australians ✅. Fly direct from Sydney/Melbourne with Emirates. Dress modestly in public areas. Want hotel recommendations? ✨"
  },
  {
    keywords: ["cheap", "budget", "affordable", "save money", "cheap flight"],
    response: "Top tips for cheap flights ✈️: 1) Book 6–8 weeks ahead 2) Use Google Flights price alerts 3) Fly Tuesday or Wednesday 4) Try Skyscanner flexible dates 5) Consider AirAsia, Scoot, Jetstar 6) Use credit card points! Also check our listings above for great package deals. Which destination are you flying to? 😊"
  },
  {
    keywords: ["hotel", "accommodation", "stay", "resort", "booking"],
    response: "Hotel booking tips 🏨: 1) Compare Booking.com, Agoda and Hotels.com 2) Read recent reviews only 3) Check cancellation policy 4) Central location saves transport costs 5) Book direct with hotel sometimes cheaper 6) Use our AI Smart Search above for real hotels with live ratings! What destination are you looking for? 🌍"
  },
  {
    keywords: ["visa", "passport", "entry", "requirement"],
    response: "Visa guide for Australians 🛂: Japan ✅ visa-free 90 days | Bali ✅ visa on arrival | Thailand ✅ visa-free 30 days | Europe ✅ Schengen 90 days | USA ⚠️ ESTA required | India ⚠️ e-Visa required | China ❌ visa required. Always verify at smartraveller.gov.au before travelling! Which country? 😊"
  },
  {
    keywords: ["pack", "packing", "luggage", "suitcase", "bring", "bag"],
    response: "Tropical packing essentials 🎒: Sunscreen SPF50+, insect repellent, light cotton clothes, sandals, swimwear, sarong (for temples), small daypack. Roll clothes to save 30% space! Leave room for souvenirs. Carry-on only for trips under 7 days saves time and money. Want destination-specific packing tips? 🌴"
  },
  {
    keywords: ["food", "eat", "restaurant", "cuisine", "try", "dish"],
    response: "Must-try foods by destination 🍜: Bali — Nasi goreng, satay, fresh juices | Tokyo — Ramen, sushi, takoyaki | Thailand — Pad Thai, green curry | Paris — Croissants, steak frites | Dubai — Shawarma, mezze. Always try local street food — cheapest and most authentic! Any specific destination? 😋"
  },
  {
    keywords: ["safe", "safety", "dangerous", "crime", "secure"],
    response: "Travel safety tips 🔒: 1) Register at smartraveller.gov.au 2) Get travel insurance — always! 3) Email yourself a passport copy 4) Use hotel safes for valuables 5) Be aware of tourist scams 6) Share itinerary with family. Bali, Japan and Europe are very safe for Australians. Which destination are you asking about? 😊"
  },
  {
    keywords: ["weather", "climate", "temperature", "rain", "season"],
    response: "Best times to visit popular destinations 🌤️: Bali — April to October (dry) | Japan — March–May or Oct–Nov | Europe — June–August | Maldives — Nov–April | Thailand — Nov–February | Dubai — November–March. Avoiding peak season also means cheaper prices! Where are you heading? 😊"
  },
];

// ── Match user message to a fallback response ─────────────────────
const getFallbackResponse = (message) => {
  const lower = message.toLowerCase();
  for (const item of FALLBACK_RESPONSES) {
    if (item.keywords.some((kw) => lower.includes(kw))) {
      return item.response;
    }
  }
  // Default response if no keywords match
  return "Great question! 🌍 I can help with destination guides, visa info, packing tips, budget planning, hotel and flight advice. Try asking about Bali, Tokyo, Paris, Dubai or the Maldives! Or use our AI Smart Search above to find real hotels. What would you like to know? 😊";
};

const AIChatbot = () => {
  const [isOpen,   setIsOpen]   = useState(false);
  const [messages, setMessages] = useState([
    {
      role:    "assistant",
      content: "Hi! I'm SafeNest AI 🌍 I can help with destination guides, visa info, packing tips, budget planning and more! What would you like to know?",
    }
  ]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showTips, setShowTips] = useState(true);
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendMessage = async (text) => {
    const msgText = text || input;
    if (!msgText.trim() || loading) return;

    setShowTips(false);
    const userMsg = { role: "user", content: msgText };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      // Mode 1: Try Gemini backend
      const res = await api.post("/api/ai/chat/", {
        message: msgText,
        history: messages.slice(-4),
      });
      if (res.data.error) throw new Error(res.data.error);
      setMessages([...updated, { role: "assistant", content: res.data.message }]);
    } catch (error) {
      // Mode 2: Gemini failed — use smart fallback response
      // User gets a helpful answer regardless of Gemini quota
      const fallback = getFallbackResponse(msgText);
      setMessages([...updated, { role: "assistant", content: fallback }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReset = () => {
    setMessages([{
      role:    "assistant",
      content: "Hi! I'm SafeNest AI 🌍 I can help with destination guides, visa info, packing tips, budget planning and more! What would you like to know?",
    }]);
    setShowTips(true);
    setInput("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">

      {isOpen && (
        <div className="mb-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: "480px" }}>

          {/* Header */}
          <div className="bg-teal-700 px-4 py-3 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-sm">🤖</div>
              <div>
                <p className="text-white text-sm font-semibold">SafeNest AI</p>
                <p className="text-teal-200 text-xs">Travel Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleReset} className="text-teal-200 hover:text-white text-xs border border-teal-500 px-2 py-1 rounded-lg transition-colors">Reset</button>
              <button onClick={() => setIsOpen(false)} className="text-white hover:text-teal-200 text-lg font-bold">×</button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">

            {/* Quick suggestion cards at start */}
            {showTips && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 text-center mb-2">Quick questions to get started:</p>
                {SUGGESTIONS.slice(0, 4).map((s) => (
                  <button key={s.label} onClick={() => sendMessage(s.msg)} className="w-full text-left text-xs bg-white border border-teal-100 text-teal-800 px-3 py-2 rounded-xl hover:bg-teal-50 transition-colors shadow-sm">
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* Chat messages */}
            {messages.map((msg, i) => (
              <div key={i} className={"flex " + (msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center text-xs mr-2 shrink-0 mt-1">🤖</div>
                )}
                <div className={"max-w-xs px-3 py-2 rounded-2xl text-sm leading-relaxed " + (msg.role === "user" ? "bg-teal-700 text-white rounded-br-sm" : "bg-white text-gray-700 border border-gray-200 rounded-bl-sm shadow-sm")}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Loading dots */}
            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center text-xs mr-2 shrink-0">🤖</div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center">
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion chips after first message */}
          {!showTips && (
            <div className="px-3 py-2 bg-white border-t border-gray-100 shrink-0">
              <div className="flex gap-1 flex-wrap">
                {SUGGESTIONS.slice(4, 7).map((s) => (
                  <button key={s.label} onClick={() => sendMessage(s.msg)} className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full hover:bg-teal-100 transition-colors border border-teal-100">
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100 flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything about travel..."
              className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="bg-teal-700 text-white px-3 py-2 rounded-xl hover:bg-teal-800 transition-colors disabled:bg-teal-300 text-sm">
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button onClick={() => setIsOpen(!isOpen)} className="w-14 h-14 bg-teal-700 hover:bg-teal-800 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all hover:scale-110">
        {isOpen ? "×" : "🤖"}
      </button>
    </div>
  );
};

export default AIChatbot;