
'use server'

import { MockupTemplateService } from '@/lib/mockup-templates/service';
import { revalidatePath } from 'next/cache';

export async function addMockupTemplate(formData: FormData) {
    try {
        const name = formData.get('name') as string;
        const imageUrl = formData.get('imageUrl') as string;

        // Config
        const top = formData.get('top') as string;
        const left = formData.get('left') as string;
        const width = formData.get('width') as string;
        const height = formData.get('height') as string; // Optional/AspectRatio

        if (!name || !imageUrl || !top || !left || !width) {
            throw new Error('Missing required fields');
        }

        await MockupTemplateService.createTemplate({
            name,
            image_url: imageUrl,
            configuration: {
                top: top + '%',
                left: left + '%',
                width: width + '%',
                aspectRatio: height ? undefined : '1 / 1' // Default if not specific
            }
        });

        revalidatePath('/admin/products');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
