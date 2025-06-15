// src/utils/storage.js
const KEY = 'sw_favs';

export function getFavs() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function isFav(uid) {
  return getFavs().some(c => c.uid === uid);
}

export function addFav(c) {
  const arr = getFavs();
  if (!arr.find(x => x.uid === c.uid)) {
    arr.push(c);
    localStorage.setItem(KEY, JSON.stringify(arr));
  }
}

export function removeFav(uid) {
  const arr = getFavs().filter(c => c.uid !== uid);
  localStorage.setItem(KEY, JSON.stringify(arr));
}
