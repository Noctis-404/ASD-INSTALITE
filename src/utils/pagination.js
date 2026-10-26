function parsePagination(query) {
  let page = 1;
  let limit = 10;

  if (query.page !== undefined) {
    const parsedPage = Number(query.page);
    if (!Number.isInteger(parsedPage) || parsedPage <= 0) {
      return { error: "page and limit must be positive integers" };
    }
    page = parsedPage;
  }

  if (query.limit !== undefined) {
    const parsedLimit = Number(query.limit);
    if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
      return { error: "page and limit must be positive integers" };
    }
    limit = parsedLimit;
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
