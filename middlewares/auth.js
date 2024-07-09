const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = {
  eAdmin: async function validarToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(400).json({
        erro: true,
        mensagem: "Necessário enviar o token",
      });
    }

    const [bearen, token] = authHeader.split(" "); // Pega apenas o token sem o "Bearer"
    console.log(token);
    try {
      const decoded = await jwt.verify(token, process.env.SECRET_KEY);
      req.userId = decoded.id;
      return next();
    } catch (error) {
      return res.status(400).json({
        erro: true,
        mensagem: "Token inválido",
        token,
      });
    }
  },
};
