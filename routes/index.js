var express = require('express');
var bCrypt = require('bcrypt-nodejs');
var router = express.Router();

var Caisse = require('../models/caisse');
var Patient = require('../models/patient');
var Provider = require('../models/provider');
var Events = require('../models/events');
var Counter = require('../models/counter');
var Prog = require('../models/prog');
var Product = require('../models/product');
var Depot = require('../models/depot');
var Users = require('../models/user');
var Depotinout = require('../models/depotinout');
var Inventory = require('../models/inventory');
var Log = require('../models/log');


var logCambridge = function(usr, trace, nature){
  var log = new Log();
  log.user= usr;
  log.trace=trace;
  log.nature=nature;
  log.save(function(err) {
      if (err)
          res.send(err);
  });
}

var ff = function(req, res, next){

  console.log(req.user.username);
  console.log(req.params.id);

  return next();
}


/* Function DEBITER Stock livraison */
var stockinout_function = function(dinoutid,qteout,factnum,patientid,visiteid,prodidinvisite){

  var datesys = new Date().toISOString();
  var motifout="Vente normale de la facture: " + factnum;
  var stockout = {
  qteout: qteout,
  dateout: datesys,
  motifout: motifout,
  factnum: factnum,
  prodidinvisite: prodidinvisite
};


  Depotinout.findById(dinoutid,function(err, stockin){
    stockin.out.push(stockout);
      stockin.update({
        out: stockin.out,
        prodqtemv: stockin.prodqtemv - qteout
    },function (err, outID){
      if(err){
        console.log('GET Error: There was a problem retrieving: ' + err);

      }else{
          SetDelivred(patientid,visiteid,prodidinvisite,true);
      }
    })
});

}

//----------------------------- SetDelivred --------------------------------

var SetDelivred = function(patientid,visiteid,prodidinvisite,etat){
 console.log("eeeeeeee" + patientid + '|' + prodidinvisite + '|' + etat);
  Patient.findById(patientid,function(err, patients){

      for (var j=0; j < patients.visites.length; j++){
            if(patients.visites[j]._id.toString() === visiteid.toString()){

               for(var k=0;  k<patients.visites[j].products.length; k++){

                 if(patients.visites[j].products[k]._id.toString() == prodidinvisite.toString()){

                   var tt = patients.visites[j].products[k];
                   tt.delivred = etat;//true;
                   patients.visites[j].products[k] = tt;

                 }

               }

            }
      }



      patients.update({
        visites: patients.visites
      },function (err, eventsID){
  			if(err){
  				console.log('GET Error: There was a problem retrieving: ' + err );

  			}else{

  				console.log('Success');
  			}
  		});

});
}


var Getdate = function(d){
   var out = d.substring(0, 10).split("-",3);
   var dd = out[1] + "/" + out[2] + "/" + out[0]
   return dd;
}

var createHash = function(password){
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

var Gethour = function(h){
    var out = h.substring(11, 19);
    return out;
}

var tt;

var GetprodByExp = function(){

  Depot.findOne({depotname: "Siège"},function(err, depot){

    //console.log(depot.inout[0]);

    tt = depot.inout;

    console.log(tt);

    //return depot.inout[0];

  });

  return tt;

}

var SetisPatient = function(id){

	Events.findById(id, function (err, events){
		events.update({ isPatient: true,
			color: "#689F44"

		},function (err, eventsID){
			if(err){
				console.log('GET Error: There was a problem retrieving: ' + err );

			}else{

				console.log('Success');
			}
		})
	});

}

var facnum = "";

var Getcounter = function(){
  Counter.findById("57b1acb23e31e6c1948d010c", function (err, counter){
    var tt = counter.counter;
    tt = tt + 1;
    //counter.counter = tt;
    //var d = new Date();
    //var mask = "000000";
    //d.getDate() + "/" + (Number(d.getMonth())+1).toString() + "/" + d.getFullYear()
    //inc = d.getFullYear() + (Number(d.getMonth())+1).toString() +"-"+ mask.substring(0,6-tt.toString().length) + tt.toString();
    //console.log(tt);
    counter.update({
          counter: tt
    },function (err, counterID){
      if(err){
        console.log('GET Error: There was a problem retrieving: ' + err);
        //res.redirect('/home');
      }else{
        facnum = tt;
        console.log("Success" + " " + tt + " " + facnum);
        //res.render('/invoice', { user: req.user, counter: inc});

      }
    })

});
  console.log("Success2" + " " + facnum);
 return facnum;
}


var ConvertToUnit = function(qte, unittype){

    if (unittype == "Boîte"){
      return Number(qte) * 21;
    }else if (unittype == "Caisse"){
      return Number(qte) * 6 * 21;
    }else if(unittype == "Unité"){
      return Number(qte);
    }

}


var SetPrice = function(prog){

      /*
          @ PROG1--------- 3,490.00 Dhs ---> var a
          @ PROG2--------- 2,790.00 Dhs ---> var b
          @ PROG3--------- 1,990.00 Dhs ---> var c
          @ PROG4--------- 1,090.00 Dhs ---> var d
          @ PROG/Semaine--   790.00 Dhs ---> var e
          @ CONSULTATION--   300.00 Dhs ---> var f
          */


    var progprice = [
      {
        prog: "Prog 1",
        prix: ((3490 * 100)/120).toFixed(2),
        desc: "120 Unités"
      },
      {
        prog: "Prog 2",
        prix: ((2790 * 100)/120).toFixed(2),
        desc: "90 Unités"
      },
      {
        prog: "Prog 3",
        prix: ((1990 * 100)/120).toFixed(2),
        desc: "60 Unités"
      },
      {
        prog: "Prog 4",
        prix: ((1090 * 100)/120).toFixed(2),
        desc: "30 Unités"
      },
      {
        prog: "Cons 5",
        prix: ((300 * 100)/120).toFixed(2),
        desc: "CONSULTATION"
      },
      {
        prog: "Cons 6",
        prix: ((790 * 100)/120).toFixed(2),
        desc: "PROG/Semaine"
      }
    ];

    var price = progprice[Number(prog.substring(5,6))-1].prix;
    var desc = progprice[Number(prog.substring(5,6))-1].desc;

    return [price, desc];

}


var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects

	if (req.isAuthenticated())
		return next();

	// if the user is not authenticated then redirect him to the login page
	res.redirect('/');
}

