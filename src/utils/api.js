// src/utils/api.js
const BASE = 'https://swapi.tech/api';

export async function fetchPaginated(path, page=1, search='') {
  const url = new URL(`${BASE}/${path}`);
  url.searchParams.set('page', page);
  if (search) url.searchParams.set('name', search);
  const res = await fetch(url);
  return res.json();
}

export async function fetchByUrl(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch (e) {
    console.error(e);
    return { error: true, message: e.message };
  }
}

