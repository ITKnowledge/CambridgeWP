var mongoose = require('mongoose');

module.exports = mongoose.model('log',{
	  dateevent: { type: Date, default: Date.now },
    user: String,
		trace: String,
    nature: String
});
