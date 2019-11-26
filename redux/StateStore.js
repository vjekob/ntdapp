import { createStore, combineReducers } from "redux";
import { itemReducer } from "./itemReducer";

const rootReducer = combineReducers({
    item: itemReducer
});

export const StateStore = createStore(rootReducer);