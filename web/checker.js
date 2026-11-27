export function inspect(input) {
  const text=input.toLowerCase().replace(/[’']/g,"'").replace(/[-‐‑]/g,' ').trim();
  if(!text) return 'Paste the ingredient list first.';
  const [ingredients,...advisories]=text.split(/\b(?:may (?:also )?contain(?: traces of)?|made in (?:a |the )?facility|processed (?:in|on)|manufactured (?:in|on)|made on shared equipment)\b/);
  const exceptions=/\b(?:cocoa|cacao|shea|sunflower(?: seed)?|apple|peanut|almond|cashew|seed|nut) butter\b|\b(?:coconut|oat|almond|soy|rice|pea|cashew|hemp|plant) (?:milk|cream|butter|yogurt|cheese)\b|\b(?:cream of tartar|butternut squash|butter beans|milk thistle|honeydew|honeycrisp|honey locust|egg free|egg replacer|vegan (?:mayo(?:nnaise)?|aioli)|milk free|dairy free|honey free)\b/g;
  const terms=/\b(?:eggs?|eggwhites?|eggyolks?|albumen|ovalbumin|ovomucoid|milk(?:fat|powder| solids?)?|buttermilk|butter(?:fat|milk|oil)?|cream|ghee|cheese|cheddar|parmesan|mozzarella|yog[h]?urt|whey|casein(?:ates?)?|lactose|kefir|honey(?:comb)?|royal jelly|beeswax|shellac|e\s?90[14])\b/g;
  const hits=s=>[...new Set(s.replace(exceptions,' ').match(terms)||[])];
  const found=hits(ingredients), advisory=hits(advisories.join(' '));
  const main=found.length?'Listed ingredient or declaration: '+found.join(', ')+'.':'No tracked ingredient names found in the ingredient text.';
  const eggQuestion=/\b(?:mayo(?:nnaise)?|aioli|meringue|albumin|lecithin|lysozyme)\b/.test(ingredients.replace(exceptions,' ').replace(/\b(?:soy|sunflower) lecithin\b/g,' '))?' Check the ingredient source with the maker for possible egg.':'';
  const unclear=/\b(?:flavou?r(?:ing)?s?|glaze|shortening|margarine)\b/.test(ingredients)?' Ask the maker about unspecified flavors, glazes or fats.':'';
  return main+(advisory.length?' Advisory mentions '+advisory.join(', ')+'. Confirm cross-contact with the maker.':'')+eggQuestion+unclear+' Check the full, current package. This word search cannot establish allergy safety.';
}
if(typeof document!=='undefined'){
  document.querySelector('#check-form')?.addEventListener('submit',e=>{
    e.preventDefault();document.querySelector('#result').textContent=inspect(document.querySelector('#ingredients').value);
  });
}
