/**
 * @param {import("express").Request} req
 * @param {{ defaultLimit?: number; maxLimit?: number }} [options]
 */
export function getPaginationQuery(req, options = {}) {
  const defaultLimit = options.defaultLimit ?? 20;
  const maxLimit = options.maxLimit ?? 100;
  let page = parseInt(req.query.page, 10);
  let limit = parseInt(req.query.limit, 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;
  limit = Math.min(Math.floor(limit), maxLimit);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/** @returns {boolean} true if client sent page or limit (opt-in to pagination) */
export function wantsPagination(req) {
  return req.query.page != null || req.query.limit != null;
}

export function paginationMeta(page, limit, total) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { page, limit, total, totalPages };
}
