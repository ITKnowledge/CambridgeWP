var mongoose = require('mongoose');

module.exports = mongoose.model('Prog',{
	progname: String,
	progdesc: String,
	uniteqte: Number,
	Extraqte: Number,
	products: [
        {
          prodcode: String,
					prodname: String,
          prodprice: Number,
          prodqte: Number,
					prodexpdate: String
        }
  ],
  progprice: Number,
	maxunite: Number
});
