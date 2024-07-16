const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { eAdmin } = require("./middlewares/auth.js");
const Usuario = require("./models/Usuario.js");
const yup = require("yup");
const nodemailer = require("nodemailer");
const { where } = require("sequelize");
const uploadImgPerfil = require("./public/upload/usuarios/uploadImgPerfil.js");
// import * as yup from "yup";

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

app.get("/usuarios/:page", eAdmin, async (req, res) => {
  const { page } = req.params;
  const limit = 2;

  const countUsuario = await Usuario.count();

  if (countUsuario == null) {
    return res.json({
      erro: true,
      mensagem: "Nenhum usuário encontrado!",
    });
  } else {
    ultimaPagina = Math.ceil(countUsuario / limit);
  }

  await Usuario.findAll({
    attributes: ["id", "name", "email"],
    order: [["id"]],
    offset: Number(page * limit) - limit,
    limit: limit,
  })
    .then((users) => {
      return res.json({
        erro: false,
        users,
        countUsuario,
        ultimaPagina,
      });
    })
    .catch(() => {
      return res.status(400).json({
        erro: true,
        mensagem: "Nenhum usuário encontrado!",
      });
    });
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

  let schema = yup.object().shape({
    name: yup
      .string("necessário preencher o campo nome!")
      .required("necessário preencher o campo nome!"),
    email: yup
      .string("necessário preencher o campo email!")
      .required("necessário preencher o campo email!"),
    password: yup
      .string("necessário preencher o campo senha!")
      .required("necessário preencher o campo senha!"),
  });

  try {
    await schema.validate(dados);
  } catch (err) {
    return res.status(400).json({
      erro: true,
      mensagem: err.errors,
    });
  }

  // if (!(await schema.isValid(dados))) {
  //   return res.status(400).json({
  //     erro: true,
  //     mensagem: "Erro ao cadastrar",
  //   });
  // }

  const user = await Usuario.findOne({ where: { email: req.body.email } });

  if (user) {
    return res.status(400).json({
      erro: true,
      mensagem: "Erro, email já cadastrado",
    });
  }

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
    {
      id: user.id,
      email: user.email,
      nivel: user.nivel_acesso,
      status: user.status,
    },
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

//---------------ACESSO DE PERFIL (uso o id que esta no token pelo auth do node-------------------
app.get("/perfil", eAdmin, async (req, res) => {
  const id = req.userId;
  //await Usuario.findAll({where: { id }})
  await Usuario.findByPk(id)
    .then((user) => {
      return res.status(200).json({
        erro: false,
        user,
      });
    })
    .catch(() => {
      return res.status(400).json({
        erro: true,
        mensagem: "Recurso não encontrado",
      });
    });
});

app.put("/perfil", eAdmin, async (req, res) => {
  const id = req.userId;

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
/**-----------------Recuperação de email--------- */
app.post("/recuperar-senha", async (req, res) => {
  const dados = req.body;

  const user = await Usuario.findOne({
    attributes: ["id", "name", "email"],
    where: {
      email: dados.email,
    },
  });

  if (user === null) {
    return res.json({
      erro: true,
      mensagem: "Usuário não encontrado",
    });
  }

  dados.recover_pass = (await bcrypt.hash(user.name + user.email, 8))
    .replace(/\./g, "")
    .replace(/\//g, "");

  await Usuario.update(
    { recuperar_senha: dados.recover_pass },
    {
      where: {
        id: user.id,
      },
    }
  )
    .then(() => {
      var transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      var message = {
        from: "sender@server.com",
        to: req.body.email,
        subject: "Message title",
        text:
          "Clique no link ou cole o endereço no seu navegados: " +
          dados.url +
          dados.recover_pass,
        html:
          "<p>Clique no link ou cole o endereço no seu navegados: <a href='" +
          dados.url +
          dados.recover_pass +
          "'>Clique aqui</a></p>",
      };

      transport.sendMail(message, (err) => {
        if (err) {
          return res.status(400).json({
            erro: true,
            mensagem: "Erro: E-mail não enviado com sucesso!",
          });
        }
        return res.json({
          erro: false,
          mensagem: "E-mail  enviado com sucesso!",
        });
      });
    })
    .catch(() => {
      return res.status(400).json({
        erro: true,
        mensagem: "Erro: E-mail não enviado com sucesso!",
      });
    });
});

app.post("/validar-chave/:key", async (req, res) => {
  const { key } = req.params;

  const user = await Usuario.findOne({
    attributes: ["id"],
    where: {
      recuperar_senha: key,
    },
  });

  if (user === null) {
    return res.json({
      erro: true,
      mensagem: "Erro: Link inválido",
    });
  }

  return res.json({
    error: false,
    mensagem: "Tudo ok",
  });
});

app.put("/atualizar-senha/:key", async (req, res) => {
  const { key } = req.params;
  const { password } = req.body;
  console.log(key, " ", password);
  const senha = await bcrypt.hash(password, 8);
  console.log(senha);

  await Usuario.update({ password: senha }, { where: { recuperar_senha: key } })
    .then(([affectedRows]) => {
      if (affectedRows === 0) {
        return res.status(400).json({
          erro: true,
          mensagem: "Usuário não encontrado!",
        });
      }
      return res.json({
        erro: false,
        mensagem: "Senha atualizada com sucesso!",
      });
    })
    .catch((err) => {
      console.error("Erro ao atualizar a senha:", err);
      return res.status(500).json({
        erro: true,
        mensagem: "Erro interno do servidor",
      });
    });
});
/**----------FOTO-------------- */
app.put(
  "editar-foto-perfil",
  eAdmin,
  uploadImgPerfil.single("image"),
  async (req, res) => {
    if (req.file) {
      await Usuario.update(
        { foto: req.file.filename },
        { where: { id: req.userId } }
      )
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
    }
  }
);
app.listen(8080, () => {
  console.log("Servidor iniciado na porta 8080");
});
