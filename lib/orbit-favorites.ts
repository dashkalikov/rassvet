/** Favorites-group view rules shared by the map, globe and catalog.
 * The first star switches the view to the favorites group; removing the last star
 * returns to the full constellation. A manual switch is kept for middle changes. */
export function favoriteToggle(favorites:readonly string[],onlyFavorites:boolean,id:string):{favorites:string[];onlyFavorites:boolean}{
  const included=favorites.includes(id);
  const next=included?favorites.filter(item=>item!==id):[...favorites,id];
  return {favorites:next,onlyFavorites:!included&&next.length===1?true:included&&next.length===0?false:onlyFavorites};
}
