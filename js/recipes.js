/* Honey Bee Helper — honey home-remedy recipes: data + cards + filter +
 * detail modal + image lightbox. Photos are freely licensed images from
 * Wikimedia Commons (see PHOTOS below); each is credited in the footer.
 *
 * NOTE: general wellness / traditional home-remedy info — NOT medical advice.
 */
(function () {
  "use strict";

  // Freely licensed photos from Wikimedia Commons (credited in the footer).
  var PHOTOS = {
    "hero": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Honey_miele.jpg/960px-Honey_miele.jpg", title: "Honey miele.jpg", page: "https://commons.wikimedia.org/wiki/File:Honey_miele.jpg", author: "Marcobeltrametti", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0" },
    "lemon-soother": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Basic_Lemon_Tea_%282%29.jpg/960px-Basic_Lemon_Tea_%282%29.jpg", title: "Basic Lemon Tea (2).jpg", page: "https://commons.wikimedia.org/wiki/File:Basic_Lemon_Tea_(2).jpg", author: "TAPAS KUMAR HALDER", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0" },
    "ginger-tea": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Ginger_Tea_.jpg/960px-Ginger_Tea_.jpg", title: "Ginger Tea .jpg", page: "https://commons.wikimedia.org/wiki/File:Ginger_Tea_.jpg", author: "Trupti.gauns", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0" },
    "thyme-cough-syrup": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Thyme-Bundle.jpg/960px-Thyme-Bundle.jpg", title: "Thyme-Bundle.jpg", page: "https://commons.wikimedia.org/wiki/File:Thyme-Bundle.jpg", author: "Evan-Amos", license: "CC0", licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en" },
    "golden-milk": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Golden_turmeric_latte_-_Hello_My_Moon_2024-04-07.jpg/960px-Golden_turmeric_latte_-_Hello_My_Moon_2024-04-07.jpg", title: "Golden turmeric latte - Hello My Moon 2024-04-07.jpg", page: "https://commons.wikimedia.org/wiki/File:Golden_turmeric_latte_-_Hello_My_Moon_2024-04-07.jpg", author: "Andy Li", license: "CC0", licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en" },
    "acv-gargle": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/02023_0257_Apple_cider_vinegar.jpg/960px-02023_0257_Apple_cider_vinegar.jpg", title: "02023 0257 Apple cider vinegar.jpg", page: "https://commons.wikimedia.org/wiki/File:02023_0257_Apple_cider_vinegar.jpg", author: "Silar", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0" },
    "black-pepper": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Tellicherry_Black_Peppercorns.jpg/960px-Tellicherry_Black_Peppercorns.jpg", title: "Tellicherry Black Peppercorns.jpg", page: "https://commons.wikimedia.org/wiki/File:Tellicherry_Black_Peppercorns.jpg", author: "Misterneedlemouse", license: "CC0", licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en" },
    "sage-gargle": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Salvia_officinalis_p1150381.jpg/960px-Salvia_officinalis_p1150381.jpg", title: "Salvia officinalis p1150381.jpg", page: "https://commons.wikimedia.org/wiki/File:Salvia_officinalis_p1150381.jpg", author: "David Monniaux", license: "CC BY-SA 3.0", licenseUrl: "http://creativecommons.org/licenses/by-sa/3.0/" },
    "onion-syrup": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Red_Onion_on_White.JPG/960px-Red_Onion_on_White.JPG", title: "Red Onion on White.JPG", page: "https://commons.wikimedia.org/wiki/File:Red_Onion_on_White.JPG", author: "Colin", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0" },
    "licorice-tea": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Sections_of_liquorice_root.jpg/960px-Sections_of_liquorice_root.jpg", title: "Sections of liquorice root.jpg", page: "https://commons.wikimedia.org/wiki/File:Sections_of_liquorice_root.jpg", author: "Salil Kumar Mukherjee", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0" },
    "marshmallow-tea": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Althea_officinalis_flor.jpg/960px-Althea_officinalis_flor.jpg", title: "Althea officinalis flor.jpg", page: "https://commons.wikimedia.org/wiki/File:Althea_officinalis_flor.jpg", author: "Unknown", license: "CC BY-SA 3.0", licenseUrl: "http://creativecommons.org/licenses/by-sa/3.0/" },
    "ginger-shot": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Fresh_Ginger.JPG/960px-Fresh_Ginger.JPG", title: "Fresh Ginger.JPG", page: "https://commons.wikimedia.org/wiki/File:Fresh_Ginger.JPG", author: "Miansari66", license: "Public domain", licenseUrl: "" },
    "garlic-paste": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Garlic_bulbs_and_cloves.jpg/960px-Garlic_bulbs_and_cloves.jpg", title: "Garlic bulbs and cloves.jpg", page: "https://commons.wikimedia.org/wiki/File:Garlic_bulbs_and_cloves.jpg", author: "Ivar Leidus", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0" },
    "elderberry-syrup": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Reife_Holunderbeeren.JPG/960px-Reife_Holunderbeeren.JPG", title: "Reife Holunderbeeren.JPG", page: "https://commons.wikimedia.org/wiki/File:Reife_Holunderbeeren.JPG", author: "Dellex", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0" },
    "cinnamon-tea": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Gewuerze_004_2024_08_10.jpg/960px-Gewuerze_004_2024_08_10.jpg", title: "Gewuerze 004 2024 08 10.jpg", page: "https://commons.wikimedia.org/wiki/File:Gewuerze_004_2024_08_10.jpg", author: "Friedrich Haag", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0" },
    "echinacea-tea": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Echinacea_purpurea%2C_Jard%C3%ADn_Bot%C3%A1nico%2C_M%C3%BAnich%2C_Alemania%2C_2013-09-08%2C_DD_01.jpg/960px-Echinacea_purpurea%2C_Jard%C3%ADn_Bot%C3%A1nico%2C_M%C3%BAnich%2C_Alemania%2C_2013-09-08%2C_DD_01.jpg", title: "Echinacea purpurea, Jard\u00edn Bot\u00e1nico, M\u00fanich, Alemania, 2013-09-08, DD 01.jpg", page: "https://commons.wikimedia.org/wiki/File:Echinacea_purpurea,_Jard%C3%ADn_Bot%C3%A1nico,_M%C3%BAnich,_Alemania,_2013-09-08,_DD_01.jpg", author: "Diego Delso", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0" },
    "cayenne-tonic": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Souk_Al_Milh%2C_Sana%2C_Yemen_%284324865585%29.jpg/960px-Souk_Al_Milh%2C_Sana%2C_Yemen_%284324865585%29.jpg", title: "Souk Al Milh, Sana, Yemen (4324865585).jpg", page: "https://commons.wikimedia.org/wiki/File:Souk_Al_Milh,_Sana,_Yemen_(4324865585).jpg", author: "yeowatzup", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0" },
    "clove-tea": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Bumbu_dan_Rempah_-_rempah.jpg/960px-Bumbu_dan_Rempah_-_rempah.jpg", title: "Bumbu dan Rempah - rempah.jpg", page: "https://commons.wikimedia.org/wiki/File:Bumbu_dan_Rempah_-_rempah.jpg", author: "Galeri ega", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0" },
    "steam-bowl": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tea_seemed_especially_steamy_this_morning_%2823553842543%29.jpg/960px-Tea_seemed_especially_steamy_this_morning_%2823553842543%29.jpg", title: "Tea seemed especially steamy this morning (23553842543).jpg", page: "https://commons.wikimedia.org/wiki/File:Tea_seemed_especially_steamy_this_morning_(23553842543).jpg", author: "terri_bateman", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0" },
    "chamomile-nightcap": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Glass_of_chamomile_tea.jpg/960px-Glass_of_chamomile_tea.jpg", title: "Glass of chamomile tea.jpg", page: "https://commons.wikimedia.org/wiki/File:Glass_of_chamomile_tea.jpg", author: "Greg", license: "CC BY-SA 2.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0" },
    "warm-milk": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Wedang_Jahe_Susu.jpg/960px-Wedang_Jahe_Susu.jpg", title: "Wedang Jahe Susu.jpg", page: "https://commons.wikimedia.org/wiki/File:Wedang_Jahe_Susu.jpg", author: "SATELITBM", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0" },
    "lavender-tea": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/A_small_white_feeding_on_a_lavender_flower.jpg/960px-A_small_white_feeding_on_a_lavender_flower.jpg", title: "A small white feeding on a lavender flower.jpg", page: "https://commons.wikimedia.org/wiki/File:A_small_white_feeding_on_a_lavender_flower.jpg", author: "Kitten Goes Meow", license: "CC0", licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en" },
    "tart-cherry": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Sauerkirschenfrucht_Prunus_cerasus_2.JPG/960px-Sauerkirschenfrucht_Prunus_cerasus_2.JPG", title: "Sauerkirschenfrucht Prunus cerasus 2.JPG", page: "https://commons.wikimedia.org/wiki/File:Sauerkirschenfrucht_Prunus_cerasus_2.JPG", author: "b\u00f6hringer friedrich", license: "CC BY-SA 2.5", licenseUrl: "https://creativecommons.org/licenses/by-sa/2.5" },
    "banana-tea": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Bunch_of_bananas_on_sale.jpg/960px-Bunch_of_bananas_on_sale.jpg", title: "Bunch of bananas on sale.jpg", page: "https://commons.wikimedia.org/wiki/File:Bunch_of_bananas_on_sale.jpg", author: "Wilfredor", license: "CC0", licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en" },
    "nutmeg-milk": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Nutmeg_on_Tree.jpg/960px-Nutmeg_on_Tree.jpg", title: "Nutmeg on Tree.jpg", page: "https://commons.wikimedia.org/wiki/File:Nutmeg_on_Tree.jpg", author: "Joe Ravi", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0" },
    "wound-dressing": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Raw_Honey_For_Sale_%28223971915%29.jpeg/960px-Raw_Honey_For_Sale_%28223971915%29.jpeg", title: "Raw Honey For Sale (223971915).jpeg", page: "https://commons.wikimedia.org/wiki/File:Raw_Honey_For_Sale_(223971915).jpeg", author: "Hanlu Cao", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0" },
    "oatmeal-mask": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Rolled_oats_in_bowl_2.jpg/960px-Rolled_oats_in_bowl_2.jpg", title: "Rolled oats in bowl 2.jpg", page: "https://commons.wikimedia.org/wiki/File:Rolled_oats_in_bowl_2.jpg", author: "Bodhi Peace", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0" },
    "cinnamon-spot": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Ground_Cinnamon_Powder_and_a_Cinnamon_Stick.jpg/960px-Ground_Cinnamon_Powder_and_a_Cinnamon_Stick.jpg", title: "Ground Cinnamon Powder and a Cinnamon Stick.jpg", page: "https://commons.wikimedia.org/wiki/File:Ground_Cinnamon_Powder_and_a_Cinnamon_Stick.jpg", author: "formulatehealth", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0" },
    "aloe-burn": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Aloe_Vera_in_a_Natural_Garden_%E2%80%93_Medicinal_Plant_in_Uganda.jpg/960px-Aloe_Vera_in_a_Natural_Garden_%E2%80%93_Medicinal_Plant_in_Uganda.jpg", title: "Aloe Vera in a Natural Garden \u2013 Medicinal Plant in Uganda.jpg", page: "https://commons.wikimedia.org/wiki/File:Aloe_Vera_in_a_Natural_Garden_%E2%80%93_Medicinal_Plant_in_Uganda.jpg", author: "Ssemmanda will", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0" },
    "lip-balm": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Melting_beeswax.jpg/960px-Melting_beeswax.jpg", title: "Melting beeswax.jpg", page: "https://commons.wikimedia.org/wiki/File:Melting_beeswax.jpg", author: "Simon A. Eugster", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0" },
    "sugar-scrub": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Brown_sugar_examples.JPG/960px-Brown_sugar_examples.JPG", title: "Brown sugar examples.JPG", page: "https://commons.wikimedia.org/wiki/File:Brown_sugar_examples.JPG", author: "Moe Rubenzahl", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0" },
    "yogurt-mask": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/A_bowl_of_frozen_yogurt.jpg/960px-A_bowl_of_frozen_yogurt.jpg", title: "A bowl of frozen yogurt.jpg", page: "https://commons.wikimedia.org/wiki/File:A_bowl_of_frozen_yogurt.jpg", author: "JacquesDemien", license: "CC0", licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en" },
    "tummy-tea": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Ginger_tea.jpg/960px-Ginger_tea.jpg", title: "Ginger tea.jpg", page: "https://commons.wikimedia.org/wiki/File:Ginger_tea.jpg", author: "congerdesign", license: "CC0", licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en" },
    "peppermint-tea": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Moroccan_Mint_Tea_-_1.jpg/960px-Moroccan_Mint_Tea_-_1.jpg", title: "Moroccan Mint Tea - 1.jpg", page: "https://commons.wikimedia.org/wiki/File:Moroccan_Mint_Tea_-_1.jpg", author: "Sarkar Sayantan", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0" },
    "lemon-water": { src: "https://upload.wikimedia.org/wikipedia/commons/6/67/Tea_with_lemon_and_a_glass_of_water%2C_2012.jpg", title: "Tea with lemon and a glass of water, 2012.jpg", page: "https://commons.wikimedia.org/wiki/File:Tea_with_lemon_and_a_glass_of_water,_2012.jpg", author: "garycycles8", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0" },
    "fennel-tea": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Fennel_seeds_01.jpg/960px-Fennel_seeds_01.jpg", title: "Fennel seeds 01.jpg", page: "https://commons.wikimedia.org/wiki/File:Fennel_seeds_01.jpg", author: "NanaYawBotar", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0" },
    "digestive-tonic": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Cider_and_apple_juice.jpg/960px-Cider_and_apple_juice.jpg", title: "Cider and apple juice.jpg", page: "https://commons.wikimedia.org/wiki/File:Cider_and_apple_juice.jpg", author: "Unknown", license: "CC BY-SA 3.0", licenseUrl: "http://creativecommons.org/licenses/by-sa/3.0/" },
    "immunity-paste": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Curcuma_longa_roots.jpg/960px-Curcuma_longa_roots.jpg", title: "Curcuma longa roots.jpg", page: "https://commons.wikimedia.org/wiki/File:Curcuma_longa_roots.jpg", author: "Simon A. Eugster", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0" },
    "date-balls": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Medjool_dates_as_luxury_item.jpg/960px-Medjool_dates_as_luxury_item.jpg", title: "Medjool dates as luxury item.jpg", page: "https://commons.wikimedia.org/wiki/File:Medjool_dates_as_luxury_item.jpg", author: "Chiswick Chap", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0" },
    "tahini-bites": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Tahini_with_oil.JPG/960px-Tahini_with_oil.JPG", title: "Tahini with oil.JPG", page: "https://commons.wikimedia.org/wiki/File:Tahini_with_oil.JPG", author: "Miansari66", license: "CC0", licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en" },
    "beet-tonic": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Beetroots_in_a_basket.jpg/960px-Beetroots_in_a_basket.jpg", title: "Beetroots in a basket.jpg", page: "https://commons.wikimedia.org/wiki/File:Beetroots_in_a_basket.jpg", author: "W.carter", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0" },
    "g1": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Western_honey_bee_on_a_honeycomb.jpg/960px-Western_honey_bee_on_a_honeycomb.jpg", title: "Western honey bee on a honeycomb.jpg", page: "https://commons.wikimedia.org/wiki/File:Western_honey_bee_on_a_honeycomb.jpg", author: "Matthew T Rader", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0" },
    "g2": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Honey_dipper.jpg/960px-Honey_dipper.jpg", title: "Honey dipper.jpg", page: "https://commons.wikimedia.org/wiki/File:Honey_dipper.jpg", author: "Matankic", license: "CC0", licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en" },
    "g3": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Antiguan_honey_products_at_an_exhibition_in_Saint_Lucia.jpg/960px-Antiguan_honey_products_at_an_exhibition_in_Saint_Lucia.jpg", title: "Antiguan honey products at an exhibition in Saint Lucia.jpg", page: "https://commons.wikimedia.org/wiki/File:Antiguan_honey_products_at_an_exhibition_in_Saint_Lucia.jpg", author: "Government of Antigua and Barbuda", license: "Public domain", licenseUrl: "" },
    "g4": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Herbal_Tea_01.jpg/960px-Herbal_Tea_01.jpg", title: "Herbal Tea 01.jpg", page: "https://commons.wikimedia.org/wiki/File:Herbal_Tea_01.jpg", author: "PagesAndPathsPH", license: "CC0", licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en" },
    "g5": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Turmeric_Root_and_Turmeric_Powder.jpg/960px-Turmeric_Root_and_Turmeric_Powder.jpg", title: "Turmeric Root and Turmeric Powder.jpg", page: "https://commons.wikimedia.org/wiki/File:Turmeric_Root_and_Turmeric_Powder.jpg", author: "formulatehealth", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0" },
    "g6": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/European_honey_bee_extracts_nectar.jpg/960px-European_honey_bee_extracts_nectar.jpg", title: "European honey bee extracts nectar.jpg", page: "https://commons.wikimedia.org/wiki/File:European_honey_bee_extracts_nectar.jpg", author: "John Severns (Severnjc)", license: "Public domain", licenseUrl: "" }
  };

  // Wikimedia serves resized copies; ask for a smaller one for thumbnails.
  function photo(id, width) {
    var p = PHOTOS[id];
    if (!p) return "";
    return width && p.src.indexOf("/960px-") !== -1 ? p.src.replace("/960px-", "/" + width + "px-") : p.src;
  }

  var DISCLAIMER = "Traditional home-remedy info for general wellness — not medical advice. See a doctor for severe, worsening, or lasting symptoms. Never give honey to a child under 1 year old.";

  // ---- 40 honey remedies ----
  var REMEDIES = [
    // Throat & Cough
    { id: "lemon-soother", cat: "Throat & Cough", title: "Honey & Lemon Soother", helps: "Calms a scratchy, sore throat.", time: "5 min", keys: "honey,lemon", lock: 1,
      ingredients: ["1 tbsp raw honey", "Juice of 1/2 lemon", "1 cup warm (not boiling) water"],
      steps: ["Warm the water — hot enough to sip, not boiling (boiling harms honey's enzymes).", "Stir in the honey until dissolved.", "Add the lemon juice and sip slowly."] },
    { id: "ginger-tea", cat: "Throat & Cough", title: "Honey Ginger Tea", helps: "Eases coughing and throat irritation.", time: "12 min", keys: "ginger,tea", lock: 2,
      ingredients: ["1 tbsp honey", "3–4 thin slices fresh ginger", "1.5 cups water"],
      steps: ["Simmer the ginger in the water for 8–10 minutes.", "Strain into a mug and let it cool slightly.", "Stir in the honey and sip."] },
    { id: "thyme-cough-syrup", cat: "Throat & Cough", title: "Honey Thyme Cough Syrup", helps: "A homemade syrup for a nagging cough.", time: "15 min", keys: "thyme,herbs", lock: 3,
      ingredients: ["1/2 cup honey", "2 tbsp fresh thyme (or 1 tbsp dried)", "1/2 cup water"],
      steps: ["Simmer the thyme in the water 10 minutes, then remove from heat.", "Cover and steep 5 more minutes; strain out the thyme.", "Stir the warm thyme liquid into the honey.", "Take 1 tsp as needed; keep refrigerated up to 1 week."] },
    { id: "golden-milk", cat: "Throat & Cough", title: "Golden Honey Turmeric Milk", helps: "Soothes throat and eases inflammation.", time: "8 min", keys: "turmeric,milk", lock: 4,
      ingredients: ["1 cup milk (any kind)", "1/2 tsp turmeric", "Pinch of black pepper", "1 tbsp honey"],
      steps: ["Warm the milk with the turmeric and pepper (pepper helps absorption).", "Take off the heat and let it cool a minute.", "Stir in the honey and drink warm, especially before bed."] },
    { id: "acv-gargle", cat: "Throat & Cough", title: "Honey & ACV Gargle", helps: "A gargle for a raw, sore throat.", time: "3 min", keys: "vinegar,honey", lock: 5,
      ingredients: ["1 tbsp honey", "1 tbsp apple cider vinegar", "1 cup warm water"],
      steps: ["Stir everything together until the honey dissolves.", "Gargle a mouthful for 15–20 seconds, then spit.", "Repeat a few times; use 2–3× a day."] },
    { id: "black-pepper", cat: "Throat & Cough", title: "Honey Black-Pepper Mix", helps: "An old remedy for a stubborn cough.", time: "3 min", keys: "honey,spice", lock: 6,
      ingredients: ["1 tbsp honey", "Small pinch of freshly ground black pepper"],
      steps: ["Mix the pepper into the honey.", "Swallow 1 tsp slowly so it coats the throat.", "Use up to 2–3× a day."] },
    { id: "sage-gargle", cat: "Throat & Cough", title: "Honey Sage Gargle", helps: "Sage + honey for throat pain.", time: "12 min", keys: "sage,herbs", lock: 7,
      ingredients: ["1 tbsp honey", "1 tbsp fresh sage leaves", "1 cup water"],
      steps: ["Steep the sage in just-boiled water 10 minutes; strain.", "Stir in honey and let it cool to warm.", "Gargle, then you can swallow it too."] },
    { id: "onion-syrup", cat: "Throat & Cough", title: "Honey Onion Syrup", helps: "A pungent but effective cough syrup.", time: "6 hr (mostly waiting)", keys: "onion,honey", lock: 8,
      ingredients: ["1 small onion, thinly sliced", "Enough honey to cover (about 1/2 cup)"],
      steps: ["Layer the onion slices in a jar and cover with honey.", "Cover and leave at room temp 6–8 hours (or overnight).", "Strain off the now-syrupy honey.", "Take 1 tsp as needed; refrigerate up to 3 days."] },
    { id: "licorice-tea", cat: "Throat & Cough", title: "Honey Licorice Tea", helps: "Coats and calms an irritated throat.", time: "10 min", keys: "tea,herbs", lock: 9,
      ingredients: ["1 tsp dried licorice root", "1 tbsp honey", "1 cup water"],
      steps: ["Simmer the licorice root 8 minutes; strain.", "Cool slightly, then stir in honey.", "Sip warm. (Skip if you have high blood pressure.)"] },
    { id: "marshmallow-tea", cat: "Throat & Cough", title: "Honey Marshmallow-Root Tea", helps: "Great for a dry, tickly throat.", time: "4 hr cold-steep", keys: "tea,herbs", lock: 10,
      ingredients: ["1 tbsp dried marshmallow root", "1 tbsp honey", "1 cup cold water"],
      steps: ["Cold-steep the root in water 4 hours (heat destroys the soothing mucilage).", "Strain, then gently warm and stir in honey.", "Sip slowly."] },

    // Cold & Flu
    { id: "ginger-shot", cat: "Cold & Flu", title: "Honey Lemon Ginger Shot", helps: "A fiery kick-start at the first sign of a cold.", time: "5 min", keys: "ginger,lemon", lock: 11,
      ingredients: ["1 tbsp grated ginger", "Juice of 1 lemon", "1 tbsp honey", "2 tbsp warm water"],
      steps: ["Grate the ginger and squeeze out the juice (or use it grated).", "Whisk with the lemon, honey, and warm water.", "Drink it as a shot, once a day."] },
    { id: "garlic-paste", cat: "Cold & Flu", title: "Honey Garlic Immune Paste", helps: "Garlic + honey for cold and flu season.", time: "10 min", keys: "garlic,honey", lock: 12,
      ingredients: ["3 cloves garlic, crushed", "3 tbsp honey"],
      steps: ["Crush the garlic and let it sit 10 minutes (activates allicin).", "Stir it into the honey.", "Take 1 tsp a day; store covered in the fridge up to 1 week."] },
    { id: "elderberry-syrup", cat: "Cold & Flu", title: "Honey Elderberry Syrup", helps: "A classic syrup for flu symptoms.", time: "45 min", keys: "berries,syrup", lock: 13,
      ingredients: ["1/2 cup dried elderberries", "3 cups water", "1/2 cup honey"],
      steps: ["Simmer elderberries in water until reduced by half (~30–40 min).", "Mash and strain, then let the liquid cool to warm.", "Stir in the honey.", "Take 1 tbsp daily; refrigerate up to 2 weeks."] },
    { id: "cinnamon-tea", cat: "Cold & Flu", title: "Honey Cinnamon Tea", helps: "Warming help for congestion.", time: "8 min", keys: "cinnamon,tea", lock: 14,
      ingredients: ["1 cinnamon stick (or 1/2 tsp ground)", "1 tbsp honey", "1 cup water"],
      steps: ["Simmer the cinnamon in water 5 minutes.", "Cool slightly and stir in the honey.", "Sip warm."] },
    { id: "echinacea-tea", cat: "Cold & Flu", title: "Honey Echinacea Tea", helps: "Supports the immune system.", time: "10 min", keys: "flowers,tea", lock: 15,
      ingredients: ["1 echinacea tea bag (or 1 tsp dried)", "1 tbsp honey", "1 cup hot water"],
      steps: ["Steep the echinacea 8–10 minutes.", "Remove the tea and let it cool slightly.", "Stir in honey; drink 1–2× a day when you feel run-down."] },
    { id: "cayenne-tonic", cat: "Cold & Flu", title: "Honey Cayenne Tonic", helps: "Helps clear a stuffy nose.", time: "5 min", keys: "pepper,honey", lock: 16,
      ingredients: ["1 tbsp honey", "Pinch of cayenne", "Juice of 1/2 lemon", "1 cup warm water"],
      steps: ["Stir the honey and cayenne into the warm water.", "Add lemon juice.", "Sip slowly — the cayenne helps thin mucus."] },
    { id: "clove-tea", cat: "Cold & Flu", title: "Honey Clove Tea", helps: "Cloves for cold and throat relief.", time: "8 min", keys: "clove,tea", lock: 17,
      ingredients: ["3–4 whole cloves", "1 tbsp honey", "1 cup water"],
      steps: ["Simmer the cloves 5 minutes; strain.", "Cool slightly, stir in the honey.", "Sip warm."] },
    { id: "steam-bowl", cat: "Cold & Flu", title: "Honey Steam Bowl", helps: "Loosens sinus and chest congestion.", time: "10 min", keys: "steam,herbs", lock: 18,
      ingredients: ["1 tbsp honey (to sip after)", "Bowl of just-boiled water", "Optional: a few drops eucalyptus or fresh herbs"],
      steps: ["Pour hot water into a bowl; add herbs if using.", "Drape a towel over your head and breathe the steam 5–10 min, eyes closed.", "Afterward, sip a spoon of honey in warm water to soothe the throat."] },

    // Sleep & Calm
    { id: "chamomile-nightcap", cat: "Sleep & Calm", title: "Honey Chamomile Nightcap", helps: "Winds you down for sleep.", time: "8 min", keys: "chamomile,tea", lock: 19,
      ingredients: ["1 chamomile tea bag", "1 tsp honey", "1 cup hot water"],
      steps: ["Steep the chamomile 5 minutes.", "Cool slightly, then stir in the honey.", "Sip 30–45 minutes before bed."] },
    { id: "warm-milk", cat: "Sleep & Calm", title: "Honey Warm Milk", helps: "The classic bedtime drink.", time: "6 min", keys: "milk,honey", lock: 20,
      ingredients: ["1 cup milk", "1 tsp honey", "Tiny pinch of nutmeg (optional)"],
      steps: ["Warm the milk gently — don't boil.", "Take off heat and stir in the honey.", "Add nutmeg if you like and drink warm before bed."] },
    { id: "lavender-tea", cat: "Sleep & Calm", title: "Honey Lavender Tea", helps: "Calms nerves and eases stress.", time: "8 min", keys: "lavender,tea", lock: 21,
      ingredients: ["1 tsp dried culinary lavender", "1 tsp honey", "1 cup hot water"],
      steps: ["Steep the lavender 5 minutes; strain.", "Stir in the honey.", "Sip slowly and breathe in the steam."] },
    { id: "tart-cherry", cat: "Sleep & Calm", title: "Honey Tart-Cherry Drink", helps: "Natural melatonin for better sleep.", time: "3 min", keys: "cherry,drink", lock: 22,
      ingredients: ["1/2 cup tart cherry juice", "1/2 cup warm water", "1 tsp honey"],
      steps: ["Warm the water and stir in the honey.", "Mix in the tart cherry juice.", "Drink about an hour before bed."] },
    { id: "banana-tea", cat: "Sleep & Calm", title: "Honey Banana Tea", helps: "Magnesium-rich, for restful sleep.", time: "15 min", keys: "banana,tea", lock: 23,
      ingredients: ["1 ripe banana (with peel, washed)", "1 tsp honey", "2 cups water"],
      steps: ["Cut the ends off the banana and simmer it (peel on) 10 minutes.", "Pour the water into a mug through a strainer.", "Cool slightly, stir in honey, and sip before bed."] },
    { id: "nutmeg-milk", cat: "Sleep & Calm", title: "Honey Nutmeg Milk", helps: "Nutmeg's calming touch for sleep.", time: "6 min", keys: "milk,spice", lock: 24,
      ingredients: ["1 cup milk", "Small pinch of nutmeg (no more)", "1 tsp honey"],
      steps: ["Warm the milk with the tiny pinch of nutmeg.", "Off the heat, stir in the honey.", "Drink warm before bed. (Use only a pinch of nutmeg.)"] },

    // Skin & Wounds
    { id: "wound-dressing", cat: "Skin & Wounds", title: "Raw Honey Wound Dressing", helps: "For minor cuts and scrapes.", time: "5 min", keys: "honey,jar", lock: 25,
      caution: "Only for minor wounds. Use medical-grade or raw honey. See a doctor for deep, dirty, or infected wounds, or if you're diabetic.",
      ingredients: ["Raw or medical-grade honey", "Clean gauze/bandage"],
      steps: ["Clean the wound gently with water.", "Spread a thin layer of honey on the gauze (not directly poured into the wound).", "Cover and change the dressing 1–2× a day."] },
    { id: "oatmeal-mask", cat: "Skin & Wounds", title: "Honey Oatmeal Face Mask", helps: "Soothes and gently exfoliates skin.", time: "20 min", keys: "oats,honey", lock: 26,
      ingredients: ["1 tbsp honey", "1 tbsp finely ground oats", "1 tsp warm water"],
      steps: ["Mix into a soft paste.", "Spread over clean skin and leave 10–15 minutes.", "Rinse with warm water and pat dry."] },
    { id: "cinnamon-spot", cat: "Skin & Wounds", title: "Honey Cinnamon Spot Treatment", helps: "Targets the odd breakout.", time: "15 min", keys: "cinnamon,honey", lock: 27,
      caution: "Cinnamon can irritate — patch-test first and avoid if sensitive.",
      ingredients: ["2 tsp honey", "1/4 tsp cinnamon"],
      steps: ["Mix into a paste and patch-test on your inner arm first.", "Dab a little on the blemish, avoiding broken skin.", "Leave 10 minutes, then rinse off."] },
    { id: "aloe-burn", cat: "Skin & Wounds", title: "Honey Aloe Burn Gel", helps: "Cooling relief for minor burns.", time: "5 min", keys: "aloe,plant", lock: 28,
      caution: "Minor (first-degree) burns only. Cool the burn under running water first. Seek care for blistering or large burns.",
      ingredients: ["1 tsp honey", "1 tsp fresh aloe vera gel"],
      steps: ["Run cool water over the burn for a few minutes first.", "Mix the honey and aloe.", "Apply a thin layer; reapply as needed."] },
    { id: "lip-balm", cat: "Skin & Wounds", title: "Honey Lip Balm", helps: "Rescues chapped lips.", time: "5 min", keys: "honey,balm", lock: 29,
      ingredients: ["1 tsp honey", "1 tsp coconut oil", "Optional: tiny pinch of sugar to scrub"],
      steps: ["Warm the coconut oil until soft and mix with honey.", "For chapped lips, gently scrub with the sugar version, then rinse.", "Smooth on the honey balm and leave."] },
    { id: "sugar-scrub", cat: "Skin & Wounds", title: "Honey Sugar Scrub", helps: "Smooths dry, rough skin.", time: "5 min", keys: "sugar,scrub", lock: 30,
      ingredients: ["2 tbsp honey", "2 tbsp sugar", "1 tbsp olive or coconut oil"],
      steps: ["Stir everything into a grainy paste.", "Massage gently onto damp skin in circles.", "Rinse with warm water."] },
    { id: "yogurt-mask", cat: "Skin & Wounds", title: "Honey Yogurt Mask", helps: "Calms red, irritated skin.", time: "20 min", keys: "yogurt,honey", lock: 31,
      ingredients: ["1 tbsp honey", "2 tbsp plain yogurt"],
      steps: ["Mix into a smooth mask.", "Apply to clean skin for 15 minutes.", "Rinse with cool water and pat dry."] },

    // Digestion
    { id: "tummy-tea", cat: "Digestion", title: "Honey Ginger Tummy Tea", helps: "Settles nausea and upset stomach.", time: "12 min", keys: "ginger,tea", lock: 32,
      ingredients: ["3 slices fresh ginger", "1 tsp honey", "1.5 cups water"],
      steps: ["Simmer the ginger 8–10 minutes; strain.", "Cool slightly, stir in the honey.", "Sip slowly."] },
    { id: "peppermint-tea", cat: "Digestion", title: "Honey Peppermint Tea", helps: "Eases bloating and gas.", time: "8 min", keys: "mint,tea", lock: 33,
      ingredients: ["1 peppermint tea bag (or fresh leaves)", "1 tsp honey", "1 cup hot water"],
      steps: ["Steep the peppermint 5 minutes.", "Stir in honey once slightly cooled.", "Sip after meals."] },
    { id: "lemon-water", cat: "Digestion", title: "Honey Lemon Warm Water", helps: "A gentle morning digestive.", time: "3 min", keys: "lemon,water", lock: 34,
      ingredients: ["1 tsp honey", "Juice of 1/2 lemon", "1 cup warm water"],
      steps: ["Stir the honey into the warm water.", "Add the lemon juice.", "Sip first thing in the morning."] },
    { id: "fennel-tea", cat: "Digestion", title: "Honey Fennel Tea", helps: "Classic remedy for gas.", time: "10 min", keys: "fennel,tea", lock: 35,
      ingredients: ["1 tsp fennel seeds, lightly crushed", "1 tsp honey", "1 cup water"],
      steps: ["Simmer the fennel seeds 8 minutes; strain.", "Cool slightly and stir in honey.", "Sip after eating."] },
    { id: "digestive-tonic", cat: "Digestion", title: "Honey ACV Digestive Tonic", helps: "Before-meal tonic for indigestion.", time: "3 min", keys: "vinegar,honey", lock: 36,
      caution: "Vinegar is acidic — always dilute, and skip if you have ulcers or reflux.",
      ingredients: ["1 tsp honey", "1 tsp apple cider vinegar", "1 cup water"],
      steps: ["Stir the honey and vinegar into the water.", "Sip about 15 minutes before a heavy meal."] },

    // Immunity & Energy
    { id: "immunity-paste", cat: "Immunity & Energy", title: "Honey Turmeric Immunity Paste", helps: "A daily spoonful for immune support.", time: "10 min", keys: "turmeric,honey", lock: 37,
      ingredients: ["1/2 cup honey", "2 tbsp turmeric", "1/2 tsp black pepper", "1 tsp lemon juice"],
      steps: ["Mix everything into a smooth paste.", "Store in a small jar.", "Take 1/4–1/2 tsp a day, especially in cold season."] },
    { id: "date-balls", cat: "Immunity & Energy", title: "Honey Date Energy Balls", helps: "A quick natural energy snack.", time: "15 min", keys: "dates,nuts", lock: 38,
      ingredients: ["1 cup pitted dates", "1 tbsp honey", "1/2 cup oats", "2 tbsp nut butter"],
      steps: ["Blend the dates until sticky.", "Mix in the honey, oats, and nut butter.", "Roll into balls and chill 20 minutes."] },
    { id: "tahini-bites", cat: "Immunity & Energy", title: "Honey Tahini Bites", helps: "Protein-rich pick-me-up.", time: "15 min", keys: "sesame,honey", lock: 39,
      ingredients: ["1/4 cup tahini", "2 tbsp honey", "1/2 cup oats", "1 tbsp sesame seeds"],
      steps: ["Stir the tahini and honey together.", "Fold in the oats and sesame seeds.", "Roll into small bites and refrigerate."] },
    { id: "beet-tonic", cat: "Immunity & Energy", title: "Honey Beet Tonic", helps: "For stamina and a natural boost.", time: "5 min", keys: "beetroot,juice", lock: 40,
      ingredients: ["1/2 cup beet juice", "1 tsp honey", "Squeeze of lemon"],
      steps: ["Stir the honey into the beet juice.", "Add a squeeze of lemon.", "Drink fresh, ideally before activity."] }
  ];

  var GALLERY = [
    { id: "g1", alt: "Honey bee on a honeycomb" },
    { id: "g2", alt: "Wooden honey dipper" },
    { id: "g3", alt: "Jars of honey" },
    { id: "g4", alt: "Cup of herbal tea" },
    { id: "g5", alt: "Turmeric root and powder" },
    { id: "g6", alt: "Honey bee on a flower" }
  ];

  var byId = {};
  REMEDIES.forEach(function (r) { byId[r.id] = r; });

  // ordered category list
  var CATS = [];
  REMEDIES.forEach(function (r) { if (CATS.indexOf(r.cat) < 0) CATS.push(r.cat); });

  var activeCat = "All";

  /* ---------- cards ---------- */
  function cardHtml(r) {
    return (
      '<button class="recipe-card" data-recipe="' + r.id + '">' +
        '<div class="recipe-thumb"><img loading="lazy" src="' + photo(r.id, 500) + '" alt="' + esc(r.title) + '" /></div>' +
        '<div class="recipe-info">' +
          '<span class="cat-badge">' + esc(r.cat) + "</span>" +
          "<h3>" + esc(r.title) + "</h3>" +
          "<p>" + esc(r.helps) + "</p>" +
          '<div class="recipe-meta"><span>⏱ ' + esc(r.time) + "</span></div>" +
        "</div>" +
      "</button>"
    );
  }

  function renderGridList() {
    var el = document.getElementById("recipe-grid");
    if (!el) return;
    var list = REMEDIES.filter(function (r) { return activeCat === "All" || r.cat === activeCat; });
    el.innerHTML = list.map(cardHtml).join("");
  }

  function renderFilters() {
    var el = document.getElementById("recipe-filters");
    if (!el) return;
    var all = ["All"].concat(CATS);
    el.innerHTML = all.map(function (c) {
      return '<button class="filter-chip' + (c === activeCat ? " on" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>";
    }).join("");
  }

  /* ---------- gallery ---------- */
  function renderGallery() {
    var el = document.getElementById("gallery-grid");
    if (!el) return;
    el.innerHTML = GALLERY.map(function (g) {
      return '<button class="gallery-item" data-img="' + photo(g.id) + '"><img loading="lazy" src="' + photo(g.id, 500) + '" alt="' + esc(g.alt) + '" /></button>';
    }).join("");
  }

  /* ---------- photo credits ---------- */
  function renderCredits() {
    var el = document.getElementById("photo-credits");
    if (!el) return;
    el.innerHTML = Object.keys(PHOTOS).map(function (id) {
      var p = PHOTOS[id];
      var lic = p.licenseUrl ? '<a href="' + esc(p.licenseUrl) + '" target="_blank" rel="noopener">' + esc(p.license) + "</a>" : esc(p.license);
      return '<li><a href="' + esc(p.page) + '" target="_blank" rel="noopener">' + esc(p.title.replace(/\.(jpe?g)$/i, "")) + "</a> by " + esc(p.author) + " · " + lic + "</li>";
    }).join("");
  }

  /* ---------- modal ---------- */
  var modal = document.getElementById("recipe-modal");
  var modalBody = document.getElementById("recipe-modal-body");

  function openRecipe(id) {
    var r = byId[id];
    if (!r) return;
    var big = photo(r.id);
    modalBody.innerHTML =
      '<button class="recipe-hero" data-img="' + big + '"><img src="' + big + '" alt="' + esc(r.title) + '" /><span class="tap-photo">🔍 tap photo to enlarge</span></button>' +
      '<div class="recipe-detail">' +
        '<span class="cat-badge">' + esc(r.cat) + "</span>" +
        "<h2>" + esc(r.title) + "</h2>" +
        '<p class="recipe-sub">' + esc(r.helps) + "</p>" +
        '<div class="recipe-meta big"><span>⏱ ' + esc(r.time) + "</span></div>" +
        (r.caution ? '<div class="caution"><strong>⚠️ Caution:</strong> ' + esc(r.caution) + "</div>" : "") +
        '<div class="recipe-cols">' +
          '<div class="recipe-ing"><h4>You need</h4><ul>' + r.ingredients.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul></div>" +
          '<div class="recipe-steps"><h4>How to</h4><ol>' + r.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol></div>" +
        "</div>" +
        '<p class="modal-disclaimer">' + esc(DISCLAIMER) + "</p>" +
      "</div>";
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modalBody.scrollTop = 0;
  }
  function closeRecipe() { modal.hidden = true; document.body.classList.remove("modal-open"); }

  /* ---------- lightbox ---------- */
  var lightbox = document.getElementById("lightbox");
  var lightImg = document.getElementById("lightbox-img");
  function openLightbox(url) { lightImg.src = url; lightbox.hidden = false; document.body.classList.add("modal-open"); }
  function closeLightbox() { lightbox.hidden = true; lightImg.src = ""; if (modal.hidden) document.body.classList.remove("modal-open"); }

  /* ---------- wiring ---------- */
  document.addEventListener("click", function (e) {
    var chip = e.target.closest("[data-cat]");
    if (chip) { activeCat = chip.getAttribute("data-cat"); renderFilters(); renderGridList(); return; }
    var card = e.target.closest("[data-recipe]");
    if (card) { openRecipe(card.getAttribute("data-recipe")); return; }
    var imgBtn = e.target.closest("[data-img]");
    if (imgBtn) { openLightbox(imgBtn.getAttribute("data-img")); return; }
    if (e.target.closest("[data-close-recipe]")) closeRecipe();
    if (e.target.closest("[data-close-light]")) closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!lightbox.hidden) closeLightbox();
    else if (!modal.hidden) closeRecipe();
  });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  renderFilters();
  renderGridList();
  renderGallery();
  renderCredits();
})();
