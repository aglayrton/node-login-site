const Sequelize = require("sequelize");

const sequelize = new Sequelize(process.env.DB_BANCO, process.env.DB_USER, "", {
  host: process.env.DB_HOST,
  dialect: "mysql",
  port: 3366,
});

sequelize
  .authenticate()
  .then(() => {
    console.log("conexão com banco ok");
  })
  .catch(() => {
    console.log("Erro na conexao com o banco");
  });

module.exports = sequelize;
