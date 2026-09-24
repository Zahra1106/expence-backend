// Runs when a route has no match (unknown URL)
function notFound(req, res) {
  res.status(404).json({ message: "Route not found" });
}

// GLOBAL ERROR HANDLER
// Any error thrown in a route (or passed to next(error)) ends up here,
// so every error response has the same shape: { message, errors? }
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Invalid JSON in the request body
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body is not valid JSON" });
  }

  // Mongoose schema validation failed
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return res.status(400).json({ message: "Validation failed", errors });
  }

  // Bad ObjectId or wrong type in a query
  if (err.name === "CastError") {
    return res.status(400).json({ message: `Invalid value for ${err.path}` });
  }

  // MongoDB duplicate key error (code 11000) - e.g. email already registered
  if (err.code === 11000) {
    return res.status(409).json({ message: "A record with this value already exists" });
  }

  // Anything else is an unexpected server error. Log it, but don't leak details to the client.
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
}

module.exports = { notFound, errorHandler };