module.exports = function(passport){

	/* GET login page. */
	router.get('/', function(req, res) {
    	// Display the Login page with any flash message, if any
		res.render('index', { message: req.flash('message') });
	});


	/* Handle Login POST */
	router.post('/login', passport.authenticate('login', {

		successRedirect: '/home',
		failureRedirect: '/',
		failureFlash : true
	}));

	/* GET Registration Page */
	router.get('/signup', isAuthenticated, function(req, res){
		res.render('register',{message: req.flash('message')});
	});

	/* Handle Registration POST */
	router.post('/signup', passport.authenticate('signup', {

		successRedirect: '/home',
		failureRedirect: '/signup',
		failureFlash : true
	}));

	/* GET Home Page */
	router.get('/home', isAuthenticated, function(req, res){
		res.render('home', { user: req.user });
	});


/* notification alert */
router.get('/notification', isAuthenticated, function(req, res){
  res.json({notification: "33 Articles en rupture de stock."});
});
// -------------------------  Function Stockinout ---------------------------
  router.get('/stockinout/:id', isAuthenticated, function(req, res){
    var retour="";
    var tempqte = req.query.qte;
    var depotname = req.query.depotname;
    var patientid = req.query.patientid;
    var visiteid = req.query.visiteid;
    var prodidinvisite = req.query.prodidinvisite;
    var factnum = req.query.factnum;
    var tab = [];
    var outtab = [];
console.log(tempqte + '|' + depotname + '|' + patientid + '|' + visiteid  + '|' + prodidinvisite + '|' + factnum);
    Depotinout.find({prodid: req.params.id, depotname: depotname, prodqtemv: { $gt: 0 }}, {}, {sort: {'dateexp': 1}} , function(err, result){

      for(i=0; i<result.length; i++){
        // console.log(result[i].out);
        if(tempqte > 0){
          if(result[i].prodqtemv >= tempqte ){


            tab.push({dinoutid: result[i]._id, qte: tempqte, depot:depotname,factnum:factnum});
            tempqte = tempqte - tempqte;// result[i].prodqtemv;


          }else{

            tab.push({dinoutid: result[i]._id, qte: result[i].prodqtemv, depot: depotname,factnum:factnum});
            tempqte = tempqte - result[i].prodqtemv;

          }


        }


      }
if (tempqte>0){
  retour="ko";
}else {
  for(j=0; j<tab.length; j++){
      var retour="";
      var qte = tab[j].qte;
      var dinoutid = tab[j].dinoutid;

      stockinout_function(dinoutid,qte,factnum,patientid,visiteid,prodidinvisite);
  }
  retour="ok";
}

      // var patientid = "58272b714a314af0317a75d3";
      // var visitesid = "58272b9d4a314af0317a75db";
      // var prodid = "5803f855b5effd3e32b89c7d";
      // SetDelivred(patientid, visitesid, prodid);
      // res.send(tab);
      //res.end("Hello Mitnick, you've just stumbled on the simplest web server ever");

      res.redirect('/livraison/?result=' + retour);
    });
});

// -------------------------  Function Stockinout ---------------------------



// -------------------------  Function livraison ---------------------------

router.get('/livraison', isAuthenticated, function(req, res){
   Depot.find(function(err, depot){
    Patient.find({visites: {$elemMatch: {clotured: true}}}, {'visites.$': 1, 'patientnom': 1, 'patientprenom': 1},function(err, result){
      res.render('livraison', {user: req.user, patient: result,depots: depot});
    // res.json(result);
    })
  })

});


router.get('/delivred/:id', isAuthenticated, function(req, res){



});






// -------------------------  Function livraison ---------------------------

	router.get('/invoice', isAuthenticated, function(req, res){


          var pid = req.query.id;
          var vid = req.query.vid;
          //console.log("index: " + index);
          var total = 0;
          var d = new Date().toISOString();
          Patient.findById(req.query.id, function(err, patient){
            for (i=0; i< patient.visites.length; i++){
              if((patient.visites[i].clotured === false) && (patient.visites[i]._id.toString() === vid.toString())){
              total = total + patient.visites[i].prix;
              var factnum = patient.visites[i].factnum;
              var discount = patient.visites[i].discount;
              }
            }
          var  totalr = (total - ((total * discount)/100));

          if (err) {
              console.log('GET Error: There was a problem retrieving: ' + err);
          } else {
          res.render('invoice', {
             user: req.user,
             patient: patient,
             total: totalr,
             index: factnum,
             vid: vid,
             discount: discount,
             modepaiement: req.query.vmp,
             date: d.substring(0,10).split("-").reverse().join("/")
          });
          logCambridge(req.user.username,"Affichage de la facture N°:" + factnum,"Show");
        }

          });
  });
/*
	router.get('/invoice/:id', isAuthenticated, function(req, res){


    var index = Getcounter();
    //console.log("index: " + index);
    var total = 0;
    var d = new Date();
    Patient.findById(req.params.id, function(err, patient){
      for (i=0; i< patient.visites.length; i++){
        if(patient.visites[i].clotured === false){
        total = total + patient.visites[i].prix;
        }
      }


    if (err) {
        console.log('GET Error: There was a problem retrieving: ' + err);
    } else {
    res.render('invoice', {
       user: req.user,
       patient: patient,
       total: total,
       index: index,
       remise: discount,
       date: d.getDate() + "/" + (Number(d.getMonth())+1).toString() + "/" + d.getFullYear()
    });
   }

   });

 	 //res.render('invoice', { user: req.user });
  });
*/
	router.get('/tabrdv', isAuthenticated, function(req, res){


    Events.find(function (err, events){
    var datenow =  new Date();
    var dtnow = datenow.toISOString();
    res.render('todayevents', { user: req.user, text: 'Tableau des RDVs', events: events, datenow: dtnow});

    });

  });

	router.get('/tabinst', isAuthenticated, function(req, res){
 	 res.render('tabinst', { user: req.user, text: 'Tableau des instances'});
  });

	router.get('/tabcons', isAuthenticated, function(req, res){

		Patient.find(function (err, patient){
		res.render('tabcons', { user: req.user, text: 'Tableau des consultations', patient: patient});
    logCambridge(req.user.username,"Consultation de la liste des factures","Show");
		});
  });





	router.get('/addvisite/:id', isAuthenticated, function(req, res){



		Patient.findById(req.params.id, function(err, patients){

    Product.find(function(err, product){
     Prog.find(function(err, prog){
       console.log(prog);
       if (err) {
  				 console.log('GET Error: There was a problem retrieving: ' + err);
  		 } else {
  		 res.render('visite', {
  				user: req.user,
  				patients: patients,
          products: product,
          progs: prog
  		 });
       logCambridge(req.user.username,"Consultation de la page visite","Consultation");
  		}

     });



    });


		});

	});


  router.post('/addvisite/:id', isAuthenticated, function(req, res){

  Counter.findById("57b1acb23e31e6c1948d010c", function (err, counter){
    var tt = counter.counter;
    tt = tt + 1;
    //counter.counter = tt;
    var d = new Date();
    var mask = "000000";
    //d.getDate() + "/" + (Number(d.getMonth())+1).toString() + "/" + d.getFullYear()
    inc = d.getFullYear() + (Number(d.getMonth())+1).toString() +"-"+ mask.substring(0,6-tt.toString().length) + tt.toString();
    //console.log(tt);
    counter.update({
          counter: tt
    },function (err, counterID){
      if(err){
        console.log('GET Error: There was a problem retrieving: ' + err);

      }else{

        Prog.findOne({progname: req.body.prog}, function(err, prog){
          //var ob = JSON.parse({});
          console.log(("|"+req.body.obj+"|").trim());
          console.log((req.body.obj == "CONSULTATION")?"OK":JSON.parse(req.body.obj));
          var obj = {}; //(req.body.obj == undefined)?{}:JSON.parse(req.body.obj);
          var facturenum = inc ;
          var visites = {
            poid: req.body.poid,
            taille: req.body.taille,
            prog: req.body.prog,
            daterdv: new Date(),
            prix: prog.progprice, //SetPrice(req.body.prog)[0],
            descprod: prog.progdesc, //SetPrice(req.body.prog)[1],
            comment: req.body.comment,
            consultant: req.user.lastName + " " + req.user.firstName,
            clotured: false,
            products: obj,
            factnum: facturenum
          };


          //var numdossier = req.body.numdossier;

          Patient.findById(req.params.id, function (err, patients) {
            patients.visites.push(visites);

            patients.update({
              visites: patients.visites
              //numdossier: numdossier
            },function (err, patientsID){
              if(err){
                console.log('GET Error: There was a problem retrieving: ' + err);
                res.redirect('/home');
              }else{
                res.redirect("/viewpat/" + patients._id);

              }
            });
            //res.render('visite', { user: req.user, patients: patients});
          });
        });
}




    });

  });

});
router.get('/listprog', isAuthenticated, function(req, res){

  Prog.find(function(err, prog){

    res.render('listprog', {user: req.user, progs: prog});
     logCambridge(req.user.username,"Consultation de la page liste des programmes.","Consultation");

  });

});


router.get('/editprogone/:id', isAuthenticated, function(req, res){

  Prog.findById(req.params.id, function(err, prog){

    res.render('editprogone', {user: req.user, progs: prog});

  });

});


router.post('/editprogone/:id', isAuthenticated, function(req, res){


  Prog.findById(req.params.id, function (err, prog) {

    prog.update({
      progname: req.body.progname,
      progdesc: req.body.progdesc,
      progprice: req.body.progprice


    },function (err, progID){
      if(err){
        console.log('GET Error: There was a problem retrieving: ' + err);
        res.redirect('/editprogone' +  prog._id);
      }else{
        res.redirect("/listprog/");
      }
    })

   });





});





router.get('/listprog/:prog_id', isAuthenticated, function(req, res){
  logCambridge(req.user.username,"Supression du programme ID: " + req.params.prog_id + " avec succès","Delete");
  Prog.remove({
    _id: req.params.prog_id
  }, function(err, prog) {
    if (err)
      res.send(err);
      res.redirect("/listprog");
    // res.json({ message: 'Prog successfully deleted!' });
  });
});






  router.get('/cloture/:id', isAuthenticated, function(req, res){

    var vid = req.query.vid;
    var pid = req.query.pid;
    var facture = {};

    Patient.findById(req.params.id,function(err, patients){


        for (var i=0; i < patients.visites.length; i++){
              if(patients.visites[i]._id.toString() === vid.toString()){
                var tt = patients.visites[i];
                tt.clotured = true;
                patients.visites[i] = tt;
                facture = tt;
              }
        }



        patients.update({
          visites: patients.visites
        },function (err, patientsID){
          if(err){
            console.log('GET Error: There was a problem retrieving: ' + err);
            res.redirect('/home');
          }else{


            var caisse = new Caisse();

            caisse.datein = new Date().toISOString();
            caisse.motif = facture.factnum;
            caisse.modepaiement = facture.modepaiement;
            caisse.montant = (facture.prix - ((facture.prix * facture.discount)/100)) * 1.20;

            caisse.save(function(err) {
                if (err)
                    res.send(err);
            })

            res.redirect("/tabcons");
          }
        })

      });


  });


  router.get('/addremise/:id', isAuthenticated, function(req, res){

    var vid = req.query.vid;
    var pid = req.query.pid;
    var discount = req.query.discount;
  // console.log(discount);

    Patient.findById(req.params.id,function(err, patients){


        for (var i=0; i < patients.visites.length; i++){
              if(patients.visites[i]._id.toString() === vid.toString()){
                var tt = patients.visites[i];
                tt.discount = discount;
                patients.visites[i] = tt;
              }
        }
        patients.update({
          visites: patients.visites
        },function (err, patientsID){
          if(err){
            console.log('GET Error: There was a problem retrieving: ' + err);
            res.redirect('/home');
          }else{
            res.redirect("/tabcons");

          }
        })

      });


  });

  router.post('/addremise/:id', isAuthenticated, function(req, res){

    var vid = req.query.vid;
    // var pid = req.query.pid;
    var discount = req.body.discount.match(/\d+/)[0];


    // console.log(discount);

    Patient.findById(req.params.id,function(err, patients){


        for (var i=0; i < patients.visites.length; i++){
              if(patients.visites[i]._id.toString() === vid.toString()){
                var tt = patients.visites[i];
                tt.discount = discount;
                patients.visites[i] = tt;
              }
        }
        patients.update({
          visites: patients.visites
        },function (err, patientsID){
          if(err){
            console.log('GET Error: There was a problem retrieving: ' + err);
            res.redirect('/home');
          }else{
            res.redirect("/tabcons");
              logCambridge(req.user.username,"Mise à jour de la remise. PatientID:" + req.params.id + " VisiteID: " + vid + " Valeur de la remise: " + discount,"Update");
          }
        })

      });


  });

/* add mode de paiement */
router.post('/addmodepaiement/:id', isAuthenticated, function(req, res){
   console.log(req.params.id);
   var vid = req.query.vid;
   var mp = req.body.modepaiement;
   Patient.findById(req.params.id,function(err, patients){


       for (var i=0; i < patients.visites.length; i++){
             if(patients.visites[i]._id.toString() === vid.toString()){
               var tt = patients.visites[i];
               tt.modepaiement = mp;
               patients.visites[i] = tt;
             }
       }
       patients.update({
         visites: patients.visites
       },function (err, patientsID){
         if(err){
           console.log('GET Error: There was a problem retrieving: ' + err);
           res.redirect('/home');
         }else{
           res.redirect("/tabcons");
           logCambridge(req.user.username,"Mise à jour de la remise. PatientID:" + req.params.id + " VisiteID: " + vid + " Mode de paiement: " + mp,"Update");
         }
       })

     });

      // console.log(pid);
      // res.contentType('json');
      // res.send({ some: 'json' });
    });


	router.get('/addpat', isAuthenticated, function(req, res){
	 console.log(req.query.eventsid);

	 if(req.query.eventsid !== undefined){

	 			SetisPatient(req.query.eventsid);

	 }

 	 res.render('addpat', { user: req.user, nom: req.query.nom, prenom: req.query.prenom, phone: req.query.phone});
   logCambridge(req.user.username,"Consultation de la page nouveau patient.","Consultation");
  });

	router.post('/addpat', isAuthenticated, function(req, res){

/*				if(req.query.eventsid !== undefined){

						SetisPatient(req.query.eventsid);

			 }*/

        //SetisPatient(req.query.eventsid);

		    var patient = new Patient();
		    patient.patientnom = req.body.name;
		    patient.patientprenom = req.body.prenom;
				patient.email = req.body.email;
        patient.ville = req.body.ville;
				patient.occupation = req.body.occupation;
				patient.telephone = req.body.phone;
				patient.textarea = req.body.textarea;
				patient.cin = req.body.cin;
				patient.dob = req.body.dob;
				patient.statu = req.body.statu;
				patient.alergies = req.body.alergies;
				patient.poidinit = req.body.poid;
				patient.tailleinit = req.body.taille;
				patient.bmiinit = req.body.bmi; //((patient.poidinit/(patient.tailleinit/100*patient.tailleinit/100)).toPrecision(2))
        patient.question1 = req.body.question1;
        patient.question2 = req.body.question2;
        patient.question3 = req.body.question3;

		    patient.save(function(err) {
		        if (err)
		            {res.send(err);}
else {
  logCambridge(req.user.username,"Enregistrer un nouveau patient.","insert");
  res.redirect('/listpat');
}

		    });
  });
/*show lispat*/
	router.get('/listpat', isAuthenticated, function(req, res){

		    Patient.find(function (err, patient){
		    res.render('listpat', { user: req.user, patient: patient});
        logCambridge(req.user.username,"Consultation de la liste des patients.","Show");
		  });
  });



	router.get('/listpat/:patient_id', isAuthenticated, function(req, res){
    logCambridge(req.user.username,"Supression du patient ID: " + req.params.patient_id + " avec succès","Delete");
		Patient.remove({
			_id: req.params.patient_id
		}, function(err, patient) {
			if (err)
				res.send(err);
        res.redirect('/listpat');
		  // res.json({ message: 'Parents successfully deleted!' });
	  });
  });

  router.get('/editpat/:id', isAuthenticated, function(req, res){
		Patient.findById(req.params.id, function(err, patients){

		 if (err) {
				 console.log('GET Error: There was a problem retrieving: ' + err);
		 } else {
		 res.render('editpat', {
				user: req.user,
				patients: patients
		 });
		}

		});

	});

  router.post('/editpat/:id', isAuthenticated, function(req, res){

		var name = req.body.name;
		var prenom = req.body.prenom;
		var email = req.body.email;
		var ville = req.body.ville;
		var alergies = req.body.alergies;
		var taille = req.body.taille;
		var poid = req.body.poid;
		var bmi = req.body.bmi;
		var occupation = req.body.occupation;
		var phone = req.body.phone;
		var textarea = req.body.textarea;
		var cin = req.body.cin;
		var dob = req.body.dob;
		var statu = req.body.statu;
    var question1 = req.body.question1;
    var question2 = req.body.question2;
    var question3 = req.body.question3;

		Patient.findById(req.params.id, function (err, patients) {
      // console.log(question1);
      // console.log(question2);
      // console.log(question3);
			patients.update({
				patientnom: name,
				patientprenom: prenom,
				email: email,
				ville: ville,
				alergies: alergies,
				tailleinit: taille,
				poidinit: poid,
				bmiinit: bmi,
				occupation: occupation,
				telephone: phone,
				textarea: textarea,
				cin: cin,
				dob: dob,
				statu: statu,
        question1: question1,
        question2: question2,
        question3:  question3
			},function (err, patientsID){
				if(err){
					console.log('GET Error: There was a problem retrieving: ' + err);
					res.redirect('/listpat');
				}else{
          logCambridge(req.user.username,"Modification du patient : " + req.body.name + " " + req.body.prenom + " avec succès","Update");
					res.redirect("/viewpat/" + patients._id);
				}
			})

		 });





	});




	router.get('/addrdv', isAuthenticated, function(req, res){
 	 res.render('addrdv', { user: req.user, text: 'Ajout des RDVs'});
  });

	router.post('/addrdv', isAuthenticated, function(req, res){

		   var events = new Events();
			 events.title = req.body.name + " " + req.body.prenom;
			 var startdate = req.body.daterdv.split("/", 3);
			 var starthour = req.body.heurerdv.split(":", 3);
			 events.start = startdate[2]+"-"+startdate[0]+"-"+startdate[1]+"T"+starthour[0]+":"+starthour[1]+":"+starthour[2]+".000Z";
			 events.end = startdate[2]+"-"+startdate[0]+"-"+startdate[1]+"T"+starthour[0]+":"+(Number(starthour[1])+20).toString()+":"+starthour[2]+".000Z";
			 //2016-08-15T12:00:00.000Z
			 events.phone = req.body.phone;
		   events.allDay = false;
			 events.isPatient = false;
			 events.color = "#44689F";



			 events.save(function(err) {
		 			if (err)
		 					res.send(err);

		 			res.redirect('/listrdv');
		 	  });

  });

  router.get('/addrdv/:id', isAuthenticated, function(req, res){


     Patient.findById(req.params.id, function (err, patient) {
       var title = patient.patientnom + " " + patient.patientprenom;
       res.render('oldpataddrdv', { user: req.user, patient: patient, title: title});

      })

  });



  router.post('/addrdv/:id', isAuthenticated, function(req, res){


     Patient.findById(req.params.id, function (err, patient) {

       var events = new Events();
			 events.title = patient.patientnom + " " + patient.patientprenom;
			 var startdate = req.body.end.split("/", 3);
			 var starthour = req.body.start.split(":", 3);
       console.log(startdate);
			 events.start = startdate[2]+"-"+startdate[0]+"-"+startdate[1]+"T"+starthour[0]+":"+starthour[1]+":"+starthour[2]+".000Z";
			 events.end = startdate[2]+"-"+startdate[0]+"-"+startdate[1]+"T"+starthour[0]+":"+(Number(starthour[1])+20).toString()+":"+starthour[2]+".000Z";
			 //2016-08-15T12:00:00.000Z
			 events.phone = patient.telephone;
		   events.allDay = false;
			 events.isPatient = true;
			 events.color = "#689F44";

       events.save(function(err) {
            if (err)
                res.send(err);

            res.redirect('/listrdv');
          });

     })

      //res.send("OK OK");

  });

	router.get('/listrdv', isAuthenticated, function(req, res){
   res.render('listrdv', { user: req.user, text: 'Listes des RDVs'});
   logCambridge(req.user.username,"Consultation de la liste des RDVs.","Show");
  });

  router.get('/events', isAuthenticated, function(req, res){
			Events.find(function (err, events){
			res.send(events);
		});
  });

	router.get('/getpatients', isAuthenticated, function(req, res){
			Patient.find(function (err, patient){
			res.send(patient);
		});
  });


	router.get('/test', isAuthenticated, function(req, res){



    res.render('test', {user: req.user, tt: "Prog 1"});


  });


	router.get('/editrdv/:id', isAuthenticated, function(req, res){

/*     Events.findById(req.params.id, function (err, events) {
	        if (err) {
	            console.log('GET Error: There was a problem retrieving: ' + err);
	        } else {
	            console.log('GET Retrieving ID: ' + events._id);
							console.log(events.title.split(" ",2));


	                       var tab = events.title.split(" ", 2);
												 console.log(tab[0]);
												 console.log(tab[1]);
	                       res.render('editrdv', { user: req.user,
	                          nom: tab[0],
														prenom: tab[1],
														start: events.start,
														end: events.end,
														phone: events.phone,
														allDay: events.allDay
	                      });



	        }
	    });*/


			Events.findById(req.params.id, function(err, events){
/*
				res.render('editrdv', { user: req.user,
					 title: events.title,
					 start: events.start,
					 end: events.end,
					 phone: events.phone,
					 allDay: events.allDay,
					 id: events._id
			 });
			 */
			 var hh = Gethour(events.start);
			 var dd = Getdate(events.end);
			 if (err) {
					 console.log('GET Error: There was a problem retrieving: ' + err);
			 } else {
			 res.render('editrdv', {
				  user: req.user,
					events: events,
					start: hh,
					end: dd
			 });
		 	}

			});

	});

  router.get('/editevents/:id', isAuthenticated, function(req, res){

		Events.findById(req.params.id, function(err, events){

			res.render('events', {
				 title: events.title,
				 start: events.start,
				 end: events.end,
				 phone: events.phone,
				 allDay: events.allDay,
				 id: events._id
		 });
		});


	});

/*
  router.post('/editevents/:id', isAuthenticated, function(req, res){

		var title = req.body.titlef;
		var start = req.body.startf;
		var phone = req.body.phonef;
		var end = req.body.endf;
		var allDay = req.body.allDayf;


		Events.findById(req.params.id, function (err, events){
			events.update({
						title: title,
						start: start,
						end: end,
						phone: phone,
						allDay: allDay
			},function (err, eventsID){
				if(err){
					console.log('GET Error: There was a problem retrieving: ' + err );
					res.redirect('/listrdv');
				}else{
					res.redirect("/editevents/" + events._id);
				}
			})
		});



	});
*/



	router.post('/editrdv/:id', isAuthenticated, function(req, res){

		 /*var nom = req.body.name;
		 var prenom = req.body.prenom;*/
		 var title = req.body.title;
		 var phone = req.body.phone;
		 var startdate = req.body.end.split("/", 3);
		 var starthour = req.body.start.split(":", 3);
		 var start = startdate[2]+"-"+startdate[0]+"-"+startdate[1]+"T"+starthour[0]+":"+starthour[1]+":"+starthour[2]+".000Z";
		 var end = startdate[2]+"-"+startdate[0]+"-"+startdate[1]+"T"+starthour[0]+":"+(Number(starthour[1])+20).toString()+":"+starthour[2]+".000Z";
     //2016-08-15T12:00:00.000Z

		 //var start = req.body.start;
		 //var end = req.body.end;
		 //var id = req.params.id;


		 Events.findById(req.params.id, function (err, events) {

			 events.update({
				     title: title,
						 start: start,
						 end: end,
						 allDay: false,
						 phone: phone
			 },function (err, eventsID){
				 if(err){
					 console.log('GET Error: There was a problem retrieving: ' + err);
					 res.redirect('/listrdv');
				 }else{
					 res.redirect("/listrdv");
				 }
			 })

			});

	});


	router.get('/viewpat/:id', isAuthenticated, function(req, res){

     Patient.findById(req.params.id, function (err, patient) {
	        if (err) {
	            console.log('GET Error: There was a problem retrieving: ' + err);
	        } else {
	            //console.log('GET Retrieving ID: ' + patient._id);
							res.render('viewpat', { user: req.user,
								nom: patient.patientnom,
								prenom: patient.patientprenom,
								email: patient.email,
								phone: patient.telephone,
								cin: patient.cin,
								ville: patient.ville,
								dob: patient.dob,
								poid: patient.poidinit,
								taille: patient.tailleinit,
								// ((poid/(taille/100*taille/100)).toPrecision(2))
								bmi: ((patient.poidinit/(patient.tailleinit/100*patient.tailleinit/100)).toPrecision(2)),
								occupation: patient.occupation,
								statu: patient.statu,
								numdossier: patient.numdossier,
								id: patient._id,
							  visites: patient.visites });

	        }
	    });

	});

	router.get('/events/:id', isAuthenticated, function(req, res){

     Events.findById(req.params.id, function (err, events) {
	        if (err) {
	            console.log('GET Error: There was a problem retrieving: ' + err);
	        } else {
	            //console.log('GET Retrieving ID: ' + patient._id);
							res.render('events', { user: req.user,
								title: events.title,
								start: events.start,
								end: events.end,
								phone: events.phone,
								allDay: events.allDay

							});
						}
	    });

	});



  router.post('/counter', isAuthenticated, function(req, res){

		   var counter = new Counter();
       counter.counter = 1;
       counter.name = "Facturation";


			 counter.save(function(err) {
		 			if (err)
		 					res.send(err);

          res.redirect('/counter');
		 	  });



  });

  router.get('/listsessions', isAuthenticated, function(req, res){
      console.log(req.session);
      res.render('listsessions', {user: req.user, session: req.session.passport});
      logCambridge(req.user.username,"Consultation de la liste des sessions.","Show");
  });



 router.get('/editprog', isAuthenticated, function(req, res){
   Prog.find(function (err, prog){

   Product.find(function(err, product){

     Depot.find({depotname: 'Siege' }, function(err, depot){
       //console.log(depot);
       res.render('editprog', {user: req.user, progs: prog, products: product, depot: depot});
       //res.send(JSON.stringify(depot));
     }).limit(10);

   });

   });

    });




 router.post('/updateprogdetail', isAuthenticated, function(req, res){

   var obj = JSON.parse(req.body.obj);
   var progone = req.body.progname.toString();

   Prog.findOne({progname: progone}, function(err, prog){
     for(i=0; i < obj.length; i++){
       prog.products.push(obj[i]);
     }

     prog.update({
       products: prog.products
     }, function (err, progID){
       if(err){
         console.log('GET Error: There was a problem retrieving: ' + err);
         res.redirect('/home');
       }else{
         res.redirect("/editprog");
       }
     })

   });


 });


 router.get('/addprog', isAuthenticated, function(req, res){
   res.render('addprog', {user: req.user});
 });


 router.post('/addprog', isAuthenticated, function(req, res){


       var prog = new Prog();
       prog.progname = req.body.progname;
       prog.progprice = req.body.progprice;
       prog.progdesc = req.body.progdesc;
       prog.maxunite = req.body.maxunite;

       console.log(prog);

       prog.save(function(err) {
           if (err){
               res.send(err);
          }else {
              logCambridge(req.user.username,"Ajout du programme : " + req.body.progname +  " avec succès","Insert");
              res.redirect('/listprog');
         }
       });
 });

 router.post('/addprod', isAuthenticated, function(req, res){


       var product = new Product();


       product.prodname = req.body.prodname;
       product.prodcode = req.body.prodcode;
       product.extra = req.body.extra ? true : false;
       product.qtemin = req.body.qtemin;

       console.log(product.extra);



      product.save(function(err) {
           if (err)
               {res.send(err);}
          else
           {
             logCambridge(req.user.username,"Ajout du produit : " + req.body.prodname +  " avec succès","Insert");
             res.redirect('/listprod');
           }
       });

 });

 router.get('/listprod', isAuthenticated, function(req, res){
   Depot.find(function(err, depots){
   Product.find(function (err, prod){
      // Depotinout.aggregate([{ $match : { depotname:"Depot Meknes" } },{ $group: { _id: '$prodid', totalUnits: { $sum: "$prodqtemv" } } }],(function (err, stock){
     Depotinout.aggregate([ [ { $group : { _id: { "prodid": "$prodid", "depotname": "$depotname" }, totalUnits: { $sum: "$prodqtemv" } } } ] ],(function (err, stock){
        res.render('listprod', {user: req.user, prods: prod, stock: stock,depots: depots});
        logCambridge(req.user.username,"Consultation de la liste des produits.","Show");
     }));

   });
  });
});





 // router.get('/listinout', isAuthenticated, function(req, res){
 //   console.log("wafiiiiiiiiiiiiiiiiiiiik by all");
 //      Depotinout.find(function(err, result){
 //       res.render('listinout', {user: req.user, inout: result});
 //       //res.json(result);
 //     });
 //
 //
 // });
 router.get('/listinout/:prodid', isAuthenticated, function(req, res){
   var depotname=req.query.depotname;
      Depotinout.find({prodid: req.params.prodid,depotname: depotname},function(err, result){
       res.render('listinout', {user: req.user, inout: result});
       //res.json(result);
     });


 });

router.get('/productstock', isAuthenticated, function(req, res){

      res.render('productstock', {user: req.user});

});

 router.get('/stockin', isAuthenticated, function(req, res){
   var dt = new Date().toISOString();
   //s.split("").reverse().join("")
  Provider.find(function (err, provider){
   Product.find(function(err, prod){
     Depot.find(function(err, depot){
       res.render('stockin', {user: req.user, prods: prod, depots: depot, providers: provider,dt: dt.substring(0,10).split("-").reverse().join("/")});
     });
    });
  });

 });





 router.post('/stockin', isAuthenticated, function(req, res){


   var datesys = new Date();

   var depotinout = new Depotinout();

   var ss = req.body.prodinfo.split('|');

    depotinout.depotname = req.body.depot;
    depotinout.prodid = ss[0].trim();
    depotinout.prodcode = ss[1].trim();
    depotinout.prodname = ss[2].trim();
    depotinout.prodqteinit = Number(req.body.prodqte);
    depotinout.prodqtemv = ConvertToUnit( Number(req.body.prodqte), req.body.produnite);
    depotinout.produnite = req.body.produnite;
    depotinout.datein = (datesys.getDate() + '/' + (datesys.getMonth()+1) + '/' +  datesys.getFullYear() + ':' + datesys.getHours()+ 'h' + datesys.getMinutes() + 'mm');
    depotinout.dateexp = req.body.dateexp;
    depotinout.dateachat = req.body.dateachat;
    depotinout.prixachat = Number(req.body.prixachat);
    depotinout.prixvente = Number(req.body.prixvente);
    depotinout.fournisseur = req.body.fournisseur;
    depotinout.numbc = req.body.numbc;
    depotinout.numbl = req.body.numbl;
    depotinout.motifin = "ACHAT NORMAL";

    depotinout.save(function(err){
       if (err)
           {res.send(err);}
      else {

        res.redirect('/listinout');
      }

       //res.json("OK success");
   });

 });
 router.delete('/listinout/:stockin_id', isAuthenticated, function(req, res){
   logCambridge(req.user.username,"Supression entrée en stock ID: " + req.params.stockin_id + " avec succès","Delete");
    Depotinout.remove({
      _id: req.params.stockin_id
    }, function(err, stockin) {
      if (err)
        res.send(err);

      res.json({ message: 'stockin successfully deleted!' });
    });
  });

  router.get('/editstockin/:id', isAuthenticated, function(req, res){

    var dt = new Date().toISOString();
    Provider.find(function (err, provider){
        Product.find(function(err, prod){
          Depot.find(function(err, depot){
            Depotinout.findById(req.params.id, function(err, stockin){
         		   if (err) {
                 console.log('GET Error: There was a problem retrieving: ' + err);
               } else {
                 res.render('editstockin', {user: req.user,providers: provider, prods: prod, depots: depot,stockin: stockin, dt: dt.substring(0,10).split("-").reverse().join("/")});
               }
         });
        });
      });
    });
	});

  router.post('/editstockin/:id', isAuthenticated, function(req, res){
    var ss = req.body.prodinfo.split('|');
    var  prodidv = ss[0].trim();
    var  prodcodev = ss[1].trim();
    var  prodnamev = ss[2].trim();
    Depotinout.findById(req.params.id, function (err, stockin) {
    var totalqteout=0;
      for(j=0; j < stockin.out.length; j++){
        totalqteout=totalqteout + Number(stockin.out[j].qteout);
      }
      stockin.update({

         depotname: req.body.depot,
         prodid: prodidv,
         prodcode: prodcodev,
         prodname: prodnamev,
         prodqteinit: Number(req.body.prodqte),
         prodqtemv:ConvertToUnit( Number(req.body.prodqte), req.body.produnite) - totalqteout,//ConvertToUnit( Number(req.body.prodqte), req.body.produnite),
         produnite: req.body.produnite,
         //datein = (datesys.getDate() + '/' + (datesys.getMonth()+1) + '/' +  datesys.getFullYear() + ':' + datesys.getHours()+ 'h' + datesys.getMinutes() + 'mm');
         dateexp: req.body.dateexp,
         dateachat: req.body.dateachat,
         prixachat: Number(req.body.prixachat),
         prixvente: Number(req.body.prixvente),
         fournisseur: req.body.fournisseur,
         numbc: req.body.numbc,
         numbl: req.body.numbl,
         motifin: "ACHAT NORMAL"

      },function (err, stockinID){
        if(err){
          console.log('GET Error: There was a problem retrieving: ' + err);

        }else{
          res.redirect("/listinout/"+ prodidv);
        }
      })

     });
     });

 router.get('/stockout/:id', isAuthenticated, function(req, res){

  // var dt = new Date().toISOString();
   Depotinout.findById(req.params.id, function(err, stockin){
     Patient.find({}, {patientnom: 1, patientprenom: 1, visites: 1},function (err, patient){
      if (err) {
        console.log('GET Error: There was a problem retrieving: ' + err);
      } else {
        res.render('stockout', {user: req.user, stockin:stockin, patient:patient});
      }
    });
   });
});

router.post('/stockout/:id', isAuthenticated, function(req, res){
var datesys = new Date().toISOString();;
var qte=req.body.qteout;
var prodid=req.body.prodid2;
var factnum=req.body.factureclt;
var motifout=req.body.motifout;

 var stockout = {
  qteout: qte,
  dateout:datesys,// (datesys.getDate() + '/' + (datesys.getMonth()+1) + '/' +  datesys.getFullYear() + ':' + datesys.getHours()+ 'h' + datesys.getMinutes() + 'mm'),
  motifout: motifout,
  factnum: factnum
};
Depotinout.findById(req.params.id, function (err, stockin) {
  stockin.out.push(stockout);

  stockin.update({
    out: stockin.out,
    prodqtemv: stockin.prodqtemv - qte,
    },function (err, stockinID){
      if(err){
        console.log('GET Error: There was a problem retrieving: ' + err);

      }else{
        res.redirect("/listinout/" + prodid);
      }
    })

   });
   });
/* Retour client au stock */
router.post('/stockretourclient/:id', isAuthenticated, function(req, res){
var datesys = new Date().toISOString();;
var qte=req.body.qteout;
var prodid=req.body.prodid2;
var factnum=req.body.factureclt;
var motifout=req.body.motifout;

 var stockout = {
  qteout: qte * (-1),
  dateout:datesys,// (datesys.getDate() + '/' + (datesys.getMonth()+1) + '/' +  datesys.getFullYear() + ':' + datesys.getHours()+ 'h' + datesys.getMinutes() + 'mm'),
  motifout: motifout,
  factnum: factnum
};
Depotinout.findById(req.params.id, function (err, stockin) {
  stockin.out.push(stockout);

  stockin.update({
    out: stockin.out,
    prodqtemv: Number(stockin.prodqtemv) + Number(qte),
    },function (err, stockinID){
      if(err){
        console.log('GET Error: There was a problem retrieving: ' + err);

      }else{
        res.redirect("/listinout/" + prodid);
      }
    })

   });
   });
   /* Autre nature de sortie  */
   router.post('/stockoutexception/:id', isAuthenticated, function(req, res){
   var datesys = new Date();
   var qte=req.body.qteoutexception;
   var prodid=req.body.prodid2exception;
   var motif=req.body.motifexception;

    var stockout = {
     qteout: qte,
     dateout: (datesys.getDate() + '/' + (datesys.getMonth()+1) + '/' +  datesys.getFullYear() + ':' + datesys.getHours()+ 'h' + datesys.getMinutes() + 'mm'),
     motifout: motif
   };
   Depotinout.findById(req.params.id, function (err, stockin) {
     stockin.out.push(stockout);

     stockin.update({
       out: stockin.out,
       prodqtemv: stockin.prodqtemv - qte,
       },function (err, stockinID){
         if(err){
           console.log('GET Error: There was a problem retrieving: ' + err);

         }else{
           res.redirect("/listinout/" + prodid);
         }
       })

      });
      });

/* Retour Client au stock */
router.get('/stockretourclt/:id', isAuthenticated, function(req, res){
 // var dt = new Date().toISOString();
  Depotinout.findById(req.params.id, function(err, stockin){
    Patient.find({}, {patientnom: 1, patientprenom: 1, visites: 1},function (err, patient){
     if (err) {
       console.log('GET Error: There was a problem retrieving: ' + err);
     } else {
       res.render('stockretourclt', {user: req.user, stockin:stockin, patient:patient});
     }
   });
  });
});

   router.get('/liststockout/:id', isAuthenticated, function(req, res){

     var vid = req.query.vid;

    // var dt = new Date().toISOString();
     Depotinout.findById(req.params.id, function(err, stockin){
        if (err) {
          console.log('GET Error: There was a problem retrieving: ' + err);
        } else {
          res.render('liststockout', {user: req.user, stockin:stockin});
        }
     });
   });
/* Annuler une livraison produit */
router.get('/livraisoncancel/:id', isAuthenticated, function(req, res){
var patientid=req.query.pid;
var visiteid = req.query.vid;

Depotinout.find({ out:{
                      $elemMatch:{
                         prodidinvisite:req.params.id
                      }
            } },{_id:1, out:1}, function (err, stockin) {

for(i=0; i < stockin.length; i++){


  for(j=0; j<stockin[i].out.length; j++){

    if (stockin[i].out[j].prodidinvisite==req.params.id){
        deletestockout_function(stockin[i]._id,stockin[i].out[j].qteout,stockin[i].out[j]._id)
      }
    }
  }
});
SetDelivred(patientid,visiteid,req.params.id,false);

res.redirect("/livraison");
 });
/* function deleting out stock used by livraisoncancel */
var deletestockout_function = function(dinoutid,qteoutdel,outid){
  Depotinout.findById(dinoutid, function (err, stockinbis) {

    stockinbis.update({

      prodqtemv: Number(stockinbis.prodqtemv) + Number(qteoutdel),
    },function (err, pstockinbisID){
      if(err){
        console.log('GET Error: There was a problem retrieving: ' + err);

      }else{

            Depotinout.update({_id: dinoutid}, {$pull: {out: {_id: outid}}} , function(err, stockinout){
            if (err) {
              console.log('GET Error: There was a problem retrieving: ' + err);
            }else{

            }
        });
      }
    })
})
}


/* Suppression ligne retour client au stock */
router.delete('/deletestockretourclt', isAuthenticated, function(req, res){

    var stockinoutid = req.query.id;
    var outid = req.query.outid;
    var qteoutdel=req.query.outqte;

    Depotinout.findById(stockinoutid, function (err, stockin) {
    stockin.update({
      prodqtemv: Number(stockin.prodqtemv) + Number(qteoutdel),
    },function (err, providersID){
      if(err){
        console.log('GET Error: There was a problem retrieving: ' + err);

      }else{

            Depotinout.update({_id: stockinoutid}, {$pull: {out: {_id: outid}}} , function(err, stockin){
            if (err) {
              console.log('GET Error: There was a problem retrieving: ' + err);
            } else {
              res.redirect("/listinout");
            }
        });
      }
    })

   });
});

 router.get('/adddepot', isAuthenticated, function(req, res){
   res.render('adddepot', {user: req.user});
 });

 router.post('/adddepot', isAuthenticated, function(req, res){

    var depot = new Depot();

    depot.depotname = req.body.depotname;
    depot.inout = [];

    depot.save(function(err) {
         if (err)
             {res.send(err);}
        else {
          logCambridge(req.user.username,"Ajout dépôt :" + req.body.depotname + "   avec succès","Insert");
          res.redirect('/listdepots');
        }

     });


 });

 router.get('/addinventory', isAuthenticated, function(req, res){
   Depot.find(function (err, depots){
      res.render('addinventory', { user: req.user, depots: depots});
   });
 });
/* Add new inventory width détail */
    router.post('/addinventory', isAuthenticated, function(req, res){
      var depot=req.body.depotname;
        var inventory = new Inventory();
        inventory.nameinventory = req.body.nameinventory;
        inventory.depotname = req.body.depotname;
        inventory.dateinventory = req.body.dateinventory;

        Product.find(function(err, prod){
            Depotinout.aggregate([{ "$match": { "depotname": depot } },{ $group: { _id: '$prodid', totalUnits: { $sum: "$prodqtemv" } } }],(function (err, stock){

                for(i=0; i < prod.length; i++){
                    for(j=0; j < stock.length; j++){
                        if (stock[j]._id == prod[i]._id){

                            inventory.detail.push({ "prodid": stock[j]._id,"prodcode": prod[i].prodcode, "prodname": prod[i].prodname,"qtetheory": stock[j].totalUnits, "qteinventory": 0 });
                        }
                    }
                }
                inventory.save(function(err) {
                 if (err)
                     {res.send(err);}
                else {
                  logCambridge(req.user.username,"Ajout inventaire :" + req.body.nameinventory + "   avec succès","Insert");
                  res.redirect('/listinventory');
                }

                });
            }));

        });

    });
/* Save Detail inventory */
router.post('/saveinventorydetail/:id', isAuthenticated, function(req, res){
  	Inventory.findById(req.params.id, function(err, inventory){
      inventory.detail = JSON.parse(req.body.obj);
      inventory.update({
        detail: inventory.detail
                },function (err, inventory){
                  if(err){
                    console.log('GET Error: There was a problem retrieving: ' + err);
                    res.redirect('/listinventory');
                  }else{
                      logCambridge(req.user.username,"Mise à jour du détail inventaire ID:" + req.params.id + "   avec succès","Update");
                    res.redirect('/detailinventory/' + req.params.id);
                  }
                });

           });

//    inventory.findById(req.params.id, function(err, inventorydetail){
//
//       inventorydetail.detail = JSON.parse(req.body.obj);
//
//       inventorydetail.update({
//           detail: inventorydetail.detail
//         },function (err, inventory){
//           if(err){
//             console.log('GET Error: There was a problem retrieving: ' + err);
//             res.redirect('/listinventory');
//           }else{
//             res.redirect('/listinventory');
//           }
//         })
//    });
});
 /* Get edit inventory*/
   router.get('/editinventory/:id', isAuthenticated, function(req, res){
 	 Depot.find(function (err, depots){
     	Inventory.findById(req.params.id, function(err, inventory){

 		 if (err) {
 				 console.log('GET Error: There was a problem retrieving: ' + err);
 		 } else {
 		 res.render('editinventory', {user: req.user,	depot: depots, inventory: inventory });
 		}

 		});
  });
 });


    /*POST edit inventory*/
    router.post('/editinventory/:id', isAuthenticated, function(req, res){
        Inventory.findById(req.params.id, function (err, inventory) {
          inventory.update({
          nameinventory: req.body.nameinventory,
          dateinventory: req.body.dateinventory,
          depotname: req.body.depotname,
          cloture: req.body.cloture
        },function (err, prodID){
          if(err){
            console.log('GET Error: There was a problem retrieving: ' + err);
          }else{
            logCambridge(req.user.username,"Mise à jour inventaire:" + req.body.nameinventory + "   avec succès","Update");
            res.redirect("/listinventory");
          }
        })

       });
       });

/* Delete inventory */
router.get('/delinventory/:id', isAuthenticated, function(req, res){
   logCambridge(req.user.username,"Supression inventaire ID: " + req.params.id + " avec succès","Delete");
  Inventory.remove({
    _id: req.params.id
  }, function(err, result) {
    if (err)
      res.send(err);
      res.redirect("/listinventory");
    // res.json({ message: 'Inventory successfully deleted!' });
  });

});

/* Detail Inventory */

 router.get('/detailinventory/:id', isAuthenticated, function(req, res){
   	Inventory.findById(req.params.id, function(err, result){

    if (err) {
        console.log('GET Error: There was a problem retrieving: ' + err);
      } else {
        res.render('detailinventory', {user: req.user, inventory: result });
      }

    });
 });

router.get('/detailinventory', isAuthenticated, function(req, res){
   	Inventory.find(function(err, result){

    if (err) {
        console.log('GET Error: There was a problem retrieving: ' + err);
      } else {
        res.render('detailinventory', {user: req.user, inventory: result });
      }

    });
 });




/* load data jsgrid detail inventory */
router.get('/getdata/:id', isAuthenticated, function(req, res){
  Inventory.findById(req.params.id , function(err, result){
        res.json(result.detail);
  });
});
	/* Handle Logout */
	router.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/');
	});



    return router;
}



