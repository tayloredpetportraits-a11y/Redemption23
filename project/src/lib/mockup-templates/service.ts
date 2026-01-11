
import { createAdminClient } from '../supabase/server';

export interface MockupTemplate {
    id: string;
    name: string;
    image_url: string;
    configuration: {
        top: string;
        left: string;
        width: string;
        aspectRatio?: string;
        transform?: string;
    };
    is_active: boolean;
}

export class MockupTemplateService {

    static async getTemplates(): Promise<MockupTemplate[]> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('mockup_templates')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) {
            console.error('Failed to fetch templates:', error);
            return [];
        }

        return data as MockupTemplate[];
    }

    static async createTemplate(template: Omit<MockupTemplate, 'id' | 'is_active'>) {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('mockup_templates')
            .insert({
                name: template.name,
                image_url: template.image_url,
                configuration: template.configuration
            })
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }
}
