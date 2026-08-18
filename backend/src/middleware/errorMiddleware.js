const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

const routeLogger = (req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} - Headers: ${JSON.stringify(req.headers['authorization'] ? { Authorization: 'Bearer ...' } : {})} - Query: ${JSON.stringify(req.query)}`);
  next();
};

module.exports = {
  errorHandler,
  routeLogger,
};
