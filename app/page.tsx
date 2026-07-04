'use client';

import { useRef, useState, useCallback } from 'react';

/* ──────────────── Types & Config ──────────────── */

type Mode = 'flerte' | 'sedutor' | 'sensual' | 'romantico' | 'safado';
type InputMode = 'image' | 'text';

interface ModeConfig {
  id: Mode;
  emoji: string;
  label: string;
  desc: string;
  color: string;
  glow: string;
  gradient: string;
}

const MODES: ModeConfig[] = [
  {
    id: 'flerte',
    emoji: '💕',
    label: 'Flerte',
    desc: 'Leve e divertido',
    color: '#ec4899',
    glow: 'rgba(236,72,153,0.25)',
    gradient: 'linear-gradient(135deg, #ec4899, #f472b6)',
  },
  {
    id: 'sedutor',
    emoji: '😏',
    label: 'Sedutor',
    desc: 'Confiante e magnético',
    color: '#a855f7',
    glow: 'rgba(168,85,247,0.25)',
    gradient: 'linear-gradient(135deg, #a855f7, #c084fc)',
  },
  {
    id: 'sensual',
    emoji: '🔥',
    label: 'Sensual',
    desc: 'Provocativo e ousado',
    color: '#f97316',
    glow: 'rgba(249,115,22,0.25)',
    gradient: 'linear-gradient(135deg, #f97316, #fb923c)',
  },
  {
    id: 'romantico',
    emoji: '🌹',
    label: 'Romântico',
    desc: 'Apaixonado e poético',
    color: '#f43f5e',
    glow: 'rgba(244,63,94,0.25)',
    gradient: 'linear-gradient(135deg, #f43f5e, #fb7185)',
  },
  {
    id: 'safado',
    emoji: '😈',
    label: 'Safado',
    desc: 'Ousado e picante',
    color: '#dc2626',
    glow: 'rgba(220,38,38,0.25)',
    gradient: 'linear-gradient(135deg, #dc2626, #ef4444)',
  },
];

/* ──────────────── Helpers ──────────────── */

function resizeImage(file: File, maxDim = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas indisponível'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Não foi possível ler a imagem'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo'));
    reader.readAsDataURL(file);
  });
}

