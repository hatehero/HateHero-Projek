import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Copy, Download, RefreshCw, Zap, Check } from 'lucide-react';
import { generateProductAnalysis, generateImagePreview } from './services/ai';

type BackgroundOption = 
  | 'PC gaming room (meja kaca review)'
  | 'Kedai motosikal (meja kaca review)'
  | 'Kedai aksesori kereta (meja kaca review)'
  | 'Kedai tools / gadget (meja kaca review)'
  | 'Auto AI vibe match ikut produk';

type BrandModeOption = 'LELAKI' | 'PEREMPUAN';

interface AiResult {
  category: string;
  personality: string;
  mode: string;
  hook: string;
  script1: string;
  script2: string;
  script3: string;
  script4: string;
  imagePrompt: string;
}

export default function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [background, setBackground] = useState<BackgroundOption>('PC gaming room (meja kaca review)');
  const [brandMode, setBrandMode] = useState<BrandModeOption>('LELAKI');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const backgrounds: BackgroundOption[] = [
    'PC gaming room (meja kaca review)',
    'Kedai motosikal (meja kaca review)',
    'Kedai aksesori kereta (meja kaca review)',
    'Kedai tools / gadget (meja kaca review)',
    'Auto AI vibe match ikut produk'
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
    }
  };

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        let encoded = reader.result?.toString() || '';
        // Remove data URL prefix e.g., data:image/png;base64,
        const parts = encoded.split(',');
        if (parts.length > 1) {
           encoded = parts[1];
        }
        resolve(encoded);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleGenerate = async () => {
    if (!imageFile) return;

    setIsGenerating(true);
    setAiResult(null);
    setGeneratedImageUrl(null);

    try {
      const base64Data = await getBase64(imageFile);
      const mimeType = imageFile.type;

      // Brand mode text for the prompt
      const brandModeText = brandMode === 'LELAKI' 
        ? "Lelaki: Hoodie hitam dengan tulisan logo (text) Hate⚡Hero OFFICIAL yang SANGAT BESAR dan JELAS. Mask hitam + sunglasses + snapback Gaya backward"
        : "Perempuan: Baju kurung dengan pilihan hijab bawal atau pashmina diperbuat daripada fabrik seperti satin dan chiffon, serta memakai mask putih. Oversized frame glasses (transparent frame). Wall branding 'Dings Collection'";

      // Generate text data
      const durationMode = brandMode === 'PEREMPUAN' ? '10s' : '8s';
      const analysisOutput = await generateProductAnalysis(base64Data, mimeType, background, brandModeText, durationMode);
      setAiResult(analysisOutput);

      // Generate image in parallel with the same output if we had a way, but since we need imagePrompt from analysis...
      // we'll run it sequentially or use a simplified prompt. Given analysis output gives the prompt, we'll wait for it.
      
      const newImageUrl = await generateImagePreview(base64Data, mimeType, analysisOutput.imagePrompt);
      setGeneratedImageUrl(newImageUrl);

    } catch (err: any) {
      console.error(err);
      let errorMessage = 'Error evaluating product. Check the console or try again.';
      const errorStr = (err.message || '').toString() + JSON.stringify(err);
      
      if (errorStr.includes('403') || errorStr.includes('PERMISSION_DENIED')) {
        errorMessage = 'Permission Denied (403): Please check your Gemini API Key in the application settings.';
      } else if (errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED') || errorStr.includes('quota')) {
        errorMessage = 'Quota Exceeded (429): You have exceeded your Gemini API quota. Please try again later or check your billing plan.';
      }
      
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePromptText = () => {
    if (!aiResult) return '';

    const isPerempuan = brandMode === 'PEREMPUAN';
    const durationText = isPerempuan ? '10-second' : '8-second';

    // Timeline based on duration mode
    const angle1Time = isPerempuan ? '(0.0–2.0s)' : '(0.0–1.5s)';
    const angle2Time = isPerempuan ? '(2.0–4.0s)' : '(1.5–3.0s)';
    const angle3Time = isPerempuan ? '(4.0–7.0s)' : '(3.0–5.0s)';
    const angle4Time = isPerempuan ? '(7.0–10.0s)' : '(5.0–8.0s)';

    return `${durationText} front-facing influencer product review animation
Vertical 9:16 | realistic | full-frame | Seamless loop-ready (ending ≈ opening frame)
VOICE:
(${brandMode === 'LELAKI' ? 'Lelaki' : 'Perempuan'})
(Nada santai Melayu)
ABSOLUTE PRODUCT IMAGE LOCK — NON-NEGOTIABLE:
MODE: IMAGE-TO-IMAGE ONLY
REFERENCE STRENGTH: 95–100%
STRUCTURE PRESERVATION: MAXIMUM
Product in original image is FINAL OBJECT
DO NOT redraw | DO NOT re-render | DO NOT enhance | DO NOT clean
DO NOT fix product lighting | DO NOT change product angle
DO NOT change product color | DO NOT remove packaging/labels/plastic
DO NOT remove small components | DO NOT change relative arrangement
AI ONLY ALLOWED TO:
Change background, add depth of field, add environmental lighting
Add influencer (face & upper body) interacting naturally with product
STRICT VISUAL RULES:
Front-facing review
Hands placement natural
Face and upper body visible
No text | No subtitles | No UI | No watermark
SMART CINEMATIC CAMERA MODE:
ANGLE 1 — HERO FRONT SHOT ${angle1Time}
Say: ${aiResult.script1}
ANGLE 2 — PRODUCT LIFT CLOSE ${angle2Time}
Say: ${aiResult.script2}
ANGLE 3 — ROTATE DETAIL ${angle3Time}
Say: ${aiResult.script3}
ANGLE 4 — PULL BACK RESET ${angle4Time}
Say: ${aiResult.script4}
NEGATIVE PROMPT:
studio render, cgi product, 3d model, hyper realistic render, over sharpen, hdr effect, glow effect, lens flare, sales tone, robotic voice, spec reading, product rotation, extra objects, screen UI, text overlay, fast cuts, transitions, mutated fingers`;
  };

  const promptText = generatePromptText();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(promptText);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-fuchsia-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[50%] bg-cyan-600/20 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="absolute inset-0 bg-grid pointer-events-none" />

      {/* Header */}
      <header className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-fuchsia-500 to-cyan-500 p-1.5 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Hatehero UGC Conversion</h1>
          </div>
          <div className="text-xs font-mono text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2.5 py-1 rounded-full">ENGINE V1.0</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-8 grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Input Column */}
        <div className="xl:col-span-4 space-y-6 relative z-10">
          <div className="bg-zinc-900/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">Input Data</h2>
            
            {/* Image Upload */}
            <div className="mb-6">
              <label 
                htmlFor="image-upload" 
                className="group relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-zinc-700 hover:border-fuchsia-500 bg-zinc-950/50 rounded-xl cursor-pointer transition-all overflow-hidden hover:shadow-[0_0_30px_rgba(217,70,239,0.1)]"
              >
                {imagePreviewUrl ? (
                  <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-30 transition-opacity" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-zinc-500 group-hover:text-fuchsia-400 transition-colors" />
                    <p className="mb-2 text-sm text-zinc-300 font-medium">Upload produk fizikal</p>
                    <p className="text-xs text-zinc-500">JPEG, PNG up to 10MB</p>
                  </div>
                )}
                {imagePreviewUrl && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium border border-white/10 text-white">Ganti Gambar</span>
                  </div>
                )}
                <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>

            {/* Background Selection */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Background Vibe</label>
              <div className="space-y-2">
                {backgrounds.map((bg) => (
                  <label key={bg} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${background === bg ? 'bg-gradient-to-r from-fuchsia-500/10 to-transparent border-fuchsia-500/50 text-fuchsia-50' : 'bg-zinc-950/50 border-white/5 hover:border-zinc-700 text-zinc-400'}`}>
                    <input type="radio" name="bg" value={bg} checked={background === bg} onChange={() => setBackground(bg as BackgroundOption)} className="sr-only" />
                    <span className="text-sm font-medium">{bg}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Brand Mode Selection */}
            <div className="mb-8">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Brand Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {(['LELAKI', 'PEREMPUAN'] as const).map((mode) => (
                  <label key={mode} className={`flex justify-center items-center py-3.5 rounded-xl border cursor-pointer font-bold tracking-wide transition-all ${brandMode === mode ? 'bg-gradient-to-r from-cyan-500 to-blue-500 border-transparent text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'bg-zinc-950/50 border-white/5 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'}`}>
                    <input type="radio" name="mode" value={mode} checked={brandMode === mode} onChange={() => setBrandMode(mode)} className="sr-only" />
                    {mode}
                  </label>
                ))}
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={!imageFile || isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:opacity-90 text-white py-4 rounded-xl font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current" />
                  Convert to UGC
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Area */}
        <div className="xl:col-span-8 flex flex-col md:flex-row gap-6 relative z-10">
          
          <AnimatePresence>
            {(isGenerating || aiResult) && (
              <motion.div 
                key="text-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 space-y-6"
              >
                {/* Text Output */}
                <div className="bg-zinc-900/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-6 shadow-2xl h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                      <Copy className="w-4 h-4" /> 
                      Single Block Video Prompt
                    </h2>
                    {aiResult && (
                      <button 
                        onClick={copyToClipboard}
                        className={`text-xs font-semibold border flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
                          isCopied 
                            ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30' 
                            : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Copied!
                          </>
                        ) : (
                          "Copy Block"
                        )}
                      </button>
                    )}
                  </div>

                  {isGenerating && !aiResult ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-4 min-h-[300px]">
                      <RefreshCw className="w-8 h-8 animate-spin text-fuchsia-500" />
                      <div className="font-mono text-xs tracking-widest uppercase">Analyzing product & generating style...</div>
                    </div>
                  ) : (
                    <div className="bg-zinc-950/80 inset-shadow-sm border border-white/5 rounded-xl p-5 flex-1 h-[600px] overflow-y-auto custom-scrollbar">
                      <pre className="text-[12px] leading-relaxed font-mono text-cyan-50/80 whitespace-pre-wrap">
                        {promptText}
                      </pre>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {(isGenerating || generatedImageUrl) && (
              <motion.div 
                key="image-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="w-full md:w-[360px] flex-shrink-0"
              >
                <div className="bg-zinc-900/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden h-[600px] md:h-full lg:h-[730px] flex flex-col">
                  <div className="flex z-10 relative items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-fuchsia-400 uppercase tracking-widest flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> 
                      Image Preview
                    </h2>
                    {generatedImageUrl && (
                      <a 
                        href={generatedImageUrl} 
                        download="ugc-preview.png"
                        className="text-xs bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 p-2 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <div className="flex-1 bg-zinc-950 rounded-xl overflow-hidden relative group border border-white/5">
                    {isGenerating && !generatedImageUrl ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-4 bg-zinc-950">
                        <div className="w-24 h-24 rounded-full border-[3px] border-cyan-500/20 border-t-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-spin" />
                        <div className="mt-4 font-mono text-xs font-semibold tracking-widest text-cyan-400 animate-pulse">RENDERING...</div>
                      </div>
                    ) : generatedImageUrl ? (
                      <img 
                        src={generatedImageUrl} 
                        alt="UGC Image Preview" 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isGenerating && !aiResult && !generatedImageUrl && (
            <div className="flex-1 xl:col-span-8 flex flex-col items-center justify-center border-2 border-dashed border-white/5 bg-zinc-900/20 rounded-2xl min-h-[400px]">
              <div className="p-6 bg-zinc-900/50 rounded-3xl mb-6 shadow-inner border border-white/5">
                <Zap className="w-12 h-12 text-zinc-700" />
              </div>
              <h3 className="text-lg font-bold text-zinc-300 mb-2">Engine is Ready</h3>
              <p className="text-zinc-500 text-sm font-medium">Upload image and select settings to begin</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
