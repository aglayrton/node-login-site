const Sequelize = require("sequelize");

const db = require("./db.js");

const Usuario = db.define("users", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  password: {
    type: Sequelize.STRING,
  },
  status: {
    type: Sequelize.TINYINT,
    allowNull: true,
    defaultValue: 1, // Define 1 como valor padrão para 'ativo'
  },
  foto: {
    type: Sequelize.STRING,
  },
  endereco: {
    type: Sequelize.STRING,
  },
  telefone: {
    type: Sequelize.STRING,
  },
  nivel_acesso: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1, // Define um nível de acesso padrão, por exemplo, 1 para usuário padrão
  },
});

Usuario.sync({ alter: true }); //se não existir a tabela, ele criará a tabela.

module.exports = Usuario;
