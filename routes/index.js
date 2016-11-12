var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var Poll = require('../models/poll');
var Log = require('../models/log');
var useragent = require('express-useragent');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	Poll.find({}).select({title:1, author:1, disabled:1})
	.populate('author')
	.exec(function(err, result){
	if (err) console.log(err);
	res.render('index', {polls: result, title: "All Polls", user:req.user});
	});
}); 

router.get('/register', function(req, res){
	res.render('users/register', {});
});

router.post('/register', function(req, res){
	Account.register(new Account({ username: req.body.username}),
		req.body.password, function(err, account){
			if (err) {
				console.log(err);
				return res.render('users/register', {account: account, error:err});
			}
			passport.authenticate('local')(req, res, function(){
				res.redirect('/');
			});
		});
});

router.get('/login', function(req, res){
	res.render('users/login', {user:req.user});
});

router.post('/login', passport.authenticate('local'), function(req, res){
	res.redirect('/');
});

router.get('/dashboard', function(req, res){
	if (!req.user) {
		res.redirect('login');
	} else {
		var ownPoll, votedOn;
		Poll.find({author: req.user._id}, function(err, docs){
			if (err) console.log(err);
			ownPoll = docs;
			Log.find({voter: req.user._id})
			.populate('poll')
			.exec(function(err, docs){
				if (err) console.log(err);
				votedOn = docs;
				res.render('users/dashboard', {ownPage: true, user: req.user, ownPoll:ownPoll, votedOn: votedOn});
		});
		});
	}
});

router.post('/dashboard', function(req, res){
	var password = req.body.newPassword;
	var user = req.user.username;

	Account.findByUsername(user).then(function(user){
		if(user) {
			user.setPassword(password, function(){
			user.save();
			res.status(200).redirect('/');
			});
		} else {
			res.status(500).json({message: 'this user does not exist'});
		}
	}, function(err){
		console.log(err);
	});
});

router.get('/dashboard/:username',function(req, res){
	var id = req.user._id;
	var ownPage = false
	Account.findByUsername(req.params.username).then(function(user){
		if (user.id == id) {
			ownPage = true;
		} 

		var ownPoll, votedOn;
		Poll.find({author: user._id}, function(err, docs){
			if (err) console.log(err);
			ownPoll = docs;
			Log.find({voter: user._id})
			.populate('poll')
			.exec(function(err, docs){
				if (err) console.log(err);
				votedOn = docs;
				res.render('users/dashboard', {ownPage: ownPage, user: user, ownPoll:ownPoll, votedOn: votedOn});
		});
		});

	})

})

router.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});


router.get('/users', function(req, res){
	console.log(req.user);
});

// router.get('/polls', function(req, res){
// 	Poll.find({}).select({title:1, options:1, author:1}).exec(function(err, result){
// 		if (err) console.log(err);
// 		console.log(result);
// 		res.render('polls/polls', {polls: result, title: "All Polls"});
// 	});
// }); 

router.get('/poll/:pollid', function(req, res){
	console.log("You came from ",req.url);
	var opId = req.params.pollid;
	//check cookies, user, and ip
	var ip = req.ip;
	var user = req.user;
	var agent = useragent.parse(req.headers['user-agent']);
	var cookie = agent.browser;
	var voted=false;
	var query;
	var owner=false;

	if (!user) {
		if(req.cookies[opId]) {
			//no user, with cookie
			voted = true;
		} else {
			//no user, no cookie, should check ip
			query = { ip: req.ip, poll: opId};
		}
	} else {
			query = {voter:user._id, poll: opId};
		}

	if (!voted) {
		Log.find(query, function(err, doc){
			if (err) console.log('There is an error when querying Log database\n',err);
			if (doc.length) {
				voted = true;
			} else {
				voted = false;
			}
		});
	}

	Poll.findOne({_id:req.params.pollid}).populate('author').exec(function(err, doc){
		if (err) console.log(err);
		if (user) {
			owner = user.username == doc.author.username;
		}
		res.render('polls/poll_detail', {poll: doc, voted: voted, owner: owner, user: req.user});
	});
}) ;

router.post('/poll/:pollid', function(req, res){
	var opId = req.params.pollid;
	var voter = req.user ? req.user._id:'';
	var ip = req.ip;
	var log;
	if (voter) {
		log = new Log({ip: ip, voter: voter, poll: opId});	 
	} else {
		log = new Log({ip: ip, poll: opId});	
	}

	log.save(function(err, result){
		if (err) {
			console.log(err);
		} else {
			console.log(result);
			Poll.findOne({_id:req.params.pollid})
			.update(
				{'options._id': req.body[opId]},
				{$inc: {'options.$.count': 1}}, function(err, result){
					if (err) console.log("ERROR",err);
					console.log(result);
					res.cookie(opId, true);
					res.redirect(opId);
				});
		}
	});	
}); 

router.get('/new/poll', function(req, res){
	if (req.user === undefined){
		res.redirect('/');
	} else {
		res.render('polls/poll',{user:req.user});
	}
});

router.post('/new/poll', function(req, res){
	console.log(typeof req.body.polltitle);
	var title = req.body.polltitle;
	var options = req.body.options;
	options = options.map(function(val){
		return {text: val, count:0};	
	});

	var id = req.user._id;
	console.log(options);
	console.log({
		title: title,
		options: options,
		author: id
	});

	var poll = new Poll({
		title: title,
		options: options,
		author: id
	});
	poll.save(function(err){
		if (err) {console.log(err);}
		else {console.log('ok~~~SAVED!!!');}
	});

	res.redirect('/');
});

router.get('/poll/edit/:id',function(req, res){
	var id = req.params.id;
	if (req.user) {
	Poll.findById(id, function(err, doc){
		if (err) {console.log(err);}
		else {
			res.render('polls/poll_edit', {doc: doc});
		}
	});
	} else {
		res.status(500).redirect('/login');
	}
});

router.post('/poll/edit/:id',function(req, res){
	var id = req.params.id;
	var title = req.body.title;
	var options = Array.isArray(req.body.options)?req.body.options.map(function(val){
		return {text:val, count:0}
	}) : req.body.options;

	Poll.findOne({_id:id})
	.update({title:title}, 
		Array.isArray(options)?{$push: {options:{$each: options}}}:{$push: {options:{text:options, count:0}}}, 
		{upsert:true}, 
		function(err, result){
		if (err) console.log(err);
		res.redirect('/poll/'+id)
	});
});

router.get('/poll/delete/:id',function(req, res){
	var id = req.params.id;
	Poll.remove({_id: id},function(err, result){
		if (err) {console.log(err)}
			else {
				Log.remove({poll:id}, function(err){
					if (err) {console.log(err)}
						else {res.redirect('/dashboard')}
				});
			}
	});
});

router.get('/poll/toggle/:id', function(req, res){
	var id = req.params.id;
	Poll.findOne({_id: id}, function(err, doc){
		doc.update({$set: {disabled: !doc.disabled}}, function(err, result){
			if (err) {console.log(err);}
				else {
				res.redirect('/');
				}
		})
	})
	
});

router.get('/clear', function(req, res){
	  Log.remove({poll:''}, function(err){
    if (err) throw err;
    else {
    	res.redirect('/dashboard')
    }
  });
})

module.exports = router;
