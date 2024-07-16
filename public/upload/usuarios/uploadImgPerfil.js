const multer = require("multer");

module.exports = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "/public/upload/usuarios");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now().toString() + "_" + file.originalname);
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
