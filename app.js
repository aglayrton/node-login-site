const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { eAdmin } = require("./middlewares/auth.js");
const Usuario = require("./models/Usuario.js");
const { where } = require("sequelize");
require("dotenv").config();
const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "X-PINGOTHER, Content-Type, Authorization"
  );
  app.use(cors());
  next();
});

app.get("/usuario", eAdmin, async (req, res) => {
  await Usuario.findAll({ order: [["name", "DESC"]] })
    .then((users) => {
      return res.json({
        erro: false,
        users,
      });
    })
    .catch(() => {
      return res.status(400).json({
        erro: true,
        mensagem: "Nenhum usuário encontrado!",
      });
    });
});

app.get("/usuario/:id", eAdmin, async (req, res) => {
  const { id } = req.params;
  //await Usuario.findAll({where: { id }})
  await Usuario.findByPk(id)
    .then((users) => {
      return res.status(200).json({
        erro: false,
        users,
      });
    })
    .catch(() => {
      return res.status(400).json({
        erro: true,
        mensagem: "Recurso não encontrado",
      });
    });
});

app.post("/usuario", eAdmin, async (req, res) => {
  let dados = req.body;
  dados.password = await bcrypt.hash(dados.password, 8);
  await Usuario.create(dados)
    .then(() => {
      return res.status(201).json({
        erro: false,
        mensagem: "Cadastrado com sucesso",
      });
    })
    .catch(() => {
      return res.status(400).json({
        erro: true,
        mensagem: "Erro ao cadastrar",
      });
    });
});

app.put("/usuario", eAdmin, async (req, res) => {
  const { id } = req.body;
  await Usuario.update(req.body, { where: { id: id } })
    .then(([affectedRows]) => {
      if (affectedRows === 0) {
        return res.status(400).json({
          erro: true,
          mensagem: "Usuário não encontrado!",
        });
      }
      return res.json({
        erro: false,
        mensagem: "Usuário editado com sucesso!",
      });
    })
    .catch((err) => {
      console.error("Erro ao editar usuário:", err);
      return res.status(500).json({
        erro: true,
        mensagem: "Erro interno do servidor",
      });
    });
});

app.put("/usuario-senha", eAdmin, async (req, res) => {
  const { id, password } = req.body;
  let senha = await bcrypt.hash(password, 8);
  await Usuario.update({ password: senha }, { where: { id: id } })
    .then(([affectedRows]) => {
      if (affectedRows == 0) {
        return res.status(400).json({
          id: true,
          mensagem: "Erro na atualização da senha!",
        });
      }
      return res.json({
        id: false,
        mensagem: "Senha Atualizado com sucesso!",
      });
    })
    .catch((err) => {
      console.error("Erro ao editar usuário:", err);
      return res.status(500).json({
        erro: true,
        mensagem: "Erro interno do servidor",
      });
    });
});

app.post("/login", async (req, res) => {
  await sleep(3000);
  function sleep(ms) {
    return new Promise((resolver) => setTimeout(resolver, ms));
  }

  const user = await Usuario.findOne({
    attributes: ["id", "email", "password", "nivel_acesso", "status"],
    where: { email: req.body.email },
  });

  if (user == null) {
    return res
      .status(400)
      .json({ erro: true, mensagem: "Usuário ou senha incorreta! 400" });
  }

  if (user.status == 0) {
    return res.status(200).json({ erro: true, mensagem: "Usuário desativado" });
  }

  if (!(await bcrypt.compare(req.body.password, user.password))) {
    return res.status(400).json({
      erro: true,
      mensagem: "Usuário ou senha incorreta!",
    });
  }

  //geração de token
  let token = jwt.sign(
    { id: user.id, email: user.email, nivel: user.nivel_acesso },
    process.env.SECRET_KEY,
    {
      expiresIn: "1d", //1 dia
    }
  );

  return res.json({
    erro: false,
    mensagem: "Logado com sucesso",
    token,
  });
});

//middleware
// async function validarToken(req, res, next) {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) {
//     return res.status(400).json({
//       erro: true,
//       mensagem: "Necessário enviar o token",
//     });
//   }

//   const token = authHeader.split(" ")[1]; // Pega apenas o token sem o "Bearer"
//   try {
//     const decoded = await jwt.verify(token, "583a3549456251362c5a21314245576f");

//     req.userId = decoded.id;
//     return next();
//   } catch (error) {
//     return res.status(400).json({
//       erro: true,
//       mensagem: "Token inválido",
//       token,
//     });
//   }
// }

app.delete("/usuario/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedRows = await Usuario.destroy({ where: { id } });
    if (deletedRows === 0) {
      return res.status(404).json({
        erro: true,
        mensagem: "Usuário não encontrado!",
      });
    }
    return res.status(204).send(); // Resposta sem conteúdo (No Content)
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return res.status(500).json({
      erro: true,
      mensagem: "Erro interno do servidor",
    });
  }
});

app.delete("/desativar/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [affectedRows] = await Usuario.update(
      { status: 0 },
      { where: { id: id } }
    );

    if (affectedRows > 0) {
      const user = await Usuario.findOne({ where: { id: id, status: 0 } });

      if (user != 0) {
        return res.json({
          erro: false,
          mensagem: "Usuário desativado com sucesso",
          user,
        });
      } else {
        return res.status(404).json({
          erro: true,
          mensagem: "Usuário não encontrado após desativação",
        });
      }
    } else {
      return res.status(404).json({
        erro: true,
        mensagem: "Usuário não encontrado para desativação",
      });
    }
  } catch (err) {
    return res.status(500).json({
      erro: true,
      mensagem: "Erro do servidor ao desativar usuário: " + err.message,
    });
  }
});

app.listen(8080, () => {
  console.log("Servidor iniciado na porta 8080");
});
