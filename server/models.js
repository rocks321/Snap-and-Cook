const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
  imageBase64: { type: String },
  imageMimeType: { type: String },
  detectedIngredients: [String],
  recipe: {
    title: String,
    description: String,
    prepTime: String,
    cookTime: String,
    servings: String,
    difficulty: String,
    ingredients: [String],
    steps: [String],
    tips: [String],
    nutritionHighlights: [String]
  },
  userRating: { type: Number, min: 1, max: 5 },
  savedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recipe', RecipeSchema);
