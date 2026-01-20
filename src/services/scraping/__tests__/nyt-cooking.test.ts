import { NYTCooking } from '../nyt-cooking';

const sampleNYTHtml = `
<div class="recipe pagecontent_recipe-wrap__om4h5">
  <div class="recipeintro_header-container__AsNGE">
    <div class="recipeintro_header-block__ir83A">
      <header class="header_header__euVJG">
        <h1 class="pantry--title-display">Chicken and Herb Salad With Date-Lime Dressing</h1>
        <div class="byline_byline__om_mu">
          <h2 class="pantry--ui-strong byline_bylinePart__ysgt2">By <a href="/author/pete-wells">Pete Wells</a></h2>
        </div>
        <p class="pantry--ui">Published Jan. 19, 2026</p>
      </header>
    </div>
    <div class="recipeintro_image-block__FFKL4">
      <figure class="recipeheaderimage_recipeHeaderImage__dFEBk">
        <img alt="Chicken and Herb Salad With Date-Lime Dressing"
             class="recipeheaderimage_image__1NgvN"
             src="https://static01.nyt.com/images/2026/01/16/multimedia/chicken-salad-hfcp/chicken-salad-hfcp-jumbo.jpg">
      </figure>
    </div>
  </div>

  <div class="recipeintro_stats-block__3ftYO">
    <dl class="stats_statsTable__1f3pU">
      <div class="stats_cookingTimeTable__b0moV">
        <dt class="pantry--ui-strong">Total Time</dt>
        <dd class="pantry--ui">1 hour 15 minutes</dd>
        <dt class="pantry--ui-sm stats_displayTimeLabel__J_tsf">Prep Time</dt>
        <dd class="pantry--ui-sm stats_displayTimeTextPrint__81b2P">25 minutes</dd>
        <dt class="pantry--ui-sm stats_displayTimeLabel__J_tsf">Cook Time</dt>
        <dd class="pantry--ui-sm stats_displayTimeTextPrint__81b2P">50 minutes</dd>
      </div>
      <dt class="pantry--ui-strong">Rating</dt>
      <dd class="pantry--ui stats_ratingInfo__J5GTs">
        <span class="stats_avgRating__nell8">5</span>
        <span>(14)</span>
      </dd>
    </dl>
  </div>

  <div class="recipeintro_topnote-block__qCT8n">
    <div class="topnote_topnote__jH8tN">
      <div class="pantry--body topnote_topnoteParagraphs__A3OtF">
        <p><i>This recipe is featured in a four-part series about creating healthier eating habits.</i></p>
      </div>
    </div>
  </div>

  <div class="recipebody_ingredients-block__OFg5G">
    <div class="ingredients_ingredients__FLjsC">
      <h2 class="pantry--title-section-alternate">Ingredients</h2>
      <div class="ingredients_recipeYield__DN65p">
        <span class="pantry--ui-strong">Yield:</span>
        <span class="pantry--ui">4 servings as a main course</span>
      </div>
      <ul>
        <h3 class="pantry--label ingredientgroup_name__xNtpC">For the Salad</h3>
        <ul>
          <li class="pantry--ui ingredient_ingredient__rfjvs">
            <span class="ingredient_quantity__Z_Mvw">1</span>
            <span>boneless, skinless chicken breast (about 8 ounces)</span>
          </li>
          <li class="pantry--ui ingredient_ingredient__rfjvs">
            <span class="ingredient_quantity__Z_Mvw">2½</span>
            <span>cups chicken broth</span>
          </li>
          <li class="pantry--ui ingredient_ingredient__rfjvs">
            <span class="ingredient_quantity__Z_Mvw">½</span>
            <span>pound peeled and deveined raw shrimp (optional)</span>
          </li>
          <li class="pantry--ui ingredient_ingredient__rfjvs">
            <span class="ingredient_quantity__Z_Mvw">1</span>
            <span>pound king oyster mushrooms</span>
          </li>
        </ul>
        <h3 class="pantry--label ingredientgroup_name__xNtpC">For the Dressing</h3>
        <ul>
          <li class="pantry--ui ingredient_ingredient__rfjvs">
            <span class="ingredient_quantity__Z_Mvw">⅔</span>
            <span>cup lime juice (from 4 to 5 limes)</span>
          </li>
          <li class="pantry--ui ingredient_ingredient__rfjvs">
            <span class="ingredient_quantity__Z_Mvw">4</span>
            <span>garlic cloves, coarsely chopped</span>
          </li>
          <li class="pantry--ui ingredient_ingredient__rfjvs">
            <span>Sea salt, to taste</span>
          </li>
        </ul>
      </ul>
    </div>
  </div>

  <div class="recipebody_prep-block__FegRB">
    <h2 class="pantry--title-section-alternate">Preparation</h2>
    <ol class="preparation_stepList___jqWa">
      <li class="preparation_step__nzZHP">
        <div class="pantry--ui-lg-strong preparation_stepNumber__qWIz4">Step 1</div>
        <div class="preparation_stepContent__CFrQM">
          <p class="pantry--body-long">Start the salad: In a small saucepan, cover the chicken with broth.</p>
        </div>
      </li>
      <li class="preparation_step__nzZHP">
        <div class="pantry--ui-lg-strong preparation_stepNumber__qWIz4">Step 2</div>
        <div class="preparation_stepContent__CFrQM">
          <p class="pantry--body-long">While the chicken cooks, if using the raw shrimp, cover them with water.</p>
        </div>
      </li>
      <li class="preparation_step__nzZHP">
        <div class="pantry--ui-lg-strong preparation_stepNumber__qWIz4">Step 3</div>
        <div class="preparation_stepContent__CFrQM">
          <p class="pantry--body-long">Make the dressing: Using an immersion blender, blend all the ingredients.</p>
        </div>
      </li>
    </ol>
  </div>
</div>
`;

