define(function (require) {
    var model = require('./model');
	var gamesFeed = 'https://s3-eu-west-1.amazonaws.com/fa-ads/frontend/matches.json';

	var App = function() {
		this.appContainer = '#app';
		this.loaderPage = model.loaderPage;
		this.betPage = model.betPage;
		this.winPage = model.winPage;
		this.resultsPage = model.resultsPage;
		this.betModel = model.betModel;
		this.matches = model.matchesArray;

		this.importPageData(this.loaderPage, this.appContainer);
		this.getGameFeeds(gamesFeed);
		// this.getMatchupData(gamesFeed);

		window.setTimeout(()=>{
			this.unloadPageData(this.activePage, this.appContainer).then(()=>{
				this.importPageData(this.betPage, this.appContainer);
				this.initEventHandlers();
			});
		}, 3000);
	}

	App.prototype.openAjaxCall = function(template) {
		var xhttp = new XMLHttpRequest();
		xhttp.open("GET", template, false);
		xhttp.send();
		var responseText = xhttp.responseText;

		return responseText;
	}

	App.prototype.importPageData = function(page, container) {
		// Initialize a new document element and set it's contents to the content of #app
		var template = page.template;
		var getTemplateContent = this.openAjaxCall(template);
		var newEle = document.createElement('template');
		newEle.innerHTML = getTemplateContent;
		var clone = document.importNode(newEle.content, true);
		Expand(clone, page);
		document.querySelector(container).appendChild(clone);
		this.activePage = page;
	}

	App.prototype.unloadPageData = function(page, container) {
		var activeEle = document.querySelector('#'+this.activePage.id);
		activeEle.classList.add('fade-out');
	    return new Promise(function(resolve, reject){
	        window.setTimeout(()=> {
				activeEle.style.display = 'none';
				activeEle.parentNode.removeChild(activeEle);
				resolve();
			}, 300);
	    })
	}

	App.prototype.initEventHandlers = function(e) {
		var pageLinks = document.getElementsByClassName('page-link');
		var submitLink = document.getElementsByClassName('submit-link')[0];

		for (var i = pageLinks.length - 1; i >= 0; i--) {
			pageLinks[i].addEventListener("click", loadPageLink);
		};
		submitLink.addEventListener("click", this.formSequence.bind(this));
		// submitLink.addEventListener("click", getTargetValue);
	}

	App.prototype.loadPageLink = function(event) {
		event.preventDefault();
		var target = event.target;
		var targetLink = target.getAttribute('data-rel');
		if (targetLink) {
			this.importPageData(JSON.parse(targetLink));
		}
	}

	App.prototype.insertText = function(tag, text, container) {
		var para = document.createElement(tag);
		var pickText = document.createTextNode(text);
		para.appendChild(pickText);
		container.insertBefore(para, container.childNodes[container.childNodes.length-1]);
	}

	App.prototype.getGameFeeds = function(data) {
		this.matches = this.openAjaxCall(data);
		console.log(this.matches);
		this.setUpMatchPages();
	}

	App.prototype.setUpMatchPages = function() {
		this.currentMatch = this.matches[0];
		// for (var i = this.matches.length - 1; i >= 0; i--) {
		// 	this.matches[i]
		// }
	}

	// App.prototype.getMatchupData = function(data) {
	// 	var matchups = data.matchups;
	// 	for (var i = matchups.length - 1; i >= 0; i--) {
	// 		var homePick = {
	// 			team : (matchups[i].HOME_CITY + ' ' + matchups[i].HOME_MASCOT),
	// 			line : matchups[i].HOME_ML
	// 		};
	// 		var awayPick = {
	// 			team : (matchups[i].VISITOR_CITY + ' ' + matchups[i].VISITOR_MASCOT),
	// 			line : matchups[i].VISITOR_ML
	// 		};
	// 		// var safeBet = Math.min(matchups[i].HOME_ML, matchups[i].VISITOR_ML);
	// 		// var riskyBet = Math.max(matchups[i].HOME_ML, matchups[i].VISITOR_ML);
	// 		if (matchups[i].HOME_ML >= matchups[i].VISITOR_ML) {
	// 			this.betModel.aggressiveArray.push(homePick);
	// 			this.betModel.conservativeArray.push(awayPick);
	// 		} else {
	// 			this.betModel.aggressiveArray.push(awayPick);
	// 			this.betModel.conservativeArray.push(homePick);
	// 		}
	// 	}
	// 	this.betModel.conservativeArray.sort();
	// 	this.betModel.aggressiveArray.sort();
	// 	console.log(this.betModel.conservativeArray, this.betModel.aggressiveArray);
	// }

	App.prototype.formSequence = function(event) {
		event.preventDefault();
		var form = event.target.parentElement;
		var formName = form.classList[0];
		// var formAction = event.target.
		var curValue = form.getElementsByClassName('text-input-value')[0].value;

		if (curValue == '' || curValue <= 0) {
			return false;
		}

		if (curValue) {
			if (formName === 'match-form') {
				this.unloadPageData(this.activePage, this.appContainer).then(()=> {
					this.importPageData(this.matchPage, this.appContainer);
					this.initEventHandlers();
				});
			}
			if (formName === 'risk-form') {
				this.betModel.userRisk = this.winPage.bet.value = eval(curValue);
				this.unloadPageData(this.activePage, this.appContainer).then(()=> {
					this.importPageData(this.winPage, this.appContainer);
					this.initEventHandlers();
				});
			} else if (formName === 'win-form') {
				this.resultsPage.bet.value = this.betModel.userRisk;
				this.betModel.userPayout = this.resultsPage.win.value = eval(curValue);
				this.unloadPageData(this.activePage, this.appContainer).then(()=> {
					this.importPageData(this.resultsPage, this.appContainer);
					if (this.betModel.userRisk > 0 && this.betModel.userPayout > 0) {
						// Need to allow for user toggled aggression level
						this.makePicks(this.betModel.conservativeArray);
					}
				});
			}
		}
	}

	// This is our humble evaluator
	// for just taking in a odds, win, and outputting the multiplier
	// e.g. Giants -150 : 250/150 = 1.6666
	// e.g. Dolphins +170 : 270/100 = 2.7
	App.prototype.evalPick = function(odds) {
		var absOdds = Math.abs(odds);
		var payout = (absOdds + 100);
		var multiplier = Math.abs(absOdds === odds ? (payout / 100) : (payout / absOdds));

		return multiplier;
	}

	// This is our App.prototype.to take in all our games
	// and evaluate the odds for each, then sort them
	// by biggest payout.
	App.prototype.makePicks = function(array) {
		let appWrapper = document.querySelector('.app-wrapper');
		if (this.betModel.picksArray.length > 0) {
			this.betModel.picksArray = [];
			this.betModel.userRisk = this.betModel.userPayout = this.betModel.picksMultiplier = 0;
		}
		for (let i = array.length - 1; i >= 0; i--) {
			let curMultiplier = this.evalPick(array[i].line);
			let workingTotal = 0;
			this.betModel.picksMultiplier += curMultiplier;
			workingTotal = this.betModel.userRisk * this.betModel.picksMultiplier;
			this.betModel.picksArray.push(array[i]);
			if (workingTotal >= this.betModel.userPayout) {
				console.log('goal met! ' + curMultiplier + 'x risk!');
				for (let i = this.betModel.picksArray.length - 1; i >= 0; i--) {
					console.log(this.betModel.picksArray[i].team + ' : ' + this.betModel.picksArray[i].line);
					this.insertText('li',
						(this.betModel.picksArray[i].team + ' : ' + this.betModel.picksArray[i].line),
						document.querySelector('.bet-results-list'));
				}
				this.insertText('p', ('goal met! ' + curMultiplier + 'x risk!'), appWrapper);
				return false;
			}
		}
	}

	var app = new App();
});
