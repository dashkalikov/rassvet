import test from 'node:test';
import assert from 'node:assert/strict';
import {favoriteToggle} from '../lib/orbit-favorites.ts';

test('the first star shows the favorites group and the last star returns to all satellites',()=>{
  let state=favoriteToggle([],false,'68360');
  assert.deepEqual(state,{favorites:['68360'],onlyFavorites:true});
  state=favoriteToggle(state.favorites,state.onlyFavorites,'68361');
  assert.deepEqual(state,{favorites:['68360','68361'],onlyFavorites:true});
  state=favoriteToggle(state.favorites,state.onlyFavorites,'68360');
  assert.deepEqual(state,{favorites:['68361'],onlyFavorites:true});
  state=favoriteToggle(state.favorites,state.onlyFavorites,'68361');
  assert.deepEqual(state,{favorites:[],onlyFavorites:false});
});

test('a manually switched view is kept while the group changes in the middle',()=>{
  const state=favoriteToggle(['68360','68361'],false,'68362');
  assert.deepEqual(state,{favorites:['68360','68361','68362'],onlyFavorites:false});
});

test('toggling the same id twice returns to the original state',()=>{
  const state=favoriteToggle(favoriteToggle([],false,'68360').favorites,false,'68360');
  assert.deepEqual(state,{favorites:[],onlyFavorites:false});
});
