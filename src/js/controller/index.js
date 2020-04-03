// Global app controller
// https://forkify-api.herokuapp.com/api/search
import Search from '../models/Search';
import Recipe from '../models/Recipe';
import List from '../models/List';
import Likes from '../models/Likes';
import * as searchView from "../views/searchView";
import * as recipeView from "../views/recipeView";
import * as listView from "../views/listView";
import * as likesView from "../views/likesView";
import { elements, renderLoader, clearLoader } from "../views/base";

/**
 * Global State of the App
 * - Search object 
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 */
const state = {};

/***********************
 * SEARCH CONTROLLER 
 ***********************/

const controlSearch = async () => {

    // 1) Get the query from the view
    const query = searchView.getInput();

    if (query) {
        // 2) New search object and add to state
        state.search = new Search(query);

        // 3) Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        
        try {
            // 4) Search for recipes
            await state.search.getResults();
    
            // 5) Render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch (error) {
            alert('Something went wrong with the search...');
            clearLoader();    
        }
    }
};

elements.searchForm.addEventListener('submit', evt => {
    evt.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', evt => {
    const btn = evt.target.closest('.btn-inline');
    // console.log(btn);
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
        // console.log(goToPage);
    }
    
});

/***********************
 * RECIPE CONTROLLER
 ***********************/

const controlRecipe = async () => {
    // Get ID from url
    const id = window.location.hash.replace('#', '');
    // console.log(id);

    if (id) {
        // Prepare the UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // Highligth selected search item
        if (state.search) {
            searchView.highligthSelected(id)
        }
        
        // Create new recipe object
        state.recipe = new Recipe(id);
        
        try {
            // Get recipe data and parse ingredients
            await state.recipe.getRecipe();
            // console.log(state.recipe.ingredients);
            state.recipe.parseIngredients();
            
            // Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
    
            // Render recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
            );
            
        } catch (error) {
            alert('Error procesing recipe');
            console.log(error);
        }
    }
};

['hashchange', 'load'].forEach(evt => window.addEventListener(evt, controlRecipe));

/*******************
 * LIST CONTROLLER
 *******************/

const controlList = () => {
    // Create a new list IF there is none yet
    if (!state.list) {
        state.list = new List();
    }

    // Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
    
};

// Handle delete and update list item events
elements.shopping.addEventListener('click', evt => {
    const id = evt.target.closest('.shopping__item').dataset.itemid;

    // Handle delete event
    if (evt.target.matches('.shopping__delete, .shopping__delete *')) {
        // Delete from state
        state.list.deleteItem(id);

        // Delete from UI
        listView.deleteItem(id);

        // Handle the count update
    } else if (evt.target.matches('.shopping__count-value')) {
        const val = parseFloat(evt.target.value, 10);
        // console.log(val);
        if (val >= 0) {
            state.list.updateCount(id, val);
        }
    }

});

/******************
 * LIKE CONTROLLER
 ******************/

 const controlLike = function () {
     if (!state.likes) {
        state.likes = new Likes();
     }
     const currentID = state.recipe.id;

     // User has NOT yet liked current recipe
     if (!state.likes.isLiked(currentID)) {
        // Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );

        // Toggle the like button
        likesView.toggleLikeBtn(true);

        // Add like to UI list
        likesView.renderLike(newLike);
        // console.log(state.likes);
     
    // User HAS liked current recipe
    } else {
        // Remove like to the state
        state.likes.deleteLike(currentID);

        // Toggle the like button
        likesView.toggleLikeBtn(false);

        // Remove like to UI list
        likesView.deleteLike(currentID);
     }

     likesView.toggleLikeMenu(state.likes.getNumLikes());
 }

// Restore liked recipes on page loads
window.addEventListener('load', () => {
    state.likes = new Likes();

    // Restore likes
    state.likes.readStorage();
    
    // Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // Render the existing likes
    state.likes.likes.forEach(like => {
        likesView.renderLike(like);
    });
});


// Handling recipe button clicks 
elements.recipe.addEventListener('click', evt => {
    if (evt.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServings(state.recipe);
        }
    } else if (evt.target.matches('.btn-increase, .btn-increase *')) {
        // Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServings(state.recipe);
    } else if (evt.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // Add ingredients to shopping list
        controlList();
    } else if (evt.target.matches('.recipe__love, .recipe__love *')) {
        // Like controller
        controlLike();
    }
});








