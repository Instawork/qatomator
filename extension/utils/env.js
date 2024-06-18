// tiny wrapper with default env vars
module.exports = {
    NODE_ENV: 'development', // process.env.NODE_ENV ||
    PORT: process.env.PORT || 3001,
}