/* ──────────────── Component ──────────────── */

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageLabel, setImageLabel] = useState('');
  const [manualText, setManualText] = useState('');
  const [mode, setMode] = useState<Mode>('flerte');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMode = MODES.find((m) => m.id === mode)!;

  const cssVars = {
    '--mode-color': currentMode.color,
    '--mode-glow': currentMode.glow,
    '--mode-gradient': currentMode.gradient,
  } as React.CSSProperties;

  const handleFile = useCallback(async (file: File) => {
    setError('');
    setImageLabel(file.name);
    try {
      const resized = await resizeImage(file);
      setImageData(resized);
    } catch {
      setError('Não foi possível processar essa imagem. Tente outro arquivo.');
    }
  }, []);

  async function handleGenerate() {
    setError('');
    setSuggestions([]);

    if (inputMode === 'image' && !imageData) {
      setError('Envie um print da conversa primeiro.');
      return;
    }
    if (inputMode === 'text' && !manualText.trim()) {
      setError('Cole o texto da conversa primeiro.');
      return;
    }

    setLoading(true);
    const accessCode =
      typeof window !== 'undefined'
        ? localStorage.getItem('estalo-access-code') || ''
        : '';

    try {
      const res = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-code': accessCode,
        },
        body: JSON.stringify({
          image: inputMode === 'image' ? imageData : undefined,
          text: inputMode === 'text' ? manualText : undefined,
          tone: mode,
          context: context.trim() || undefined,
        }),
      });

      if (res.status === 401) {
        const entered = window.prompt(
          'Este app está protegido. Digite o código de acesso:',
        );
        if (entered) {
          localStorage.setItem('estalo-access-code', entered);
          setError('Código salvo — toque em "Gerar respostas" de novo.');
        } else {
          setError('Código de acesso necessário.');
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar respostas.');
      setSuggestions(data.suggestions || []);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Erro ao gerar respostas.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string, index: number) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    });
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:py-14" style={cssVars}>
      {/* Background orbs */}
      <div
        className="bg-orb"
        style={{
          width: 400,
          height: 400,
          top: '-10%',
          right: '-10%',
          background: currentMode.color,
          opacity: 0.08,
          transition: 'background 0.8s ease',
        }}
      />
      <div
        className="bg-orb"
        style={{
          width: 300,
          height: 300,
          bottom: '10%',
          left: '-5%',
          background: currentMode.color,
          opacity: 0.05,
          transition: 'background 0.8s ease',
        }}
      />

      <div className="relative z-10 mx-auto max-w-lg">
        {/* Header */}
        <header className="mb-10 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <span
              className="text-3xl animate-pulse-glow"
              style={{ color: currentMode.color }}
            >
              ✦
            </span>
            <h1 className="font-serif text-5xl italic tracking-tight text-cream">
              Estalo
            </h1>
          </div>
          <p className="text-sm text-muted">
            seu wingman pra achar a resposta perfeita
          </p>
        </header>

        {/* ─── Mode Selector ─── */}
        <section className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
            Escolha o modo
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                id={`mode-${m.id}`}
                onClick={() => setMode(m.id)}
                className={`mode-card rounded-2xl p-4 text-left transition-all ${
                  mode === m.id
                    ? 'selected bg-surfaceLight'
                    : 'bg-surface hover:bg-surfaceLight'
                }`}
                style={
                  {
                    '--mode-color': m.color,
                    '--mode-glow': m.glow,
                    border:
                      mode === m.id
                        ? `1px solid ${m.color}40`
                        : '1px solid transparent',
                  } as React.CSSProperties
                }
              >
                <span className="mb-1 block text-2xl">{m.emoji}</span>
                <span
                  className="block text-sm font-bold"
                  style={{ color: mode === m.id ? m.color : '#f5ece6' }}
                >
                  {m.label}
                </span>
                <span className="block text-[11px] text-muted">{m.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ─── Input Mode Toggle ─── */}
        <div className="mb-5 flex rounded-full bg-surface p-1">
          <button
            type="button"
            id="input-mode-image"
            onClick={() => setInputMode('image')}
            className={`flex-1 rounded-full py-2.5 text-sm font-medium transition-all ${
              inputMode === 'image'
                ? 'text-ink shadow-lg'
                : 'text-muted hover:text-cream'
            }`}
            style={
              inputMode === 'image'
                ? { background: currentMode.gradient }
                : {}
            }
          >
            📸 Print
          </button>
          <button
            type="button"
            id="input-mode-text"
            onClick={() => setInputMode('text')}
            className={`flex-1 rounded-full py-2.5 text-sm font-medium transition-all ${
              inputMode === 'text'
                ? 'text-ink shadow-lg'
                : 'text-muted hover:text-cream'
            }`}
            style={
              inputMode === 'text'
                ? { background: currentMode.gradient }
                : {}
            }
          >
            💬 Texto
          </button>
        </div>

        {/* ─── Input Area ─── */}
        {inputMode === 'image' ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            className="mb-6 flex h-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-surface text-center transition-all"
            style={{
              borderColor: dragActive
                ? currentMode.color
                : imageData
                ? `${currentMode.color}40`
                : '#3d2a4a',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              id="file-upload"
              onChange={(e) =>
                e.target.files?.[0] && handleFile(e.target.files[0])
              }
            />
            {imageData ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageData}
                alt={imageLabel}
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <>
                <span className="mb-2 text-3xl">⬆️</span>
                <p className="px-4 text-sm text-muted">
                  Toque ou arraste o print da conversa
                </p>
              </>
            )}
          </div>
        ) : (
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Cole aqui a conversa..."
            rows={6}
            id="text-input"
            className="mb-6 w-full rounded-2xl border bg-surface p-4 text-sm text-cream placeholder:text-faint focus:outline-none transition-all"
            style={{
              borderColor: '#3d2a4a',
            }}
          />
        )}

        {/* ─── Extra Context ─── */}
        <input
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Algo que a IA devia saber? (opcional)"
          id="context-input"
          className="mb-6 w-full rounded-2xl border bg-surface p-3.5 text-sm text-cream placeholder:text-faint focus:outline-none transition-all"
          style={{ borderColor: '#3d2a4a' }}
        />

        {/* ─── Generate Button ─── */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          id="generate-button"
          className="btn-generate mb-8 w-full rounded-2xl py-3.5 font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: loading ? '#3d2a4a' : currentMode.gradient,
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-1">
              <span>Gerando</span>
              <span className="loading-dot">.</span>
              <span className="loading-dot">.</span>
              <span className="loading-dot">.</span>
            </span>
          ) : (
            <span>✦ Gerar respostas no modo {currentMode.label}</span>
          )}
        </button>

        {/* ─── Error ─── */}
        {error && (
          <div className="mb-6 animate-fade-in rounded-2xl border border-rose/30 bg-rose/10 p-4 text-center">
            <p className="text-sm text-rose">{error}</p>
          </div>
        )}

        {/* ─── Suggestions ─── */}
        {suggestions.length > 0 && (
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
              Sugestões {currentMode.emoji}
            </p>
            <div className="space-y-3">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  id={`suggestion-${i}`}
                  onClick={() => copyToClipboard(s, i)}
                  className="suggestion-card w-full rounded-2xl border border-line bg-surface p-5 text-left transition-all"
                >
                  <p className="text-sm leading-relaxed text-cream">{s}</p>
                  <p
                    className="mt-3 text-xs font-medium"
                    style={{
                      color:
                        copiedIndex === i ? '#22c55e' : currentMode.color,
                    }}
                  >
                    {copiedIndex === i ? '✓ Copiado!' : '📋 Toque para copiar'}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ─── Footer ─── */}
        <footer className="mt-12 pb-6 text-center">
          <p className="text-[11px] text-faint">
            feito com ✦ por Estalo · powered by AI
          </p>
        </footer>
      </div>
    </main>
  );
}
