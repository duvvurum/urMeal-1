class MealPlanner {
    constructor() {
        this.meals = [];
    }

    addMeal(meal) {
        this.meals.push(meal);
    }

    removeMeal(mealId) {
        this.meals = this.meals.filter(meal => meal.id !== mealId);
    }

    getMeals() {
        return this.meals;
    }
}

export default MealPlanner;