/*******PROVIDERS************/
/* show listproviders */
router.get('/listproviders', isAuthenticated, function(req, res){

  Provider.find(function (err, provider){
  res.render('listproviders', { user: req.user, text: 'Tableau des consultations', prov: provider});
  logCambridge(req.user.username,"Consultation de la liste des fournisseurs","Show");
  });
});
/*show new provider*/
router.get('/addprovider', isAuthenticated, function(req, res){
	 	 res.render('addprovider', { user: req.user});
  });

/*POST add provider*/
router.post('/addprov', isAuthenticated, function(req, res){

      var provider = new Provider();
      provider.raisonsociale = req.body.raisonsociale;
      provider.telephone = req.body.telephone;
      provider.fax = req.body.fax;
      provider.mail = req.body.mail;
      provider.adresse = req.body.adresse;
      provider.site = req.body.site;
      provider.autre = req.body.autre;


      provider.save(function(err) {
          if (err)
              {res.send(err);}
          else {
            logCambridge(req.user.username,"Ajout du nouveau fournisseur :" + req.body.raisonsociale + "   avec succès","Insert");
            res.redirect('/listproviders');
          }

      });
});

/* Get edit provider*/
  router.get('/editprovider/:id', isAuthenticated, function(req, res){
		Provider.findById(req.params.id, function(err, providers){

		 if (err) {
				 console.log('GET Error: There was a problem retrieving: ' + err);
		 } else {
		 res.render('editprovider', {
				user: req.user,
				providers: providers
		 });
		}

		});

	});


