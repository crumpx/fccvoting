var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var Poll = require('../models/poll');
var Log = require('../models/log');
var useragent = require('express-useragent');
var router = express.Router();

function getColor() {
	var colors = [
	'#F44336',
	'#E91E63',
	'#9C27B0',
	'#673AB7',
	'#3F51B5',
	'#2196F3',
	'#03A9F4',
	'#00BCD4',
	'#009688',
	'#4CAF50',
	'#8BC34A',
	'#CDDC39',
	'#FF5722',
	'#607D8B',
	'#FF3D00',
	'#F57C00'
	];
	return colors[parseInt( Math.random() * 1 + ( Math.random() * (colors.length - 1) ))];
}

/* GET home page. */
router.get('/', function(req, res, next) {
	Poll.find({})
	.sort('-createdAt')
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
	console.log(req.body);
	Account.register(new Account({ username: req.body.username, fullname:req.body.fullname, email: req.body.fullname}),
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
	var id;
	var ownPage = false
	Account.findByUsername(req.params.username).then(function(user){	
		if (req.user)
			if (user.id == req.user.id) {
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

	});

});

router.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});


router.get('/users', function(req, res){
	console.log(req.user);
});


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
		var ownerUrl = "\<a href='/dashboard/" + doc.author._id + "'\>" + doc.author.fullname + "\</a\>"
		console.log(ownerUrl)
		var counts;
		var chartData = {
			type: "pie",
			data: {
				labels: doc.options.map(function(item){
					return item.text;
				}),
				datasets: [{
							data: doc.options.map(function(item){
								return item.count;
							}),
							backgroundColor: doc.options.map(function(item){
								return item.color;
							}),
							borderColor: doc.options.map(function(){
								return getColor();
							}),
							borderWidth: 1
					}]
		},
		options: {
			legend: {
            display: true,
            labels: {           		
                fontColor: "#666",
                padding: 20
            },
            position:'right',
        },

		}
	};
		
		chartData = JSON.stringify(chartData);
		console.log('This is chartData: ', typeof chartData)
		res.render('polls/poll_detail', {chartData: chartData, poll: doc, voted: voted, owner: owner, user: req.user});
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
	console.log('req.body', req.body[opId]);

	log.save(function(err, result){
		if (err) {
			console.log(err);
		} else {
			// console.log(result);
			Poll.findOne({_id:req.params.pollid})
			.update(
				{'options._id': req.body[opId]},
				{$inc: {'options.$.count': 1}}, function(err, result){
					if (err) console.log("ERROR",err);
					// console.log(result);
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
	var story = req.body.story;
	console.log(options);
	options = options.map(function(val){
				if (val.length !== 0) {
					return {text: val, count:0, color: getColor()};
				}
	}).filter(function(val){
		return val !== undefined;
	});

	console.log('options: ', options);

	if (options.length <= 1) {
		res.render('polls/poll',{user:req.user, warning:"You need at least 2 options."});
	}

	var id = req.user._id;

	var poll = new Poll({
		story: story,
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
