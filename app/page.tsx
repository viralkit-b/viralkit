'use client';

import React, { useCallback, useState } from "react";
import { Check, Copy, Loader2, Sparkles } from "lucide-react";

type FeatureType = "instagram_captions" | "viral_hashtags" | "reel_hooks";

const FEATURES: { id: FeatureType; label: string; tagline: string }[] = [
  { id: "instagram_captions", label: "Instagram Captions", tagline: "Magnetic, scroll-stopping caption sets." },
  { id: "viral_hashtags", label: "Viral Hashtags", tagline: "Niche-smart, reach-boosting hashtag clusters." },
  { id: "reel_hooks", label: "Reel Hooks", tagline: "Thumb-stopping hooks for the first 3 seconds." },
];

export default function HomePage() {
  const [feature, setFeature] = useState<FeatureType>("instagram_captions");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    if (!prompt.trim()) {
      setError("Please describe what you're posting first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult("");
    setCopied(false);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, featureType: feature }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const raw = await response.text();
      let data: { result?: string; error?: string } | null = null;
      if (raw) {
        try {
          data = JSON.parse(raw) as { result?: string; error?: string };
        } catch {
          setError("Invalid response from server. Please try again.");
          return;
        }
      }

      if (!response.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      const text = typeof data?.result === "string" ? data.result.trim() : "";
      if (!text) {
        setError("No content was generated. Try adding more detail to your description.");
        return;
      }
      setError(null);
      setResult(text);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (isAbort) {
        setError("Request timed out. Please try again.");
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setError(
          msg.includes("fetch") || msg.includes("network")
            ? "Network error. Check your connection and try again."
            : "Something went wrong. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [prompt, feature]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard. Please copy manually.");
    }
  }, [result]);

  const currentFeature = FEATURES.find((f) => f.id === feature);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        {/* Header */}
        <header className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            AI Social Growth Studio
          </div>
          <h1 className="mt-5 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Turn <span className="brand-gradient bg-clip-text text-transparent">ideas</span> into viral{" "}
            <span className="brand-gradient bg-clip-text text-transparent">content</span>
          </h1>
          <p className="mt-3 text-sm text-slate-400 sm:text-base">
            World-class AI strategist for captions, hashtags, and reel hooks.
          </p>
        </header>

        {/* Feature Tabs */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {FEATURES.map((item) => {
            const isActive = item.id === feature;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  setFeature(item.id);
                  setError(null);
                }}
                className={`
                  relative rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300
                  ${isActive
                    ? "bg-gradient-to-r from-cyan-500/90 via-sky-500/90 to-violet-500/90 text-slate-900 shadow-lg shadow-cyan-500/25"
                    : "glass-panel border border-slate-600/50 text-slate-300 hover:border-slate-500 hover:text-white"
                  }
                `}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        {currentFeature && (
          <p className="text-center text-xs uppercase tracking-wider text-slate-500">
            {currentFeature.tagline}
          </p>
        )}

        {/* Main Card - Input + Generate */}
        <section className="glass-panel relative overflow-hidden rounded-3xl border border-slate-600/40 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {error && (
            <div
              className="mb-5 rounded-xl border border-rose-500/40 bg-rose-950/80 px-4 py-3 text-sm font-medium text-rose-100 shadow-inner"
              role="alert"
            >
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate(e);
            }}
            className="space-y-6"
          >
            <div className="relative">
              <label htmlFor="prompt" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Describe what you&apos;re posting
              </label>
              <div className="input-glow relative rounded-2xl p-[1px]">
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  placeholder="e.g. 30-second fitness reel for beginners, bold and motivational"
                  className="textarea-glow w-full resize-none rounded-2xl border-0 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-generate group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-8 py-3.5 text-sm font-semibold text-slate-900 shadow-xl transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Generating…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 transition-transform group-hover:scale-110" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Result Card */}
        <section className="min-h-[200px]">
          {isLoading && (
            <div className="glass-panel flex flex-col items-center justify-center rounded-3xl border border-slate-600/50 px-6 py-12">
              <div className="relative">
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400" />
                <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-cyan-400" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-200">Creating your content…</p>
              <p className="mt-1 text-xs text-slate-500">Usually takes a few seconds</p>
            </div>
          )}

          {!isLoading && result && (
            <div
              className="result-card glass-panel flex flex-col rounded-3xl border border-slate-600/50 p-6 shadow-xl sm:p-8"
              role="region"
              aria-label="Generated result"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Result</p>
                  <p className="text-sm font-medium text-slate-200">{currentFeature?.label}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-600/60 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:border-cyan-500/50 hover:bg-slate-700/80"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-cyan-400" />
                      <span>Copy to Clipboard</span>
                    </>
                  )}
                </button>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
              <div className="mt-4 overflow-y-auto">
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-slate-100">
                  {result}
                </pre>
              </div>
            </div>
          )}

          {!isLoading && !result && (
            <div className="glass-panel flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-600/50 px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-400">Your result will appear here</p>
              <p className="mt-2 max-w-sm text-xs text-slate-500">
                Choose a feature, describe your content, and click <strong className="text-cyan-400">Generate</strong>.
              </p>
            </div>
          )}
        </section>

        <p className="text-center text-xs text-slate-600">
          Ensure <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-slate-500">GROQ_API_KEY</code> is set in .env.local for AI generation.
        </p>
      </div>
    </main>
  );
}
