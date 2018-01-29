makeRequest = function (method, url) {
  return new Promise(function (resolve, reject) {
	let xhr = new XMLHttpRequest();
	xhr.open(method, url);
	xhr.onload = function () {
	  if (this.status >= 200 && this.status < 300) {
		resolve(xhr.response);
	  } else {
		reject({
		  status: this.status,
		  statusText: xhr.statusText
		});
	  }
	};
	xhr.onerror = function () {
	  reject({
		status: this.status,
		statusText: xhr.statusText
	  });
	};
	xhr.send();
  });
}

define(function (require) {
	const model = require('./model');
	const gamesFeed = 'https://s3-eu-west-1.amazonaws.com/fa-ads/frontend/matches.json';

	// Our App
	const App = function() {
		this.appContainer = '#app';
		this.loaderPage = model.loaderPage;
		this.betPage = model.betPage;
		this.matchPage = model.matchPage;
		this.winPage = model.winPage;
		this.resultsPage = model.resultsPage;
		this.betModel = model.betModel;
		this.matches = model.matchesArray;

		this.importPageData(this.loaderPage, this.appContainer);
		this.getGameFeeds(gamesFeed);
		// this.getMatchupData(gamesFeed);

		// After 3 sec, hide the loader screen
		window.setTimeout(()=>{
			this.unloadPageData(this.activePage, this.appContainer).then(()=>{
				this.importPageData(this.betPage, this.appContainer);
				this.initEventHandlers();
			});
		}, 3000);
	}

	// GET request
	App.prototype.openAjaxCall = function(template) {
		let xhttp = new XMLHttpRequest();
		xhttp.open("GET", template, false);
		xhttp.send();
		let responseText = xhttp.responseText;

		return responseText;
	}

	// GET request with callback
	App.prototype.openAjaxCallWithCallback = function(template, callback) {
		let func = callback;
		makeRequest('GET', template)
		.then(function (datums) {
			func(datums);
		})
	}

	// Load next view, create DOM for new controller
	App.prototype.importPageData = function(page, container) {
		// Initialize a new document element and set it's contents to the content of #app
		let template = page.template;
		let getTemplateContent = this.openAjaxCall(template);
		let newEle = document.createElement('template');
		newEle.innerHTML = getTemplateContent;
		let clone = document.importNode(newEle.content, true);
		Expand(clone, page);
		document.querySelector(container).appendChild(clone);
		this.activePage = page;
	}

	// Clear current view
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

	// Set up event listeners
	App.prototype.initEventHandlers = function(e) {
		let submitLink = document.getElementsByClassName('submit-link')[0];
		let pickLinks = document.querySelectorAll('.pick-link');

		if (pickLinks.length > 0) {
			for (let i = pickLinks.length - 1; i >= 0; i--) {
				pickLinks[i].addEventListener("click", this.storePick.bind(this));
			}
		}
		if (submitLink) {
			submitLink.addEventListener("click", this.formSequence.bind(this));
			// submitLink.addEventListener("click", getTargetValue);
		}
	}

	// Allows the insertion of text into a container/tag ele
	App.prototype.insertText = function(tag, text, container) {
		let para = document.createElement(tag);
		let pickText = document.createTextNode(text);
		para.appendChild(pickText);
		container.insertBefore(para, container.childNodes[container.childNodes.length-1]);
	}

	// Get the game JSON and then set up the match pages model
	App.prototype.getGameFeeds = function(data) {
		this.openAjaxCallWithCallback(data, (data)=> {
			this.matches = JSON.parse(data).matches;
			console.log(this.matches);
			this.currentMatchIndex = 0;
			this.setUpMatchPages(this.currentMatchIndex);
		});
	}

	// Set our current match from the data
	App.prototype.setUpMatchPages = function(index) {
		this.currentMatch = this.matchPage.form.match = this.matches[index];
		console.log(this.currentMatch);
	}

	// The Main App function to handle View logic
	App.prototype.formSequence = function(event) {
		event.preventDefault();
		let form = event.target.parentElement;
		let formName = form.classList[0];
		let curValue = form.getElementsByClassName('text-input-value')[0].value;

		if (curValue == '' || curValue <= 0) {
			return false;
		}

		let nextPage = this.matchPage;
		// Risk Form
		if (formName === 'risk-form') {
			this.betModel.userRisk = this.winPage.bet.value = eval(curValue);
			this.unloadPageData(this.activePage, this.appContainer).then(()=> {
				this.importPageData(this.matchPage, this.appContainer);
				this.initEventHandlers();
			});
		}
		// Matches Form
		if (formName === 'match-form') {
			this.currentMatchIndex++;
			if (this.currentMatchIndex <= this.matches.length-1) {
				this.setUpMatchPages(this.currentMatchIndex);
			} else {
				// We've gone through all matches
				// Go to Payout screen
				this.resultsPage.bet.value = this.betModel.userRisk;
				this.resultsPage.win.value = this.betModel.userPayout = this.calcParlay(this.betModel.picksArray);
				nextPage = this.resultsPage;
			}
			this.unloadPageData(this.activePage, this.appContainer).then(()=> {
				this.importPageData(nextPage, this.appContainer);
				this.initEventHandlers();
			});
		}
	}

	App.prototype.storePick = function(event) {
		event.preventDefault();
		let target = event.target;
		let pick = target.getAttribute('value') ? target.getAttribute('value') : '0';
		let valStore = document.querySelector('.text-input-value');

		if (pick) {
			if (this.betModel.picksArray.length === this.currentMatchIndex + 1) {
				this.betModel.picksArray[this.currentMatchIndex] = pick;
			} else {
				this.betModel.picksArray.push(pick);
			}
		}
		console.log(this.betModel.picksArray)
		valStore.value = pick;
	}

	// This is our humble evaluator
	// for just taking in a odds, win, and outputting the multiplier
	// e.g. Giants -150 : 250/150 = 1.6666
	// e.g. Dolphins +170 : 270/100 = 2.7
	// App.prototype.evalPick = function(odds) {
	// 	var absOdds = Math.abs(odds);
	// 	var payout = (absOdds + 100);
	// 	var multiplier = Math.abs(absOdds === odds ? (payout / 100) : (payout / absOdds));

	// 	return multiplier;
	// }

	App.prototype.calcParlay = function(array) {
		let total = 1;
		for (let i = array.length - 1; i >= 0; i--) {
			total = total * eval(array[i]);
		}
		return total * this.betModel.userRisk;
	}

	var app = new App();
});