/*POST edit provider*/
router.post('/editprov/:id', isAuthenticated, function(req, res){
    Provider.findById(req.params.id, function (err, providers) {
var old_providername=providers.raisonsociale;
    providers.update({
      raisonsociale: req.body.raisonsociale,
      telephone: req.body.telephone,
      fax: req.body.fax,
      mail: req.body.mail,
      adresse: req.body.adresse,
      site: req.body.site,
      autre: req.body.autre
    },function (err, providersID){
      if(err){
        console.log('GET Error: There was a problem retrieving: ' + err);

      }else{
        Depotinout.find({fournisseur: old_providername}, function (err, depotinouts) {

          depotinouts.forEach(function(depotinout) {
           depotinout.fournisseur = req.body.raisonsociale;
           depotinout.save();
          });


          })
        logCambridge(req.user.username,"Mise à jour fournisseur :" + req.body.raisonsociale + "   avec succès","Update");
        res.redirect("/listproviders");
      }
    })

   });
   });

/*Delete proviprovidersprovidersder*/
router.get('/listproviders/:provider_id', isAuthenticated, function(req, res){
  logCambridge(req.user.username,"Supression fournisseur ID: " + req.params.provider_id + " avec succès","Delete");
  Provider.remove({
    _id: req.params.provider_id
  }, function(err, provider) {
    if (err)
      res.send(err);

    // res.json({ message: 'Provider successfully deleted!' });
      res.redirect("/listproviders");
  });
});
/*******DEPOTS************/
/*show listdepot*/
router.get('/listdepots', isAuthenticated, function(req, res){

  Depot.find(function (err, depots){
  res.render('listdepots', { user: req.user, text: 'Tableau des dépôts', depot: depots});
  logCambridge(req.user.username,"Consultation de la liste des dépôts","Show");
  });
});

