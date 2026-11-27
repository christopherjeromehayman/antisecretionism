'use strict';

const foods = [
  {name:'Steak',status:'in',note:'Bring on the steak. Cook with oil instead of butter.',keywords:'beef meat burger ribeye sirloin'},
  {name:'Eggs',status:'out',note:'Skip whole eggs, whites, yolks, and egg-based sauces. Check baked goods for egg wash.',keywords:'egg yolk white albumen ovalbumin powdered dried breakfast omelette mayonnaise mayo'},
  {name:'Fish & chicken',status:'in',note:'Both are welcome. Keep an eye on sauces and marinades.',keywords:'salmon tuna poultry turkey pork seafood shrimp protein'},
  {name:'Fruit & veg',status:'in',note:'A full seat at the table. Dress them with olive oil and lemon.',keywords:'vegetables fruit broccoli avocado potato potatoes apple banana greens berries'},
  {name:'Grains & beans',status:'in',note:'Rice, oats, lentils, beans, and more. Check any added extras.',keywords:'grain bean lentil chickpea oats oatmeal rice pasta nuts seeds tofu soy'},
  {name:'Plant milk',status:'in',note:'Oat, soy, almond: choose versions without eggs, dairy, or honey.',keywords:'oat milk almond milk soy milk coconut milk plant based dairy free'},
  {name:'Maple syrup',status:'in',note:'The house pick when you want something sweet.',keywords:'maple sugar syrup sweet sweetener'},
  {name:'Olive oil',status:'in',note:'For the pan, the salad, and the finishing drizzle.',keywords:'vegetable oil avocado oil coconut oil fat'},
  {name:'Milk & cream',status:'out',note:'Dairy is off the menu. That includes milk-based ingredients.',keywords:'dairy cow goat sheep milk cream whey casein lactose'},
  {name:'Butter & cheese',status:'out',note:'Dairy in another form. Ghee goes on this list, too.',keywords:'cheese butter ghee parmesan cheddar mozzarella dairy'},
  {name:'Dairy yogurt',status:'out',note:'Milk-based yogurt sits out. Plant-based versions can fit.',keywords:'yoghurt yogurt kefir dairy greek'},
  {name:'Honey',status:'out',note:'A clear house no. Check dressings, marinades, and glazes.',keywords:'honey bee bees honeycomb'},
  {name:'Beeswax',status:'out',note:'This bee-made wax can turn up on coated sweets. Look for beeswax or E901.',keywords:'beeswax bee wax e901 e 901 coating candy'},
  {name:'Shellac',status:'out',note:'This glaze comes from lac insects. Look for shellac or E904 on coated candies.',keywords:'shellac lac e904 e 904 candy glaze coating'},
  {name:'Bread',status:'check',note:'Recipes vary. Look for eggs, milk, butter, whey, or honey.',keywords:'bread toast sourdough brioche bun bakery pastry bagel'},
  {name:'Chocolate',status:'check',note:'Check the ingredients. “Dark” doesn’t settle the question.',keywords:'chocolate cocoa dark dessert sweet candy'},
  {name:'Sauces',status:'check',note:'Eggs, dairy, or honey can be part of the recipe. Ask what’s in it.',keywords:'sauce dressing marinade pesto curry glaze condiment mayonnaise mayo'},
  {name:'Granola',status:'check',note:'Some use honey; others don’t. Let the ingredients decide.',keywords:'granola cereal bar snack muesli'}
];
const labels = {in:'On the plate',out:'Off the menu',check:'Check first'};
const filters = Array.from(document.querySelectorAll('.filter'));
const search = document.getElementById('food-search');
const grid = document.getElementById('food-grid');
const count = document.getElementById('results-count');
let selectedFilter = 'all';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function renderFoods() {
  const query = search.value.trim().toLocaleLowerCase();
  const filtered = foods.filter(food => {
    const text = [food.name, food.keywords].join(' ').toLocaleLowerCase();
    return (selectedFilter === 'all' || food.status === selectedFilter) && (!query || text.includes(query));
  });
  const fragment = document.createDocumentFragment();
  filtered.forEach(food => {
    const article = element('article','food-card');
    const header = element('div','food-card-header');
    header.append(element('h3',null,food.name),element('span','status status-'+food.status,labels[food.status]));
    article.append(header,element('p',null,food.note));
    fragment.append(article);
  });
  if (!filtered.length) {
    const empty = element('div','empty-state');
    empty.append(element('strong',null,'No match on this menu.'),element('p',null,'Try another food or clear your filters. Unlisted foods don’t get an automatic yes.'));
    const reset = element('button',null,'Show all foods');
    reset.type = 'button';
    reset.addEventListener('click',() => {search.value='';setFilter('all');search.focus();});
    empty.append(reset);
    fragment.append(empty);
  }
  grid.replaceChildren(fragment);
  const suffix = selectedFilter === 'all' ? 'House rules, at a glance.' : labels[selectedFilter]+'.';
  count.textContent = filtered.length + (filtered.length === 1 ? ' food' : ' foods') + ' · ' + suffix;
}
function setFilter(filter) {
  selectedFilter = filter;
  filters.forEach(button => {
    const active = button.dataset.filter === filter;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  renderFoods();
}
filters.forEach(button => button.addEventListener('click',() => setFilter(button.dataset.filter)));
search.addEventListener('input',renderFoods);
renderFoods();

const meals = [
  {tag:'DINNER, SORTED',name:'The steak-night plate.',description:'A good steak, crisp potatoes, and something green. Finish with olive oil, lemon, and a generous handful of herbs.',ingredients:['Steak','Potatoes','Green beans','Olive oil','Lemon'],swap:'The house swap: olive oil takes the place of butter.'},
  {tag:'FROM THE PANTRY',name:'White beans on toast.',description:'Warm white beans in olive oil with garlic. Smash a few with a fork, spoon over toast, and finish with lemon and chili flakes.',ingredients:['White beans','Sourdough','Garlic','Olive oil','Lemon'],swap:'Choose bread made without eggs, dairy, or honey.'},
  {tag:'THE EVERYDAY FAVORITE',name:'The chicken rice bowl.',description:'Chicken, fluffy rice, crunchy cucumber, and a lemon-tahini dressing. Add herbs and whatever greens you have.',ingredients:['Chicken','Rice','Cucumber','Tahini','Lemon'],swap:'Mix tahini, lemon, and water for a dairy-free dressing.'},
  {tag:'OATS WITH MAPLE SYRUP',name:'The maple morning.',description:'Oats with oat milk, berries, nut butter, and a little maple syrup. A sweet start that follows the house rules.',ingredients:['Oats','Oat milk','Berries','Nut butter','Maple syrup'],swap:'Maple syrup replaces honey. Check the oat milk and nut butter labels.'}
];
const mealTabs = Array.from(document.querySelectorAll('.meal-tab'));
const mealPanel = document.getElementById('meal-panel');
const tablist = document.querySelector('.meal-selector');
tablist.setAttribute('aria-orientation','vertical');
function selectMeal(index, focusTab = false) {
  const meal = meals[index];
  mealTabs.forEach((tab,i) => {
    const selected = i === index;
    tab.classList.toggle('active',selected);
    tab.setAttribute('aria-selected',String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  mealPanel.setAttribute('aria-labelledby',mealTabs[index].id);
  document.getElementById('meal-tag').textContent=meal.tag;
  document.getElementById('meal-name').textContent=meal.name;
  document.getElementById('meal-description').textContent=meal.description;
  document.getElementById('meal-swap').textContent=meal.swap;
  document.getElementById('meal-ingredients').replaceChildren(...meal.ingredients.map(item => element('span',null,item)));
  if(focusTab) mealTabs[index].focus();
}
mealTabs.forEach((tab,index) => {
  tab.addEventListener('click',() => selectMeal(index));
  tab.addEventListener('keydown',event => {
    let next;
    if(event.key==='ArrowDown' || event.key==='ArrowRight') next=(index+1)%mealTabs.length;
    if(event.key==='ArrowUp' || event.key==='ArrowLeft') next=(index+mealTabs.length-1)%mealTabs.length;
    if(event.key==='Home') next=0;
    if(event.key==='End') next=mealTabs.length-1;
    if(next!==undefined){event.preventDefault();selectMeal(next,true);}
  });
});

const copyButton=document.getElementById('copy-preferences');
const copyStatus=document.getElementById('copy-status');
copyButton.hidden=false;
copyButton.addEventListener('click',async()=>{
  const text=document.getElementById('preference-text').textContent;
  try{
    await navigator.clipboard.writeText(text);
    copyStatus.textContent='Order note copied.';
  }catch{
    const range=document.createRange();
    range.selectNodeContents(document.getElementById('preference-text'));
    const selection=window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    copyStatus.textContent='Text selected. Use your device’s Copy command.';
  }
});
