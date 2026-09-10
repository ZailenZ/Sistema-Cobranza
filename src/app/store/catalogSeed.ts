import type { CatalogId } from "./localDb";
import { getCatalog, setCatalog } from "./localDb";

// Seeds catalogs only if empty in localStorage.
export function ensureCatalogSeeded(id: CatalogId, seed: any[]) {
  const current = getCatalog(id, []);
  if (current.length > 0) return;
  setCatalog(id, seed);
}