/* Get edit depot*/
  router.get('/editdepot/:id', isAuthenticated, function(req, res){
		Depot.findById(req.params.id, function(err, depot){

		 if (err) {
				 console.log('GET Error: There was a problem retrieving: ' + err);
		 } else {
		 res.render('editdepot', {
				user: req.user,
				depot: depot
		 });
		}

		});

	});
/*POST edit depot*/
router.post('/editdepot/:id', isAuthenticated, function(req, res){
  Depot.findById(req.params.id, function (err, depot) {
    var old_depotname=depot.depotname;
      depot.update({
              depotname: req.body.depotname
              },function (err, depotID){
              if(err){
                console.log('GET Error: There was a problem retrieving: ' + err);

              }else{
                // res.redirect("/listdepots");
                Depotinout.find({depotname: old_depotname}, function (err, depotinouts) {

                  depotinouts.forEach(function(depotinout) {
                   depotinout.depotname = req.body.depotname;
                   depotinout.save();
                  });


                  })
                  logCambridge(req.user.username,"Mise à jour dépôt :" + req.body.depotname + "   avec succès","Update");
                    res.redirect("/listdepots");

              }
      })
    })
  });



   /*Delete depot*/
   router.get('/listdepots/:depot_id', isAuthenticated, function(req, res){
logCambridge(req.user.username,"Supression dépôt ID: " + req.params.depot_id + " avec succès","Delete");
     Depot.remove({
       _id: req.params.depot_id
     }, function(err, depot) {
       if (err)
         res.send(err);
         res.redirect("/listdepots");
      //  res.json({ message: 'Depot successfully deleted!' });
     });
   });
