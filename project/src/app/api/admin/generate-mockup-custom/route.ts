
import { NextRequest, NextResponse } from 'next/server';
import { generateProductMockup } from '@/lib/ai/generation';
import { createAdminClient } from '@/lib/supabase/server';
import path from 'path';
import fs from 'fs';
import { uploadFile, getPublicUrl } from '@/lib/supabase/storage';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const templateFile = formData.get('template') as File;
        const orderId = formData.get('orderId') as string;
        const portraitId = formData.get('portraitId') as string;
        const portraitUrl = formData.get('portraitUrl') as string;

        if (!templateFile || !orderId || !portraitId || !portraitUrl) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Save Template Locally (Temp)
        const buffer = Buffer.from(await templateFile.arrayBuffer());
        const tempTemplateName = `custom_template_${Date.now()}_${templateFile.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        const tempTemplatePath = path.join(process.cwd(), 'public', 'temp', tempTemplateName);

        // Ensure temp dir exists
        const tempDir = path.dirname(tempTemplatePath);
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        fs.writeFileSync(tempTemplatePath, buffer);

        // 2. Resolve Portrait Path
        // The portraitUrl is likely a public URL. We need the local path if possible, 
        // OR prompt the generator to handle URLs (which our improved func does not yet robustly, 
        // but let's check generation.ts).
        // generation.ts: generateProductMockup accepts "portraitSource: Buffer | string".
        // If string, it checks fs.existsSync. So we need to download it if it's a URL.

        console.log(`[CustomMockup] Fetching portrait from ${portraitUrl}`);
        const res = await fetch(portraitUrl);
        if (!res.ok) throw new Error("Failed to fetch portrait");
        const portraitBuffer = Buffer.from(await res.arrayBuffer());

        // 3. Generate Mockup
        const timestamp = Date.now();
        const filename = `mockup_custom_${portraitId}_${timestamp}.png`;
        const outputDir = path.join(process.cwd(), 'public', 'generated', orderId, 'mockups');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        const localOutputPath = path.join(outputDir, filename);

        console.log(`[CustomMockup] Generating using template: ${tempTemplatePath}`);

        const resultBuffer = await generateProductMockup(
            portraitBuffer,
            'custom',
            localOutputPath,
            tempTemplatePath
        );

        // Cleanup Temp Template
        try { fs.unlinkSync(tempTemplatePath); } catch (e) { console.error("Failed to delete temp template", e); }

        if (resultBuffer) {
            // 4. Upload to Supabase (Optional if we serve from public, but consistency suggested)
            // For now, let's assume valid public path servable by Next.js
            // But we should insert into DB.
            const dbStoragePath = `generated/${orderId}/mockups/${filename}`;
            // const publicUrl = `/generated/${orderId}/mockups/${filename}`; // Local serving path

            // Upload to Supabase Storage for persistence if using cloud storage
            // (Assuming existing pattern might use local filesystem for simple serving, checking previous code indicates local serving mainly but DB references it)
            // Let's also upload to Supabase Storage 'images' bucket to be safe if that's the pattern
            // Actually, verify uploadFile logic.
            await uploadFile(dbStoragePath, resultBuffer);
            const absolutePublicUrl = getPublicUrl(dbStoragePath);

            // 5. Save to DB
            const { error } = await supabase.from('images').insert({
                order_id: orderId,
                url: absolutePublicUrl, // Use the Supabase URL or local URL? 
                // The frontend uses what's in 'url'. Pre-existing logic uses publicUrl from storage.
                storage_path: dbStoragePath,
                type: 'mockup',
                status: 'approved',
                metadata: {
                    linked_portrait_id: portraitId,
                    custom_template_name: templateFile.name
                },
                display_order: 100
            });

            if (error) throw error;

            return NextResponse.json({ success: true, url: absolutePublicUrl });
        } else {
            return NextResponse.json({ error: "Generation failed" }, { status: 500 });
        }

    } catch (e) {
        console.error("Custom Mockup API Error:", e);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return NextResponse.json({ error: (e as any).message || "Internal Error" }, { status: 500 });
    }
}
