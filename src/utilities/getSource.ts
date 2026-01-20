// Extract source from URL for brand label
export const getSource = (url: string) => {
	try {
		const hostname = new URL(url).hostname.replace('www.', '');
		// Map common sites to friendly names
		const siteNames: Record<string, string> = {
			'loveandlemons.com': 'Love & Lemons',
			'allrecipes.com': 'AllRecipes',
			'bonappetit.com': 'Bon Appetit',
			'seriouseats.com': 'Serious Eats',
			'food52.com': 'Food52',
			'epicurious.com': 'Epicurious',
			'cooking.nytimes.com': 'NY Times Cooking',
		};
		return siteNames[hostname] || hostname.split('.')[0].toUpperCase();
	} catch {
		return 'RECIPE';
	}
};
