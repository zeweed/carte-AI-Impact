import { Download, Upload, Image as ImageIcon, Sparkles } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

type CardRank = 'J' | 'Q' | 'K' | 'A' | 'Joker';
const suits = ['♠', '♥', '♦', '♣'];

const ranksConfig: Record<CardRank, { nickname: string, color: string }> = {
  J: { nickname: 'Le Valet', color: '#1D4ED8' },
  Q: { nickname: 'La Reine', color: '#3B82F6' },
  K: { nickname: 'Le Roi', color: '#60A5FA' },
  A: { nickname: "L'As", color: '#3B82F6' },
  Joker: { nickname: 'Le Joker', color: '#8B5CF6' },
};

export default function App() {
  const [name, setName] = useState('');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [cardRank, setCardRank] = useState<CardRank>('K');
  const [cardSuit, setCardSuit] = useState('♠');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Randomize card on mount
  useEffect(() => {
    const ranks: CardRank[] = ['J', 'Q', 'K', 'A', 'Joker'];
    const randomRank = ranks[Math.floor(Math.random() * ranks.length)];
    const randomSuit = suits[Math.floor(Math.random() * suits.length)];
    setCardRank(randomRank);
    setCardSuit(randomSuit);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `carte-ai-impact-${name.replace(/\s+/g, '-').toLowerCase() || 'joueur'}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawPoster = (img?: HTMLImageElement) => {
      const width = 1080;
      const height = 1080;
      const config = ranksConfig[cardRank];

      // 1. Poster Background
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#070707';
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, 800);
      // Joker uses a purple tint, others use blue
      glow.addColorStop(0, cardRank === 'Joker' ? 'rgba(139, 92, 246, 0.4)' : 'rgba(29, 78, 216, 0.4)');
      glow.addColorStop(1, 'rgba(7, 7, 7, 1)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Noise or grid texture (simulated with some lines)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      for (let i = 0; i < height; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
      }

      // 2. Card Base & Clip
      const cardW = 760;
      const cardH = 960;
      const cardX = (width - cardW) / 2; // 160
      const cardY = 60;

      ctx.save();
      
      // Draw shadow for the card
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 60;
      ctx.shadowOffsetY = 30;
      ctx.shadowOffsetX = 0;
      ctx.fillStyle = '#111'; // Base dark color in case image doesn't load fully
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 40);
      ctx.fill();
      
      // Start clipping for photo and internal elements
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.clip();

      // 3. Photo Area (Full Card)
      if (img) {
        const imgRatio = img.width / img.height;
        const targetRatio = cardW / cardH;
        let sW = img.width;
        let sH = img.height;
        let sx = 0; let sy = 0;

        if (imgRatio > targetRatio) {
          sW = sH * targetRatio;
          sx = (img.width - sW) / 2;
        } else {
          sH = sW / targetRatio;
          sy = (img.height - sH) / 2;
        }

        ctx.drawImage(img, sx, sy, sW, sH, cardX, cardY, cardW, cardH);
      } else {
        // Placeholder pattern if no image
        const pt = ctx.createLinearGradient(cardX, cardY, cardX+cardW, cardY+cardH);
        pt.addColorStop(0, '#111');
        pt.addColorStop(1, '#050505');
        ctx.fillStyle = pt;
        ctx.fillRect(cardX, cardY, cardW, cardH);
      }

      // Top Gradient (for readability of corners and top icon)
      const topGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + 250);
      topGrad.addColorStop(0, 'rgba(0,0,0,0.6)');
      topGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(cardX, cardY, cardW, 250);

      // Bottom Gradient (for the big title and nicknames)
      const botGrad = ctx.createLinearGradient(cardX, cardY + cardH - 350, cardX, cardY + cardH);
      botGrad.addColorStop(0, 'rgba(0,0,0,0)');
      botGrad.addColorStop(0.5, 'rgba(7,7,7,0.85)');
      botGrad.addColorStop(1, '#070707');
      ctx.fillStyle = botGrad;
      ctx.fillRect(cardX, cardY + cardH - 350, cardW, 350);

      // Card inner border (optional, for premium feel)
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 40);
      ctx.stroke();

      // 4. Card Decorations & Texts
      ctx.fillStyle = config.color;

      // Top Left Corner
      ctx.font = 'bold 74px "Space Grotesk"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if ('letterSpacing' in ctx) { (ctx as any).letterSpacing = '-2px'; }
      const rankStr = cardRank === 'Joker' ? '★' : cardRank;
      ctx.fillText(rankStr, cardX + 70, cardY + 80);
      if ('letterSpacing' in ctx) { (ctx as any).letterSpacing = '0px'; }
      
      ctx.font = '48px "Space Grotesk"';
      const suitStr = cardRank === 'Joker' ? '★' : cardSuit;
      ctx.fillText(suitStr, cardX + 70, cardY + 134);

      // Bottom Right Corner (Rotated)
      ctx.save();
      ctx.translate(cardX + cardW - 70, cardY + cardH - 80);
      ctx.rotate(Math.PI);
      ctx.font = 'bold 74px "Space Grotesk"';
      if ('letterSpacing' in ctx) { (ctx as any).letterSpacing = '-2px'; }
      ctx.fillText(rankStr, 0, 0);
      if ('letterSpacing' in ctx) { (ctx as any).letterSpacing = '0px'; }
      ctx.font = '48px "Space Grotesk"';
      ctx.fillText(suitStr, 0, 54);
      ctx.restore();

      // Center Top Symbol
      ctx.save();
      ctx.translate(cardX + cardW / 2, cardY + 80);
      ctx.scale(25, 25);
      ctx.fillStyle = config.color;
      ctx.beginPath();
      if (cardRank === 'K') { // Crown
        ctx.moveTo(-1, -0.4); ctx.lineTo(-0.6, 0.4); ctx.lineTo(0, -0.7);
        ctx.lineTo(0.6, 0.4); ctx.lineTo(1, -0.4); ctx.lineTo(0.8, 1);
        ctx.lineTo(-0.8, 1); ctx.fill();
      } else if (cardRank === 'Q') { // Gem
        ctx.moveTo(0, -1); ctx.lineTo(0.8, -0.3); ctx.lineTo(0, 1);
        ctx.lineTo(-0.8, -0.3); ctx.fill();
      } else if (cardRank === 'J') { // Lightning
        ctx.moveTo(0.3, -1); ctx.lineTo(-0.5, 0.2); ctx.lineTo(0.1, 0.2);
        ctx.lineTo(-0.3, 1); ctx.lineTo(0.5, -0.2); ctx.lineTo(-0.1, -0.2); ctx.fill();
      } else if (cardRank === 'A') { // Star
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(Math.cos((18+i*72)*Math.PI/180), -Math.sin((18+i*72)*Math.PI/180));
          ctx.lineTo(0.4*Math.cos((54+i*72)*Math.PI/180), -0.4*Math.sin((54+i*72)*Math.PI/180));
        }
        ctx.fill();
      } else { // Joker Flame
        ctx.moveTo(0, 0.8);
        ctx.bezierCurveTo(1.5, 0.8, 1, -0.5, 0, -1.2);
        ctx.bezierCurveTo(-1, -0.5, -1.5, 0.8, 0, 0.8);
        ctx.fill();
      }
      ctx.restore();

      // 5. Main Title: AI IMPACT CHALLENGE 2.0
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const titleGradient = ctx.createLinearGradient(cardX + cardW/2 - 300, 0, cardX + cardW/2 + 300, 0);
      titleGradient.addColorStop(0, '#60A5FA');
      titleGradient.addColorStop(1, '#1D4ED8');
      
      ctx.font = 'bold 72px "Space Grotesk"';
      if ('letterSpacing' in ctx) { (ctx as any).letterSpacing = '1px'; }
      ctx.fillStyle = titleGradient;
      ctx.shadowColor = 'rgba(29, 78, 216, 0.5)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 4;
      
      // Adjusting font size to fit "AI IMPACT"
      ctx.fillText('AI IMPACT', cardX + cardW / 2, cardY + cardH - 190);
      
      ctx.font = 'bold 56px "Space Grotesk"';
      if ('letterSpacing' in ctx) { (ctx as any).letterSpacing = '6px'; }
      ctx.fillText('CHALLENGE 2.0', cardX + cardW / 2, cardY + cardH - 120);
      
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      if ('letterSpacing' in ctx) { (ctx as any).letterSpacing = '0px'; }
      
      // 6. User Identity (e.g. "Le Roi", "La Reine")
      ctx.font = '300 28px "Inter"';
      if ('letterSpacing' in ctx) { (ctx as any).letterSpacing = '8px'; }
      ctx.fillStyle = '#EFEFEF';
      
      // Optionally adding Name + Rank e.g., "ELISE DUBOIS — LA REINE"
      const dName = (name || '').trim().toUpperCase();
      const identityText = dName ? `${dName}  //  ${config.nickname.toUpperCase()}` : config.nickname.toUpperCase();
      
      ctx.fillText(identityText, cardX + cardW / 2, cardY + cardH - 55);
      if ('letterSpacing' in ctx) { (ctx as any).letterSpacing = '0px'; }

      // 7. Footer text inside card
      ctx.font = '400 11px "Inter"';
      if ('letterSpacing' in ctx) { (ctx as any).letterSpacing = '1px'; }
      ctx.fillStyle = '#555555';
      ctx.fillText('par Divin Setondji', cardX + cardW / 2, cardY + cardH - 20);
      if ('letterSpacing' in ctx) { (ctx as any).letterSpacing = '0px'; }

      // End card clip
      ctx.restore();

    };

    document.fonts.ready.then(() => {
      if (imageSrc) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => drawPoster(img);
        img.src = imageSrc;
      } else {
        drawPoster();
      }
    });

  }, [name, imageSrc, cardRank, cardSuit]);

  return (
    <div className="min-h-screen bg-black-pure text-white font-sans flex flex-col md:flex-row overflow-hidden">
      {/* Left Column: Form Controls */}
      <div className="w-full md:w-[420px] lg:w-[480px] shrink-0 border-b md:border-b-0 md:border-r border-[#1a1a1a] p-8 md:p-12 flex flex-col justify-center bg-[#070707] z-10 shadow-2xl overflow-y-auto">
        <div className="mb-10">
          <div className="inline-flex items-center justify-center p-2 bg-blue-electric/10 text-blue-glow rounded-lg mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="font-display font-bold text-3xl mb-2 text-white/95">
            Carte AI Impact 2.0
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Rejoins le jeu. Ta carte collectionnable t'a été attribuée aléatoirement : <strong>{ranksConfig[cardRank].nickname}</strong> de {cardSuit}. Crée ton poster !
          </p>
        </div>

        <div className="space-y-8 flex-1">
          {/* Photo Upload */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              1. Ta meilleure photo (format vertical de préférence)
            </label>
            <div className="relative group cursor-pointer">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                title="Choisir une photo"
              />
              <div className={`relative w-full h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-200 z-10
                ${imageSrc ? 'border-blue-electric/50 bg-blue-electric/5' : 'border-gray-800 bg-[#0a0a0a] group-hover:border-gray-600 group-hover:bg-[#111]'}
              `}>
                {imageSrc ? (
                  <>
                    <ImageIcon className="w-8 h-8 text-blue-glow mb-2" />
                    <span className="text-sm font-medium text-blue-glow">Photo intégrée !</span>
                    <span className="text-xs text-gray-500 mt-1">
                      Cliquer pour changer
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-500 mb-2 group-hover:text-gray-400 transition-colors" />
                    <span className="text-sm font-medium text-gray-400 group-hover:text-gray-300">Uploader une photo</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-3">
            <label htmlFor="nameInput" className="block text-sm font-medium text-gray-300">
              2. Ton prénom ou pseudo
            </label>
            <div className="relative">
              <input
                id="nameInput"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Élise Dubois"
                maxLength={20}
                className="w-full bg-[#0a0a0a] border border-gray-800 text-white placeholder-gray-600 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-electric/50 focus:border-blue-electric/80 transition-all font-medium"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-8 mt-8 border-t border-gray-800/50">
          <button
            onClick={handleDownload}
            className="w-full bg-blue-electric hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl shadow-[0_0_20px_rgba(29,78,216,0.4)] hover:shadow-[0_0_30px_rgba(29,78,216,0.6)] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            <span>Télécharger ma carte</span>
          </button>
        </div>
      </div>

      {/* Right Column: Preview Area */}
      <div className="flex-1 bg-[#050505] flex items-center justify-center p-8 md:p-12 relative">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(30, 58, 138, 0.15) 0%, transparent 60%)' }}></div>
        
        {/* Realtime Canvas Frame */}
        <div className="relative w-full max-w-[600px] aspect-square mx-auto shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
          <canvas
            ref={canvasRef}
            width={1080}
            height={1080}
            className="w-full h-full object-contain block transform rounded-xl ring-1 ring-white/10 shadow-[0_0_80px_rgba(30,58,138,0.3)]"
          />
        </div>
      </div>
    </div>
  );
}

