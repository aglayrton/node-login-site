SEQUENCIA PARA CRIAR O PROJETO
# npm init
# npm install express
# npm install nodemon - Para rodar o projeto sem precisar desativar e ativar servidor. comando para rodar local é npx nodemon app.js
# npm install --save sequelize - Sequelize é uma ferramenta Node.js ORM
# npm install --save mysql2
# npm i jsonwebtoken
# npm install --save dotenv
# npm i cors


Usuario.create(req.body)
    .then(() => {
      return res.json({
        erro: false,
        mensagem: "Usuário cadastrado com sucesso!",
      });
    })
    .catch(() => {
      return res.status(400).json({
        erro: true,
        mensagem: "Usuário não cadastrado com sucesso",
      });
    });