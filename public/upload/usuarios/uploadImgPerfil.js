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
    const extensaoImagem = ["image/png", "imagem/jpg", "imagem/jpg"].find(
      (formatoAceito) => formatoAceito == file.mimetype
    );
    if (extensaoImagem) {
      return cb(null, true);
    }
  },
});