/* end DEPOT***************************************/

/*****PRODUCT*****************/
    /*get add prod*/
     router.get('/addprod', isAuthenticated, function(req, res){

       Product.find(function(err, prod){
         res.render('addprod', {user: req.user, prods: prod});
       });

     });



     /* Get edit prod*/
       router.get('/editprod/:id', isAuthenticated, function(req, res){
     		Product.findById(req.params.id, function(err, prod){

     		 if (err) {
     				 console.log('GET Error: There was a problem retrieving: ' + err);
     		 } else {
     		 res.render('editprod', {
     				user: req.user,
     				prod: prod
     		 });
     		}

     		});

     	});


   /*POST edit prod*/
   router.post('/editprod/:id', isAuthenticated, function(req, res){
       Product.findById(req.params.id, function (err, prod) {
         var old_prodcode=prod.prodcode;
         var old_prodname=prod.prodname;
         prod.update({
           prodcode: req.body.prodcode,
           prodname: req.body.prodname,
           extra: req.body.extra,
           qtemin: req.body.qtemin
       },function (err, prodID){
         if(err){
           console.log('GET Error: There was a problem retrieving: ' + err);
         }else{
           Depotinout.find({prodcode: old_prodcode}, function (err, depotinouts) {

                      depotinouts.forEach(function(depotinout) {
                       depotinout.prodcode = req.body.prodcode.trim();
                       depotinout.prodname = req.body.prodname.trim();
                       depotinout.save();
                      });


           })

/* Mise a jour infos product in visites  */
Patient.find({"visites.products": {$elemMatch: {"prodid":req.params.id}}},{_id:1},function(err,result){

for (i=0;i<result.length;i++){

  Patient.findById(result[i]._id,function(err, patients){
       patients.visites.forEach(function(visite){
       visite.products.forEach(function(product){

                     if (product.prodid == req.params.id) {
                           product.prodcode = req.body.prodcode.trim();
                           product.prodname = req.body.prodname.trim();

                           patients.save(function(err, doc){
                             if (err){
                               console.log('Erreur mise à jour des informations produits dans visite');
                             }else{
                               console.log('Mise à jour des informations produits dans visite');
                             }

                           });

                     }
                 });

           });
     });
}
});
     logCambridge(req.user.username,"Mise à jour produit: " + req.body.prodname + " avec succès","Update");
           res.redirect("/listprod");
         }
       })

      });
      });

      router.get('/userlist', isAuthenticated, function(req, res){

        Users.find(function(err,users){
          res.render('userlist', {user: req.user, users: users});
          logCambridge(req.user.username,"Consultation de la liste des utilisateurs","Show");
        });


      });

      router.get('/listuser/:id', isAuthenticated, function(req, res){



        Users.findById(req.params.id, function(err, users){
          var gp = users.permissions.gp;
          console.log(gp);
          var gs = users.permissions.gs;

          var su = users.permissions.su;


          console.log(gs);
          res.render('edituser', {user: req.user, users: users, gp: gp, gs: gs, su: su});
          // res.json(users.permissions.gp);

        });

      });

      router.post('/listuser/:id', isAuthenticated, function(req, res){


        Users.findById(req.params.id, function (err, users) {
          if(req.body.password !== ''){
            users.update({
            username: req.body.username,
             firstName: req.body.firstName,
              lastName: req.body.lastName,
               email: req.body.email,
              password: createHash(req.body.password),
              permissions: {gp: req.body.gp, gs: req.body.gs, su: req.body.su}
          },function (err, usersID){
            if(err){
              console.log('GET Error: There was a problem retrieving: ' + err);
            }else{
              res.redirect("/userlist");

            }
          })
        }else{
          console.log(req.body.gp);
          console.log(req.body.gs);
          users.update({
          username: req.body.username,
           firstName: req.body.firstName,
            lastName: req.body.lastName,
             email: req.body.email,
             permissions: {gp: req.body.gp, gs: req.body.gs, su: req.body.su}
        },function (err, usersID){
          if(err){
            console.log('GET Error: There was a problem retrieving: ' + err);
          }else{
            res.redirect("/userlist");
          }
        })

        }


        });
logCambridge(req.user.username,"Mise à jour des données de l'utilisateur:" + req.body.username  ,"Update");
      });

      router.get('/adduser', isAuthenticated, function(req, res){

        res.render('adduser', {user: req.user});

      });

      router.get('/usercheck/:username', isAuthenticated,function(req, res){

        Users.findOne({username: req.params.username},function(err,result){
          if(result !== null){
              console.log(result.username);
              if(result.username == req.params.username){

                console.log({result: true});
                res.json({result: true});


              }

          }else{
            console.log({result: false});
            res.json({result: false});
          }



        });

      });


      router.post('/adduser', isAuthenticated, function(req, res){

        console.log(req.body.gp);
        console.log(req.body.gs);
        var users = new Users();
        users.firstName = req.body.firstName;
        users.lastName = req.body.lastName;
        users.email = req.body.email;
        users.password = createHash(req.body.password);
        users.username = req.body.username;
        users.permissions = {gs: req.body.gs, gp: req.body.gp,  su: req.body.su};

        Users.findOne({username: req.body.username},function(err,result){
          if(result !== null){
              console.log(result.username);
              if(result.username !== req.body.username){

                users.save(function(err) {
                    if (err)
                        res.send(err);

                    res.redirect('/userlist');
                });

              }
              res.redirect('/userlist');
          }else{

            users.save(function(err) {
                if (err)
                    {res.send(err);}
                else {
                  logCambridge(req.user.username,"Ajout utilisateur: " + req.body.username + " avec succès","Insert");
                }
                res.redirect('/userlist');
            });

          }

        });




      })

      router.delete('/deluser/:id', isAuthenticated, function(req, res){
        logCambridge(req.user.username,"Supression utilisateur ID: " + req.params.id + " avec succès","Delete");
        Users.remove({
          _id: req.params.id
        }, function(err, users) {
          if (err)
            res.send(err);

          res.json({ message: 'User successfully deleted!' });
        });

      });

      /*Delete prod*/
      router.get('/listprod/:prod_id', isAuthenticated, function(req, res){
logCambridge(req.user.username,"Supression produit ID: " + req.params.prod_id + " avec succès","Delete");
        Product.remove({
          _id: req.params.prod_id
        }, function(err, prod) {
          if (err)
            res.send(err);
            res.redirect('/listprod');
          // res.json({ message: 'Product successfully deleted!' });
        });
      });


      router.get('/gallery', isAuthenticated, function(req, res){
        res.render('productgallery', {user: req.user});
      });

      router.get('/stockinbk', isAuthenticated, function(req, res){

        var dt = new Date().toISOString();
        //s.split("").reverse().join("")
       Provider.find(function (err, provider){
        Product.find(function(err, prod){
          Depot.find(function(err, depot){
            res.render('stockinbk', {user: req.user, prods: prod, depots: depot, providers: provider,dt: dt.substring(0,10).split("-").reverse().join("/")});
          });
         });
       });

      });



      router.post('/stockinbk', isAuthenticated, function(req, res){
        var datesys = new Date().toISOString();
         var tt = JSON.parse(req.body.obj);
         var to = [];

         for(i=0; i<tt.length; i++){
           var depotinout = new Depotinout();

           depotinout.depotname = req.body.depot;
           depotinout.prodid = tt[i].prodid.trim();
           depotinout.prodcode = tt[i].prodcode.trim();
           depotinout.prodname = tt[i].prodname.trim();
           depotinout.prodqteinit = Number(tt[i].prodqte);
           depotinout.prodqtemv = ConvertToUnit(Number(tt[i].prodqte), tt[i].produnite);
           depotinout.produnite = tt[i].produnite;
           depotinout.datein =datesys;// (datesys.getDate() + '/' + (datesys.getMonth()+1) + '/' +  datesys.getFullYear() + ':' + datesys.getHours()+ 'h' + datesys.getMinutes() + 'mm');
           depotinout.dateexp =tt[i].prodexpdate;
           depotinout.dateachat = req.body.dateachat;
           depotinout.prixachat = tt[i].prixachat;
           depotinout.prixvente = tt[i].prixvente;
           depotinout.fournisseur = req.body.provider;
           depotinout.numbc = req.body.numbc;
           depotinout.numbl = req.body.numbl;
           depotinout.motifin = "ACHAT NORMAL";

           depotinout.save(function(err){
              if (err)
                  {res.send(err);}
                  else {
                    logCambridge(req.user.username,"Nouvelle entrée en stock. Dépôt: " + req.body.depot  + " avec succès","Insert");
                  }
          });
          }

        //  res.send(to);
        res.redirect('/listprod');
         /*depotinout.save(function(err){
            if (err)
                res.send(err);

            res.redirect('/listinout');
            //res.json("OK success");
        });*/

      });


      router.get('/historyin', isAuthenticated, function(req, res){
        var now = new Date();
        var str = now.getUTCDate()  + "/" +
          (now.getUTCMonth() + 1).toString() +
          "/" + now.getUTCFullYear().toString() + " " + now.getUTCHours() +
          ":" + now.getUTCMinutes();
           Depotinout.find(function(err, result){
            res.render('historyin', {user: req.user, stockin: result,date:str});
            logCambridge(req.user.username,"Consultation de l'historique des entrées en stock","Show");
            //res.json(result);
          });
      });

      // depotname: String,
      // prodid: String,
      // prodcode: String,
      // prodname: String,
      // qteout: {type: Number, min:0},
      // dateout: String,
      // motifout: String,
      // factnum:String
      router.get('/historyout', isAuthenticated, function(req, res){
        var now = new Date();
        var str = now.getUTCDate()  + "/" +
          (now.getUTCMonth() + 1).toString() +
          "/" + now.getUTCFullYear().toString() + " " + now.getUTCHours() +
          ":" + now.getUTCMinutes();
           Depotinout.find(function(err, result){
            res.render('historyout', {user: req.user, stockout: result,date:str});
            logCambridge(req.user.username,"Consultation de l'historique des sorties du stock'","Show");
            //res.json(result);
          });
      });

      router.get('/listinventory', isAuthenticated, function(req, res){
        // var dt = new Date().toISOString();
        var now = new Date();
        var str = now.getUTCDate()  + "/" +
          (now.getUTCMonth() + 1).toString() +
          "/" + now.getUTCFullYear().toString() + " " + now.getUTCHours() +
          ":" + now.getUTCMinutes();
        Inventory.find(function (err, inventorys){
        res.render('listinventory', { user: req.user, text: 'Liste des inventaires', inventory: inventorys, date: str});
        logCambridge(req.user.username,"Consultation de la liste des inventaires","Show");
        });
      });


