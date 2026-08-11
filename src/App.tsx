import React, { useState, useRef, useEffect } from 'react';
import { agentTemplates, AgentTemplate } from './agent-templates';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MapPin, Globe, Loader2, Bot, Settings, Key, X, SlidersHorizontal, ChevronDown, ChevronUp, ExternalLink, Brain, Sparkles, Compass, AlertCircle, Building2, Phone, Mail, Car, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from './lib/utils';

type Citation = {
  title?: string;
  url: string;
  type?: string;
  citedText?: string;
};

type StepInfo = {
  type: 'thought' | 'google_search' | 'url_context' | string;
  text?: string;
  queries?: string[];
  url?: string;
  status?: string;
};

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
  citations?: Citation[];
  steps?: StepInfo[];
  grounding?: any;
};

type DealerProspect = {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  specialty?: string;
  notes?: string;
};

const extractDealersJSON = (text: string): DealerProspect[] => {
  if (!text) return [];
  try {
    const match = text.match(/```json:dealers\s*([\s\S]*?)\s*```/) || text.match(/```json\s*(\[\s*\{[\s\S]*?\}\s*\])\s*```/);
    if (match && match[1]) {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    // Fail silently if JSON is partial or malformed
  }
  return [];
};

const cleanMarkdownText = (text: string): string => {
  if (!text) return '';
  return text.replace(/```json:dealers\s*[\s\S]*?```/g, '').trim();
};

function DealerProspectGrid({ dealers }: { dealers: DealerProspect[] }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  if (!dealers || dealers.length === 0) return null;

  const handleCopy = (dealer: DealerProspect, idx: number) => {
    const info = `🏢 ${dealer.name}\n📍 ${dealer.address || 'N/D'}\n📞 ${dealer.phone || 'N/D'}\n✉️ ${dealer.email || 'N/D'}\n🌐 ${dealer.website || 'N/D'}\n🚗 ${dealer.specialty || 'N/D'}`;
    navigator.clipboard.writeText(info);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="mt-4 w-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
          Fichas Estructuradas de Prospección B2B ({dealers.length})
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {dealers.map((dealer, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-cyan-500/40 transition-all backdrop-blur-md flex flex-col justify-between shadow-lg relative group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-sm text-neutral-100 leading-snug">{dealer.name}</h4>
                </div>

                <button
                  onClick={() => handleCopy(dealer, idx)}
                  className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors shrink-0"
                  title="Copiar datos del prospecto"
                >
                  {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {dealer.address && (
                <div className="flex items-start gap-1.5 text-xs text-neutral-300 mb-2.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-tight">{dealer.address}</span>
                </div>
              )}

              {dealer.specialty && (
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-500/20 text-[11px] font-medium text-cyan-300">
                    <Car className="w-3 h-3 text-cyan-400" /> {dealer.specialty}
                  </span>
                </div>
              )}

              {dealer.notes && (
                <p className="text-[11px] text-neutral-400 leading-relaxed italic mb-3 bg-neutral-950/40 p-2 rounded-lg border border-neutral-800/50">
                  "{dealer.notes}"
                </p>
              )}
            </div>

            {/* Quick Action Buttons Bar */}
            <div className="pt-3 border-t border-neutral-800/60 flex flex-wrap items-center gap-2">
              {dealer.phone && (
                <a
                  href={`tel:${dealer.phone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-medium text-emerald-300 transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  <span>{dealer.phone}</span>
                </a>
              )}

              {dealer.email && (
                <a
                  href={`mailto:${dealer.email}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-xs font-medium text-blue-300 transition-colors truncate max-w-[200px]"
                  title={dealer.email}
                >
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{dealer.email}</span>
                </a>
              )}

              {dealer.website && (
                <a
                  href={dealer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-xs font-medium text-purple-300 transition-colors"
                >
                  <Globe className="w-3 h-3" />
                  <span>Web</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InteractiveMapPanel({
  dealers,
  places,
  queries
}: {
  dealers?: DealerProspect[];
  places?: Citation[];
  queries?: string[];
}) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const primaryDealer = dealers && dealers.length > 0 ? dealers[0] : null;
  const primaryPlace = places && places.length > 0 ? places[0] : null;

  const defaultQuery = selectedLocation ||
    (primaryDealer ? `${primaryDealer.name}, ${primaryDealer.address || ''}` : null) ||
    (primaryPlace ? primaryPlace.title : null) ||
    (queries && queries.length > 0 ? queries[0] : null) ||
    "España";

  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(defaultQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="mt-4 mb-3 w-full rounded-2xl bg-neutral-900/90 border border-neutral-800 overflow-hidden shadow-xl">
      <div className="px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Mapa Interactivo de Ubicaciones
          </span>
        </div>

        {selectedLocation && (
          <button
            onClick={() => setSelectedLocation(null)}
            className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
          >
            Vista general
          </button>
        )}
      </div>

      <div className="relative w-full h-[260px] sm:h-[320px] bg-neutral-950">
        <iframe
          title="Mapa de ubicaciones"
          src={embedUrl}
          className="w-full h-full border-0 rounded-b-2xl"
          loading="lazy"
          allowFullScreen
        />
      </div>

      {dealers && dealers.length > 0 && (
        <div className="p-3 bg-neutral-950/80 border-t border-neutral-800/80 flex items-center gap-2 overflow-x-auto scrollbar-thin">
          <span className="text-[11px] font-medium text-neutral-400 shrink-0">Centrar en:</span>
          {dealers.map((d, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedLocation(`${d.name}, ${d.address || ''}`)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1 border",
                selectedLocation === `${d.name}, ${d.address || ''}`
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                  : "bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800"
              )}
            >
              <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate max-w-[140px]">{d.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const isToolSupported = (toolName: 'googleSearch' | 'googleMaps' | 'urlContext', modelId: string): boolean => {
  const id = (modelId || '').toLowerCase();
  if (toolName === 'googleSearch') {
    return !id.includes('embedding') && !id.includes('imagen') && !id.includes('tts');
  }
  if (toolName === 'googleMaps' || toolName === 'urlContext') {
    return id.includes('3.6') || id.includes('3.5') || id.includes('3.1') || id.includes('3-') || id.includes('2.5') || id.includes('flash-latest');
  }
  return true;
};

// Component for rendering model thoughts
function ThoughtProcessAccordion({ thoughts }: { thoughts: StepInfo[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const thoughtContent = thoughts.map(t => t.text).filter(Boolean).join('\n\n');

  if (!thoughtContent) return null;

  return (
    <div className="mb-3 border border-indigo-500/20 bg-indigo-950/20 rounded-xl overflow-hidden backdrop-blur-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-indigo-300 hover:bg-indigo-900/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>Proceso de Razonamiento del Agente</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-indigo-400/70 uppercase tracking-wider">{isOpen ? 'Ocultar' : 'Ver pensamiento'}</span>
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200 text-indigo-400", isOpen && "rotate-180")} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3.5 pb-3 text-xs leading-relaxed text-neutral-300 border-t border-indigo-500/10 pt-2 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto"
          >
            {thoughtContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Standalone Controls Component to prevent re-creation on App re-renders
type ControlsProps = {
  selectedTemplateId: string;
  handleTemplateChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  activeTemplate: AgentTemplate;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  availableModels: any[];
  tools: {
    googleSearch: boolean;
    googleMaps: boolean;
    urlContext: boolean;
  };
  setTools: React.Dispatch<React.SetStateAction<{
    googleSearch: boolean;
    googleMaps: boolean;
    urlContext: boolean;
  }>>;
};

function ControlsContent({
  selectedTemplateId,
  handleTemplateChange,
  activeTemplate,
  selectedModel,
  setSelectedModel,
  availableModels,
  tools,
  setTools,
}: ControlsProps) {
  const searchSupported = isToolSupported('googleSearch', selectedModel);
  const mapsSupported = isToolSupported('googleMaps', selectedModel);
  const urlSupported = isToolSupported('urlContext', selectedModel);

  return (
    <>
      <div className="mb-5">
        <h2 className="text-xs uppercase tracking-widest text-neutral-500 font-semibold mb-2">Rol del Agente</h2>
        <div className="relative">
          <select
            value={selectedTemplateId}
            onChange={handleTemplateChange}
            className="w-full appearance-none bg-neutral-900/80 border border-neutral-800 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all text-neutral-200 cursor-pointer"
          >
            {agentTemplates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </div>
        </div>
      </div>

      <motion.div
        key={activeTemplate.id}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-4 backdrop-blur-sm mb-5"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
          <span className="text-xs font-medium text-cyan-400 tracking-wide uppercase">Sistema Activo</span>
        </div>
        <p className="text-xs leading-relaxed text-neutral-300">
          {activeTemplate.description}
        </p>
      </motion.div>

      <div className="mb-5">
        <h2 className="text-xs uppercase tracking-widest text-neutral-500 font-semibold mb-2">Modelo de IA</h2>
        <div className="relative">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full appearance-none bg-neutral-900/80 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all text-neutral-200 cursor-pointer"
          >
            {availableModels.length === 0 ? (
              <option value="gemini-3.6-flash">Gemini 3.6 Flash (gemini-3.6-flash)</option>
            ) : (
              availableModels.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name || model.id} ({model.id})
                </option>
              ))
            )}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xs uppercase tracking-widest text-neutral-500 font-semibold mb-2">Herramientas (Tools)</h2>
        <div className="space-y-2">
          {/* Google Search Tool */}
          <label className={cn(
            "flex items-center justify-between p-2.5 rounded-xl border transition-colors",
            searchSupported
              ? "bg-neutral-900/40 border-neutral-800/80 cursor-pointer hover:bg-neutral-800/40"
              : "bg-neutral-950/40 border-neutral-900 opacity-50 cursor-not-allowed"
          )}>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-neutral-200">Google Search</span>
                {!searchSupported && <span className="text-[10px] text-amber-500/80">No disponible en este modelo</span>}
              </div>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                disabled={!searchSupported}
                checked={tools.googleSearch && searchSupported}
                onChange={e => setTools({ ...tools, googleSearch: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-neutral-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-500"></div>
            </div>
          </label>

          {/* Google Maps Tool */}
          <label className={cn(
            "flex items-center justify-between p-2.5 rounded-xl border transition-colors",
            mapsSupported
              ? "bg-neutral-900/40 border-neutral-800/80 cursor-pointer hover:bg-neutral-800/40"
              : "bg-neutral-950/40 border-neutral-900 opacity-50 cursor-not-allowed"
          )}>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-neutral-200">Google Maps</span>
                {!mapsSupported && <span className="text-[10px] text-amber-500/80">No disponible en este modelo</span>}
              </div>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                disabled={!mapsSupported}
                checked={tools.googleMaps && mapsSupported}
                onChange={e => setTools({ ...tools, googleMaps: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-neutral-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-500"></div>
            </div>
          </label>

          {/* URL Context Tool */}
          <label className={cn(
            "flex items-center justify-between p-2.5 rounded-xl border transition-colors",
            urlSupported
              ? "bg-neutral-900/40 border-neutral-800/80 cursor-pointer hover:bg-neutral-800/40"
              : "bg-neutral-950/40 border-neutral-900 opacity-50 cursor-not-allowed"
          )}>
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-400" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-neutral-200">URL Context</span>
                {!urlSupported && <span className="text-[10px] text-amber-500/80">No disponible en este modelo</span>}
              </div>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                disabled={!urlSupported}
                checked={tools.urlContext && urlSupported}
                onChange={e => setTools({ ...tools, urlContext: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-neutral-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-500"></div>
            </div>
          </label>
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(agentTemplates[0].id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('gemini-3.6-flash');
  const [tools, setTools] = useState({
    googleSearch: false,
    googleMaps: true,
    urlContext: false,
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/models' + (apiKey ? `?apiKey=${apiKey}` : ''))
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const filtered = data.filter((m: any) => {
            const id = m.id.toLowerCase();
            const hasFlashOrLite = id.includes('flash') || id.includes('lite');
            const hasImageOrTtsOrOmniOrAudio = id.includes('image') || id.includes('live') || id.includes('tts') || id.includes('omni') || id.includes('veo') || id.includes('lyria') || id.includes('audio');
            return hasFlashOrLite && !hasImageOrTtsOrOmniOrAudio;
          });

          const getVersionNumber = (id: string): number => {
            const match = id.match(/(\d+(?:\.\d+)?)/);
            return match ? parseFloat(match[1]) : 0;
          };

          const isLatest = (id: string): boolean => {
            return id.toLowerCase().includes('latest');
          };

          const sorted = [...filtered].sort((a, b) => {
            const idA = a.id.toLowerCase();
            const idB = b.id.toLowerCase();

            const aLatest = isLatest(idA);
            const bLatest = isLatest(idB);

            // 1. Models with 'latest' come first
            if (aLatest && !bLatest) return -1;
            if (!aLatest && bLatest) return 1;

            // 2. Order from lower to higher by model version number
            const verA = getVersionNumber(idA);
            const verB = getVersionNumber(idB);

            if (verA !== verB) {
              return verA - verB;
            }

            return idA.localeCompare(idB);
          });

          if (sorted.length > 0) {
            setAvailableModels(sorted);
            if (!sorted.some((m: any) => m.id === selectedModel)) {
              const preferred = sorted.find((m: any) => m.id === 'gemini-3.6-flash' || m.id === 'gemini-flash-latest');
              if (preferred) {
                setSelectedModel(preferred.id);
              } else {
                setSelectedModel(sorted[0].id);
              }
            }
          }
        }
      })
      .catch(console.error);
  }, [apiKey]);

  const activeTemplate = agentTemplates.find(t => t.id === selectedTemplateId) || agentTemplates[0];

  // Container-only smooth scrolling that NEVER scrolls the outer window/page
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplateId(e.target.value);
    setMessages([]); // Clear chat on role change
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      let location: { latitude: number; longitude: number } | undefined = undefined;
      if (tools.googleMaps && isToolSupported('googleMaps', selectedModel) && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 2000 });
          });
          location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        } catch {
          // Geolocation optional fallback
        }
      }

      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.text,
          systemInstruction: activeTemplate.systemInstruction,
          templateId: activeTemplate.id,
          history,
          apiKey: apiKey.trim() || undefined,
          model: selectedModel,
          tools: {
            googleSearch: tools.googleSearch && isToolSupported('googleSearch', selectedModel),
            googleMaps: tools.googleMaps && isToolSupported('googleMaps', selectedModel),
            urlContext: tools.urlContext && isToolSupported('urlContext', selectedModel),
          },
          location
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        let message = text;
        try {
          const errorData = JSON.parse(text);
          message = errorData.error || text;
        } catch {
          // Fall back to raw text when the response is not JSON.
        }
        throw new Error(message || `Error fetching response (${res.status})`);
      }

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || 'Invalid JSON response from /api/chat');
      }

      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.text,
        citations: data.citations,
        steps: data.steps,
      };

      setMessages(prev => [...prev, modelMessage]);
    } catch (error: any) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `**Error:** ${error.message}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen h-[100dvh] w-full bg-neutral-950 text-neutral-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-50 overflow-hidden relative flex flex-col md:flex-row">

      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 p-6 rounded-2xl shadow-2xl relative"
            >
              <button
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white transition-colors rounded-full hover:bg-neutral-800/50"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6 text-xl font-medium">
                <Key className="w-5 h-5 text-cyan-400" />
                Configuración API
              </div>

              <p className="text-sm text-neutral-400 mb-4">
                Por defecto, la aplicación utiliza la API Key de Gemini configurada en el servidor.
                Si deseas usar tu propia clave personalizada, introdúcela a continuación.
              </p>

              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="GEMINI_API_KEY..."
                className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all text-neutral-200 placeholder:text-neutral-600 mb-6"
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-5 py-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-sm font-medium transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Top Header (< md) */}
      <div className="md:hidden shrink-0 border-b border-neutral-800/60 bg-neutral-950/80 backdrop-blur-md px-4 py-3 flex items-center justify-between z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide">Nexus<span className="text-cyan-400">AI</span></h1>
            <p className="text-[10px] text-neutral-400 truncate max-w-[140px]">{activeTemplate.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowMobilePanel(!showMobilePanel)}
            className={cn(
              "p-2 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors border",
              showMobilePanel
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                : "bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Configurar</span>
            {showMobilePanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-neutral-400 hover:text-white transition-colors rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800"
            title="Ajustes API"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Panel Drawer (< md) */}
      <AnimatePresence>
        {showMobilePanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden shrink-0 border-b border-neutral-800/80 bg-neutral-950/95 backdrop-blur-xl p-4 overflow-hidden z-20"
          >
            <ControlsContent
              selectedTemplateId={selectedTemplateId}
              handleTemplateChange={handleTemplateChange}
              activeTemplate={activeTemplate}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              availableModels={availableModels}
              tools={tools}
              setTools={setTools}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar Panel (>= md) */}
      <div className="hidden md:flex w-[320px] lg:w-[380px] h-full flex-col shrink-0 border-r border-neutral-800/50 bg-neutral-950/60 backdrop-blur-md overflow-y-auto min-h-0 z-20 p-6">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center relative overflow-hidden group">
              <Bot className="w-5 h-5 text-cyan-400 z-10 group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md" />
            </div>
            <h1 className="text-lg font-medium tracking-wide">Nexus<span className="text-cyan-400">AI</span></h1>
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-neutral-400 hover:text-white transition-colors rounded-full hover:bg-neutral-800/50"
            title="Ajustes API"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin space-y-2">
          <ControlsContent
            selectedTemplateId={selectedTemplateId}
            handleTemplateChange={handleTemplateChange}
            activeTemplate={activeTemplate}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            availableModels={availableModels}
            tools={tools}
            setTools={setTools}
          />
        </div>

      </div>

      {/* Chat Area Container */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 h-full relative z-10 overflow-hidden">

        {/* Messages Scrollable List */}
        <div
          ref={chatContainerRef}
          className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-70 p-4">
              <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 text-cyan-400 shadow-lg">
                <Bot className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-medium text-neutral-200 mb-2">Comienza una nueva conversación</h3>
              <p className="text-sm text-neutral-400 max-w-sm leading-relaxed">
                Interactúa en tiempo real con <strong className="text-cyan-400 font-medium">{activeTemplate.name}</strong>. Escribe una pregunta abajo para iniciar.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6 pb-4">
              {messages.map((msg) => {
                const dealers = msg.role === 'model' ? extractDealersJSON(msg.text) : [];
                const displayText = msg.role === 'model' ? cleanMarkdownText(msg.text) : msg.text;

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[90%] md:max-w-[85%]",
                      msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    {/* Model Thought Process (Accordion above output) */}
                    {msg.role === 'model' && msg.steps && msg.steps.some(s => s.type === 'thought') && (
                      <div className="w-full">
                        <ThoughtProcessAccordion thoughts={msg.steps.filter(s => s.type === 'thought')} />
                      </div>
                    )}

                    {/* Message Content Box */}
                    {displayText && (
                      <div
                        className={cn(
                          "px-5 py-3.5 rounded-2xl shadow-sm relative overflow-hidden w-full",
                          msg.role === 'user'
                            ? "bg-neutral-100 text-neutral-900 rounded-br-sm"
                            : "bg-neutral-900/80 border border-neutral-800 backdrop-blur-md rounded-bl-sm text-neutral-100"
                        )}
                      >
                        {msg.role === 'model' && (
                          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/50" />
                        )}

                        <div className={cn(
                          "text-[15px] leading-relaxed break-words",
                          msg.role === 'model' ? "markdown-body text-neutral-200" : ""
                        )}>
                          {msg.role === 'model' ? (
                            <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-neutral-950 prose-pre:border prose-pre:border-neutral-800 max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {displayText}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            displayText
                          )}
                        </div>
                      </div>
                    )}

                    {/* Render Structured Dealership Prospect Cards */}
                    {dealers.length > 0 && (
                      <DealerProspectGrid dealers={dealers} />
                    )}

                    {/* Render Interactive Google Map Panel */}
                    {msg.role === 'model' && (dealers.length > 0 || (msg.citations && msg.citations.some(c => c.type === 'place_citation'))) && (
                      <InteractiveMapPanel
                        dealers={dealers}
                        places={msg.citations?.filter(c => c.type === 'place_citation')}
                        queries={msg.steps?.filter(s => s.type === 'google_search').flatMap(s => s.queries || [])}
                      />
                    )}

                    {/* Execution Steps: Google Search Queries */}
                    {msg.steps && msg.steps.map((step, idx) => (
                      step.type === 'google_search' && step.queries && step.queries.length > 0 && (
                        <div key={idx} className="mt-2 text-xs text-neutral-400 flex items-center gap-1.5 ml-2">
                          <Globe className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                          <span>Búsquedas web realizadas: <strong className="text-neutral-200">{step.queries.join(', ')}</strong></span>
                        </div>
                      )
                    ))}

                    {/* Execution Steps: URL Context */}
                    {msg.steps && msg.steps.map((step, idx) => (
                      step.type === 'url_context' && step.url && (
                        <div key={idx} className="mt-2 text-xs text-neutral-400 flex items-center gap-1.5 ml-2">
                          <Compass className="w-3.5 h-3.5 text-purple-400" />
                          <span>Contexto URL cargado: <a href={step.url} target="_blank" rel="noreferrer" className="text-purple-300 underline">{step.url}</a></span>
                        </div>
                      )
                    ))}

                    {/* Google Maps Locations Cards (place_citation) */}
                    {msg.citations && msg.citations.some(c => c.type === 'place_citation') && (
                      <div className="mt-3 w-full">
                        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5 ml-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Lugares Encontrados en Google Maps:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {msg.citations.filter(c => c.type === 'place_citation').map((place, i) => (
                            <div key={i} className="p-3 rounded-xl bg-neutral-900/90 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors backdrop-blur-sm flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-semibold text-xs text-emerald-300 truncate">{place.title || 'Lugar Google Maps'}</span>
                                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                </div>
                                {place.citedText && (
                                  <p className="text-[11px] text-neutral-400 line-clamp-2 italic mb-2">"{place.citedText}"</p>
                                )}
                              </div>
                              <a
                                href={place.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors mt-1"
                              >
                                Ver en Google Maps <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Web Citations Cards (url_citation) */}
                    {msg.citations && msg.citations.some(c => c.type === 'url_citation') && (
                      <div className="mt-3 w-full">
                        <div className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5 ml-1">
                          <ExternalLink className="w-3.5 h-3.5 text-cyan-400" /> Fuentes Web Citadas:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.citations.filter(c => c.type === 'url_citation').map((cite, i) => (
                            <a
                              key={i}
                              href={cite.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800 hover:border-cyan-500/40 text-xs text-cyan-300 hover:text-cyan-200 transition-colors shadow-sm max-w-full truncate"
                              title={cite.citedText ? `Cita: "${cite.citedText}"` : cite.title}
                            >
                              <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span className="truncate max-w-[240px]">{cite.title || cite.url}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 text-neutral-400 mr-auto max-w-[85%]"
                >
                  <div className="px-5 py-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-md rounded-bl-sm relative overflow-hidden flex items-center gap-2.5">
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/50 animate-pulse" />
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span className="text-sm text-neutral-300">Generando respuesta...</span>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Input Area Bar (Flex Child at bottom - Never floating over messages) */}
        <div className="shrink-0 w-full p-3 md:p-6 bg-neutral-950/90 backdrop-blur-xl border-t border-neutral-800/60 z-20">
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"></div>
            <form
              onSubmit={sendMessage}
              className="relative bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 rounded-2xl md:rounded-3xl flex items-center p-1.5 md:p-2 shadow-2xl"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                placeholder={`Pregunta a ${activeTemplate.name}...`}
                className="flex-1 bg-transparent px-3 md:px-4 py-2 text-sm md:text-[15px] focus:outline-none text-neutral-100 placeholder:text-neutral-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl md:rounded-2xl bg-neutral-100 hover:bg-white text-neutral-950 disabled:opacity-40 disabled:bg-neutral-800 disabled:text-neutral-500 transition-all ml-1.5 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
