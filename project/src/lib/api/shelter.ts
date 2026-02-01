import { supabase } from '@/lib/supabase/client';
import type { ShelterDog } from '@/lib/supabase/client';

export async function getShelterDogById(id: string): Promise<ShelterDog | null> {
    const { data, error } = await supabase
        .from('shelter_dogs')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) {
        console.error('Error fetching shelter dog:', error);
        return null;
    }

    return data;
}