router.get('/invoicereport', isAuthenticated, function(req, res){

    var tab = [];
    var tpe = 0;
    var cheq = 0;
    var cash = 0;
    var daterdv = req.query.daterdv;
    Patient.find(function(err, result){

        for(i=0; i<result.length; i++){
            for(j=0; j<result[i].visites.length; j++){

                if(result[i].visites[j].daterdv.substring(0,15) == daterdv){
                  console.log(daterdv);

                if(result[i].visites[j].modepaiement == "TPE"){

                    tpe = tpe + ((result[i].visites[j].prix -  ((result[i].visites[j].prix * result[i].visites[j].discount)/100))*1.20);

                }else if(result[i].visites[j].modepaiement == "Chéque"){

                    cheq = cheq + ((result[i].visites[j].prix -  ((result[i].visites[j].prix * result[i].visites[j].discount)/100))*1.20);

                }else if(result[i].visites[j].modepaiement == "Cash"){

                    cash = cash + ((result[i].visites[j].prix -  ((result[i].visites[j].prix * result[i].visites[j].discount)/100))*1.20);

                }

                tab.push({prix: result[i].visites[j].prix, mp: result[i].visites[j].modepaiement});


            }
        }
        }
        // console.log(cash);
        // console.log(tpe);
        // console.log(cheq);


//        res.json(tab);
        res.render('invoicereport', {user : req.user, patient: result, totalcash: cash, totaltpe: tpe, totalcheque: cheq, daterdv: daterdv});
    });

//
});


