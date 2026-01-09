'use client';

import { useState } from 'react';
import { MOCKUP_CONFIGS, MockupConfig } from '@/lib/mockup-config';
import { MockupGenerator } from '@/components/MockupEngine/MockupGenerator';
import { Sliders, Save, Upload } from 'lucide-react';

export default function MockupTunerPage() {
    const [selectedProduct, setSelectedProduct] = useState('bear');
    const [config, setConfig] = useState<MockupConfig>({ ...MOCKUP_CONFIGS['bear'] });
    const [testImage] = useState<string>('/uploads/pets/custom_dog.jpg');
    const [customTemplate, setCustomTemplate] = useState('');
    const [generatedUrl, setGeneratedUrl] = useState('');
    const [generating, setGenerating] = useState(false);

    const handleProductChange = (prod: string) => {
        setSelectedProduct(prod);
        setConfig({ ...MOCKUP_CONFIGS[prod] });
        setGeneratedUrl(''); // clear previous gen
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateStyle = (key: string, value: any) => {
        setConfig(prev => ({
            ...prev,
            style: { ...prev.style, [key]: value }
        }));
    };

    const handleSave = () => {
        console.log('Generating JSON Config for:', selectedProduct);
        console.log(JSON.stringify(config, null, 2));
        alert('Config output to console!');
    };

    const handleTestGeneration = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/admin/generate-mockup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productType: selectedProduct,
                    customTemplatePath: customTemplate || undefined, // Send if set
                    testImageUrl: testImage
                })
            });
            const data = await res.json();
            if (data.success) {
                setGeneratedUrl(data.url);
            } else {
                alert('Generation failed: ' + data.error);
            }
        } catch {
            alert('Error calling generation API');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-zinc-100 p-8">
            <header className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Sliders className="w-8 h-8 text-amber-500" />
                        Mockup Tuner
                    </h1>
                    <p className="text-zinc-500">Fine-tune product previews with photorealistic settings</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleSave} className="btn-amber flex items-center gap-2 px-6 py-3 rounded-lg font-bold">
                        <Save className="w-4 h-4" />
                        Save Configuration
                    </button>
                </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* LEFT: Controls */}
                <div className="space-y-8 h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">

                    {/* 1. Product Selector */}
                    <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 space-y-4">
                        <h2 className="font-bold text-lg text-amber-500">1. Select Product</h2>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.keys(MOCKUP_CONFIGS).map(key => (
                                <button
                                    key={key}
                                    onClick={() => handleProductChange(key)}
                                    className={`p-3 rounded-lg border text-sm transition-all ${selectedProduct === key
                                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                                        : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'}`}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* 2. Assets (Stubbed for now) */}
                    <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 space-y-4">
                        <h2 className="font-bold text-lg text-amber-500">2. Assets</h2>
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-400 font-bold uppercase">Custom Template Path (Public/)</label>
                            <input
                                value={customTemplate}
                                onChange={(e) => setCustomTemplate(e.target.value)}
                                placeholder="e.g. /assets/mockups/my_custom_mug.png"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm"
                            />
                            <p className="text-[10px] text-zinc-500">Leave empty to use default config base.</p>
                        </div>
                        <div className="p-4 border-2 border-dashed border-zinc-700 rounded-lg text-center hover:border-zinc-500 transition-colors cursor-pointer">
                            <Upload className="w-8 h-8 mx-auto text-zinc-500 mb-2" />
                            <p className="text-xs text-zinc-400">Drag & Drop Base Image (Official Printify)</p>
                        </div>
                    </section>

                    {/* 3. AI Test */}
                    <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 space-y-4">
                        <h2 className="font-bold text-lg text-amber-500">3. AI Verification</h2>
                        <p className="text-sm text-zinc-400">Test the Nano Banana integration with current settings.</p>
                        <button
                            onClick={handleTestGeneration}
                            disabled={generating}
                            className="w-full btn-teal py-3 rounded-lg font-bold disabled:opacity-50"
                        >
                            {generating ? 'Generating Composite...' : 'Generate AI Preview'}
                        </button>
                    </section>

                    {/* 4. Positioning Controls */}
                    <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 space-y-6">
                        <h2 className="font-bold text-lg text-amber-500">4. Manual Tuning (Legacy)</h2>
                        {/* Sliders kept for reference/fallback tuning */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-zinc-400 uppercase font-bold">Top Position (%)</label>
                                <input
                                    type="range" min="0" max="100" step="0.1"
                                    value={parseFloat(config.style.top)}
                                    onChange={(e) => updateStyle('top', `${e.target.value}%`)}
                                    className="w-full mt-2 accent-amber-500"
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* MIDDLE & RIGHT: Preview Canvas */}
                <div className="lg:col-span-2 bg-zinc-900 rounded-2xl border border-zinc-800 p-8 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-zinc-400">Live Preview & AI Result</h3>
                        <div className="flex gap-2">
                            {/* Toggles if needed */}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 h-full">
                        {/* Manual Preview */}
                        <div className="flex-1 flex flex-col">
                            <div className="flex-1 flex items-center justify-center bg-zinc-950/50 rounded-xl overflow-hidden relative border border-zinc-800/50 shadow-inner">
                                <div className="relative w-full max-w-lg aspect-square">
                                    <MockupGenerator
                                        productType={selectedProduct}
                                        imageUrl={testImage}
                                        configOverride={config}
                                    />
                                </div>
                            </div>
                            <div className="mt-2 text-center text-xs text-zinc-500">Manual (CSS) Preview</div>
                        </div>

                        {/* AI Result */}
                        <div className="flex-1 flex flex-col">
                            <div className="flex-1 flex items-center justify-center bg-zinc-950/50 rounded-xl overflow-hidden relative border border-zinc-800/50 shadow-inner">
                                {generatedUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={generatedUrl} alt="AI Result" className="max-w-full max-h-full object-contain" />
                                ) : (
                                    <div className="text-zinc-600 text-sm">AI Result will appear here</div>
                                )}
                            </div>
                            <div className="mt-2 text-center text-xs text-amber-500 font-bold">AI Composite Result</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