describe('NYT Cooking Scraper', () => {
	describe('parseRecipeFromHtml', () => {
		it('should parse recipe name', () => {
			const recipe = NYTCooking.parseRecipeFromHtml(sampleNYTHtml);
			expect(recipe.name).toBe(
				'Chicken and Herb Salad With Date-Lime Dressing'
			);
		});

		it('should parse image URL', () => {
			const recipe = NYTCooking.parseRecipeFromHtml(sampleNYTHtml);
			expect(recipe.image).toContain('static01.nyt.com');
			expect(recipe.image).toContain('chicken-salad');
		});

		it('should parse rating', () => {
			const recipe = NYTCooking.parseRecipeFromHtml(sampleNYTHtml);
			expect(recipe.ratingAvg).toBe(5);
			expect(recipe.ratingCount).toBe(14);
		});

		it('should parse times', () => {
			const recipe = NYTCooking.parseRecipeFromHtml(sampleNYTHtml);
			expect(recipe.prepTime).toBe('25 minutes');
			expect(recipe.cookTime).toBe('50 minutes');
		});

		it('should parse servings', () => {
			const recipe = NYTCooking.parseRecipeFromHtml(sampleNYTHtml);
			expect(recipe.servings).toContain('4 servings');
		});

		it('should parse ingredients', () => {
			const recipe = NYTCooking.parseRecipeFromHtml(sampleNYTHtml);
			expect(recipe.ingredients).toBeDefined();
			expect(recipe.ingredients?.length).toBeGreaterThan(0);
			// Check for specific ingredients
			expect(recipe.ingredients?.some((i) => i.includes('chicken breast'))).toBe(
				true
			);
			expect(recipe.ingredients?.some((i) => i.includes('lime juice'))).toBe(
				true
			);
			expect(recipe.ingredients?.some((i) => i.includes('garlic'))).toBe(true);
		});

		it('should parse instructions', () => {
			const recipe = NYTCooking.parseRecipeFromHtml(sampleNYTHtml);
			expect(recipe.instructions).toBeDefined();
			expect(recipe.instructions?.length).toBe(3);
			expect(recipe.instructions?.[0]).toContain('Start the salad');
			expect(recipe.instructions?.[2]).toContain('Make the dressing');
		});

		it('should parse notes', () => {
			const recipe = NYTCooking.parseRecipeFromHtml(sampleNYTHtml);
			expect(recipe.notes).toContain('four-part series');
		});

		it('should have null dietary_tags (to be filled by Claude)', () => {
			const recipe = NYTCooking.parseRecipeFromHtml(sampleNYTHtml);
			expect(recipe.dietary_tags).toBeNull();
		});
	});
});
