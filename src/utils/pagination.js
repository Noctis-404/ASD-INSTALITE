function parsePagination(query) {
  let page = 1;
  let limit = 10;

  if (query.page !== undefined) {
    const pageStr = String(query.page);
    if (!/^\d+$/.test(pageStr) || parseInt(pageStr, 10) <= 0) {
      return { error: "page and limit must be positive integers" };
    }
    page = parseInt(pageStr, 10);
  }

  if (query.limit !== undefined) {
    const limitStr = String(query.limit);
    if (!/^\d+$/.test(limitStr) || parseInt(limitStr, 10) <= 0) {
      return { error: "page and limit must be positive integers" };
    }
    limit = parseInt(limitStr, 10);
    // If it's more than 50, use 50 (don't error, just cap it)
    if (limit > 50) {
      limit = 50;
    }
  }

  const skip = (page - 1) * limit;
  const take = limit;

  return { page, limit, skip, take };
}

function buildMeta(page, limit, total) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return { page, limit, total, totalPages };
}

module.exports = {
  parsePagination,
  buildMeta,
};
