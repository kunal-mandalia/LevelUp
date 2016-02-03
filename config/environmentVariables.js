var envVars = {};

envVars.db = process.env.MONGOLAB_URI || "mongodb://localhost/levelup";
envVars.port =  process.env.PORT || 3000;

module.exports = envVars;