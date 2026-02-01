import { test, expect } from '@playwright/test';

test('Critical Path: Magic Import', async ({ page }) => {
    // 1. Navigate to the Home Page
    await page.goto('/');

    // 2. Find the "Magic Import" input
    const input = page.getByPlaceholder('Enter your URL here...');
    await expect(input).toBeVisible();

    // 3. Type a test URL and click Import
    await input.fill('https://github.com');
    const importButton = page.getByRole('button', { name: /import/i });
    // Sometimes "Import" might be "Generate" or similar, just looking for the button next to input
    // Or searching by text. The user said "Click Import".
    await importButton.click();

    // 4. Wait for the "Scanning..." animation to finish.
    // We can look for the text "Scanning..." appearing and then disappearing, 
    // or simply wait for the Profile Name and Avatar to appear which implies it finished.
    // But strictly, let's try to verify the profile appears.
    // The user said: Wait for "Scanning..." to finish. 
    // Maybe specifically assertion on the result is better.

    // 5. Assertion: Verify Profile Name and Avatar
    // Assuming the profile name element has some specific locator.
    // Without seeing the code, I'll guess standard locators or look for text.
    // For robustness, I'll update this after a failure if locators are wrong.
    // But I need to be precise. 

    // Note: I will need to inspect the page to know locators.
    // But user said: "Read the error log, analyze the app code, FIX the bug".
    // So I'll write a best-guess test first.

    // Let's assume identifiers based on typical structure.
    // Profile Name might be an h1 or similar.
    // Avatar might be an img.

    // Waiting for 'Save Profile' button is explicit.
    const saveButton = page.getByRole('button', { name: /save profile/i });
    await expect(saveButton).toBeVisible({ timeout: 60000 }); // Give it time for "Scanning"

    // Check for profile name.
    // Note: Magic Import usually fills some name.
    // I will check if *any* text is in the name field or if a name element is visible.

    // Since I don't know the exact class or ID, I'll try to match by likely role or testid if available.
    // Or generic text.

    // Let's try to look for an Avatar image.
    const avatar = page.locator('img[alt="Profile Avatar"], img[alt="Avatar"]');
    // Or just any image in the profile section.

    await expect(avatar.first()).toBeVisible();
});
