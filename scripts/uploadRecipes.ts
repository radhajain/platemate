import { scrapingService } from '../src/services/scraping/scrapingService';

// One-time initialization script to upload recipes to Supabase.

// To run:
// npx tsc scripts/uploadRecipes.ts
// node scripts/uploadRecipes.js
async function uploadRecipes() {
	const allRecipes = await scrapingService.fetchAllRecipes();
	await scrapingService.uploadRecipesToDatabase(allRecipes);
}
uploadRecipes();
