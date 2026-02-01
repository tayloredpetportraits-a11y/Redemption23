/* eslint-disable */
'use client';

import { useRef, useState } from 'react';
import ImageComponent from 'next/image';
import { Download, Instagram, Check } from 'lucide-react';
import { toBlob } from 'html-to-image';
import { saveAs } from 'file-saver';
import type { Image as ImageType } from '@/lib/supabase/client';
import { updateSocialConsent } from '@/app/actions/orders';

export default function SocialShareCard({
  original,
  generated,
  petName,
  orderId
}: {
  original?: string | null;
  generated: ImageType;
  petName: string;
  orderId: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [handle, setHandle] = useState('');
  const [consent, setConsent] = useState(false);
  const [savedConsent, setSavedConsent] = useState(false);

  const handleSaveConsent = async () => {
    if (!consent) return;
    await updateSocialConsent(orderId, consent, handle);
    setSavedConsent(true);
  };

  const handleDownloadSocial = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const blob = await toBlob(cardRef.current, { quality: 0.95, pixelRatio: 2 });
      if (blob) {
        saveAs(blob, `${petName}-Transformation.png`);
      }
    } catch (err) {
      console.error('Failed to generate social card', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="py-12 bg-black border-t border-slate-900">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-8">Share the Transformation</h2>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8">

          {/* The Shareable Card Element (Hidden/Visible wrapper) */}
          <div className="relative group">
            {/* This div is what gets captured in the screenshot */}
            <div
              ref={cardRef}
              className="relative w-[320px] h-[400px] bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="bg-black text-white p-3 text-center font-serif text-sm tracking-widest uppercase">
                From Photo to Masterpiece
              </div>

              {/* Split View */}
              <div className="flex-1 flex relative">
                {/* Original (Left) */}
                <div className="w-1/2 relative bg-slate-100 border-r border-white/20">
                  {original ? (
                    <ImageComponent src={original} alt="Original" fill className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-slate-400">No Photo</div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded">Before</div>
                </div>

                {/* Generated (Right) */}
                <div className="w-1/2 relative">
                  <ImageComponent src={generated.url} alt=" AI Art" fill className="object-cover" />
                  <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded">After</div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-white p-3 flex justify-between items-center">
                <div className="text-left">
                  <div className="font-bold text-slate-900 text-sm">@{petName}'s New Look</div>
                  <div className="text-[10px] text-slate-500">Taylored Pet Portraits</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <img src="/logo.gif" alt="Logo" className="w-6 h-6 object-contain" />
                </div>
              </div>
            </div>

            {/* Hover Actions */}
            <div className="absolute -right-16 top-0 flex flex-col gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleDownloadSocial}
                disabled={isGenerating}
                className="w-12 h-12 bg-white text-black rounded-full shadow-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
                title="Download for Instagram"
              >
                {isGenerating ? <span className="animate-spin">⏳</span> : <Instagram className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Context / Instructions */}
          <div className="text-left max-w-xs space-y-6">
            <div>
              <h3 className="text-white font-bold text-lg mb-2">Step 1: Download & Share</h3>
              <p className="text-slate-400 text-sm mb-4">
                Download the "Before & After" card and share it on Instagram.
              </p>
              <button
                onClick={handleDownloadSocial}
                className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold text-sm w-full shadow-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                {isGenerating ? 'Generating...' : 'Download Image'}
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                Step 2: Get Featured <span className="bg-brand-blue text-[10px] px-2 py-0.5 rounded text-white">OPTIONAL</span>
              </h3>
              <p className="text-slate-400 text-xs mb-4">
                Allow us to repost {petName} on our official page.
              </p>

              {!savedConsent ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="@your_instagram_handle"
                    className="w-full bg-black border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-brand-blue outline-none"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                  />
                  <label className="flex items-start gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="mt-1 w-4 h-4 rounded border-slate-600 bg-black text-brand-blue focus:ring-brand-blue"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    />
                    <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                      I agree to let Taylored Pet Portraits feature this image.
                    </span>
                  </label>
                  <button
                    onClick={handleSaveConsent}
                    disabled={!consent}
                    className={`w-full py-2 rounded-lg font-bold text-xs transition-colors ${consent ? 'bg-brand-blue text-white hover:bg-brand-blue/90' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                  >
                    Confirm Consent
                  </button>
                </div>
              ) : (
                <div className="text-green-400 text-sm flex items-center gap-2 font-bold bg-green-400/10 p-3 rounded-lg border border-green-400/20">
                  <Check className="w-4 h-4" /> You're all set!
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
