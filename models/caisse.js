var mongoose = require('mongoose');

module.exports = mongoose.model('Caisse',{
	  datein: Date,
    modepaiement: String,
		motif: String,
    montant: Number
});
