'use server';

import { createAdminClient } from "@/lib/supabase/server";
import { generateSinglePortrait } from "@/lib/ai/generation";
import path from "path";
import fs from "fs";
import { revalidatePath } from "next/cache";

export async function approveImage(imageId: string) {
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('images')
        .update({ status: 'approved' })
        .eq('id', imageId);

    if (error) {
        throw new Error(`Failed to approve image: ${error.message}`);
    }

    // Revalidate the gallery page
    // We don't have the orderId easily here without fetching, but usually this is called from the page
    // We can return success and let client refresh, or fetch orderId to revalidate.
    // Let's fetch orderId just to be safe for revalidation if needed, or rely on client router.refresh()
    return { success: true };
}

export async function rejectAndRegenerate(imageId: string, reason?: string) {
    const supabase = createAdminClient();

    // 1. Fetch Image & Order Details
    const { data: image, error: imageError } = await supabase
        .from('images')
        .select('*')
        .eq('id', imageId)
        .single();

    if (imageError || !image) {
        throw new Error("Image not found");
    }

    if (image.type !== 'primary') {
        throw new Error("Can only regenerate portraits, not mockups yet.");
    }

    // Mark as rejected
    await supabase.from('images').update({ status: 'rejected' }).eq('id', imageId);

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', image.order_id)
        .single();

    if (orderError || !order) {
        throw new Error("Order not found");
    }

    // 2. Prepare for Regeneration
    const templatePath = image.template_id;
    if (!templatePath) {
        // Fallback or Error? 
        // If old images don't have template_id, we can't regenerate EXACTLY.
        // We could pick a random one from the same theme? 
        // For now, let's throw/log and maybe fallback to a generic error message to user.
        throw new Error("Cannot regenerate this image (missing template source).");
    }

    // Resolve Pet Photo
    // TODO: Extract this resolution logic from generation.ts to avoid duplication?
    // For now, copying strictly for speed as it's small.
    let petBuffer: Buffer;
    const petPhotoUrl = order.pet_image_url;
    if (!petPhotoUrl) throw new Error("No pet image found on order");

    const localPublicPath = path.join(process.cwd(), 'public', petPhotoUrl);

    try {
        if (fs.existsSync(localPublicPath)) {
            petBuffer = fs.readFileSync(localPublicPath);
        } else if (fs.existsSync(petPhotoUrl)) {
            petBuffer = fs.readFileSync(petPhotoUrl);
        } else {
            const res = await fetch(petPhotoUrl);
            if (!res.ok) throw new Error(`Failed to fetch ${petPhotoUrl}`);
            petBuffer = Buffer.from(await res.arrayBuffer());
        }
    } catch (e) {
        console.error("Failed to resolve pet photo:", e);
        throw new Error("Failed to load pet photo");
    }

    // 3. Construct Prompt
    const petBreed = order.pet_breed || '';
    const petDetails = order.pet_details || '';
    const petLabel = petBreed ? `the ${petBreed}` : 'the dog';

    let prompt = `Reasoning Task: Look at the reference image. Identify ${petLabel}'s unique features (eyes, snout, markings). Look at the template image. Replace the animal in the template with ${petLabel} from the reference. Keep the costume and background exactly as they are.`;
    if (petDetails) prompt += ` Ensure these features are visible: ${petDetails}.`;

    // Add "Try again" emphasis? "Previous attempt was rejected."
    // Maybe increased adherence? For now, stick to standard prompt.

    // 4. Generate
    console.log(`[Regen] Regenerating image for order ${order.id}, slot ${image.display_order}`);
    const filename = `regen_${image.display_order}_${Date.now()}.png`;

    // Ensure templatePath is valid (if it was relative, verify; if absolute, verify)
    // generation.ts stores absolute paths now.

    const result = await generateSinglePortrait(
        order.id,
        templatePath,
        petBuffer,
        prompt,
        filename
    );

    if (result) {
        // 5. Insert New Record
        const { error: insertError } = await supabase.from('images').insert({
            order_id: order.id,
            url: result.url,
            storage_path: result.storagePath,
            type: 'primary', // It's still a portrait
            display_order: image.display_order, // Keep same slot
            theme_name: image.theme_name,
            is_bonus: image.is_bonus,
            status: 'approved', // Auto-approve the regeneration? Or 'pending_review'? 
            // User said: "trigger a regeneration so we can see if it will get it right this time."
            // Probably 'pending_review' or 'approved' depending on workflow. 
            // If the user (customer) is rejecting, the new one should probably be 'approved' effectively *for them to see*, 
            // OR it should be 'pending_review' but the UI needs to show it.
            // Actually, if the customer is doing this, the new image should appear for them to Approve/Reject again.
            // So status 'pending' (which usually implies Admin Review in some systems, but here 'pending_review' might mean Customer Review?).
            // Let's check `StepOneGallery.tsx` again or `client.ts`.
            // `status: 'pending_review' | 'approved' | 'rejected';`
            // If the customer is seeing the gallery, they likely see 'approved' (by admin) images?
            // Actually, "Customer Gallery" usually implies the result is ready.
            // If the user *is* the customer, they are "approving" it for printing?
            // The prompt says "Customer Gallery".
            // If I set it to 'pending_review', does it show up?
            // I need to check `StepOneGallery` logic (it takes `images` prop).
            // Usually the parent component filters.

            // Re-reading StepOneGallery.tsx: It just iterates `images`.
            // So I should set it to whatever state allows it to be fetched by the parent.
            // I'll set it to 'pending_review' as a safe default, assuming the parent fetches everything or filters.
            // But if the previous one was 'approved' by admin and now customer rejects...
            // Let's stick to 'pending_review' so they can approve it again.
            template_id: templatePath
        });

        if (insertError) {
            console.error("Failed to insert regen image:", insertError);
            throw new Error("Failed to save regenerated image");
        }

        revalidatePath(`/order/${order.id}`); // hypothetical path
        return { success: true, newImageUrl: result.url };
    } else {
        throw new Error("Regeneration failed to produce an image.");
    }
}