// db.getCollection('caisses').aggregate([
//                      { $match: { datein: "Wed Aug 17 2016 04:18:53 GMT-0400 (EDT)" } },
//                      { $group: { _id: "$modepaiement", total: { $sum: "$montant" } } },
//                      { $sort: { total: -1 } }
//                    ])







// Caisse
router.get('/caisse', isAuthenticated, function(req, res){


  if(req.query.startdate == undefined || req.query.enddate == undefined){


    var startdate = new Date(Date().substring(0,15) + " 00:00:00");
    var enddate = new Date(Date().substring(0,15) + " 23:59:59");

    console.log(startdate);
    console.log(enddate);

  }else{
    var startdate = req.query.startdate; //"2016-08-01T00:00:00.000Z";
    var enddate = req.query.enddate;   //"2016-11-31T23:59:59.999Z";
  }

  var tab = [];
  var tpe = 0;
  var cheq = 0;
  var cash = 0;




  Caisse.find({"datein" : { $gte : new Date(startdate).toISOString() , $lte : new Date(enddate).toISOString() }}, function(err, result){

    for(i=0; i<result.length; i++){


            if(result[i].modepaiement == "TPE"){

                tpe = tpe + result[i].montant;

            }else if(result[i].modepaiement == "Chéque"){

                cheq = cheq + result[i].montant;

            }else if(result[i].modepaiement == "Cash"){

                cash = cash + result[i].montant;

            }

            tab.push({prix: result[i].prix, mp: result[i].modepaiement});




    }


    res.render('caisse', {user: req.user, caisse: result, totalcash: cash, totaltpe: tpe, totalcheque: cheq});

  });


});

router.get('/caissein', isAuthenticated, function(req, res){

    res.render('caissein', {user: req.user});

});

router.post('/caisse', isAuthenticated, function(req, res){

  var caisse = new Caisse();

  caisse.datein = new date().toISOString();
  caisse.motif = req.body.motif;
  caisse.modepaiement = req.body.modepaiement;
  caisse.montant = Number(req.body.montant);

  caisse.save(function(err) {
      if (err)
          res.send(err);

      res.redirect('/caisse');

  })

});



router.get('/caisses/:id', isAuthenticated, ff, function(req, res){


  // var startdate = "2016-08-01T00:00:00.000Z"; //req.query.startdate; //
  // var enddate = "2016-11-31T23:59:59.999Z";  //req.query.enddate;   //
  //
  //
  // Caisse.find({"datein" : { $gte : new Date(startdate).toISOString() , $lte : new Date(enddate).toISOString() }}, function(err, result){
  //
  //   res.json(result);
  //
  // });

  // new ISODate("2016-10-10T00:15:31Z")
  // new ISODate("2016-11-10T23:59:59Z")


  res.send("OK OK");

});




router.get('/caisse/:id', isAuthenticated, function(req, res){
logCambridge(req.user.username,"Supression caisse ID: " + req.params.id + " avec succès","Delete");
  Caisse.remove({
    _id: req.params.id
  }, function(err, caisse) {
    if (err)
      res.send(err);

    res.redirect('/caisse');
  });

});
