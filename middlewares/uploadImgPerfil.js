const multer = require("multer");
const fs = require("fs");
const path = require("path");

// // Caminho do diretório de upload
// const uploadDir = path.join(__dirname, "./public/upload/usuarios");

// // Cria o diretório se ele não existir
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

module.exports = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/upload/usuarios");
    },
    filename: function (req, file, cb) {
      cb(
        null,
        Date.now().toString() + req.userId + path.extname(file.originalname)
      );
    },
  }),
  fileFilter: (req, file, cb) => {
    const extensaoImagem = ["image/png", "image/jpeg", "image/jpg"].find(
      (formatoAceito) => formatoAceito === file.mimetype
    );
    if (extensaoImagem) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo não suportado"), false);
    }
  },
});
