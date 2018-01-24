define(function () {

	var Model = function() {
		// Our data set
		this.loaderPage = {
		    id: 'loaderPage',
		    template: 'templates/loader-page-controller.html',
		    intro: 'Bet today\'s big matches and win big!',
		    logo: {
		        src: 'logo.svg',
		        url: ''
		    },
		    text_logo: {
		        src: 'text-logo.svg',
		        url: ''
		    },
		    headline_text: 'Welcome to',
		    headline_span: 'The Big Bet',
		    text_soon: '(coming soon)'
		};

		this.betPage = {
		    id: 'betPage',
		    template: 'templates/bet-page-controller.html',
		    logo: {
		        src: 'logo.svg',
		        url: ''
		    },
		    text: 'We\'ll be picking from a few of today\'s biggest matches.',
		    form: {
		        risk: {
		            text: 'How much do you want to bet?',
		            value : 0
		        }
		    }
		};

		this.matchPage = {
		    id: 'matchPage',
		    template: 'templates/match-page-controller.html',
		    logo: {
		        src: 'logo.svg',
		        url: ''
		    },
		    gameId: 0,
		    text: 'Game ',
		    form: {
		    	match : {
					id: 123456,
					kickoff: "Thursday 20:45",
					homeTeam: "Manchester United",
					awayTeam: "Liverpool",
					odds: {
						1: "2.10",
						2: "2.62",
						x: "3.30"
					}
				},
		    }
		};

		this.winPage = {
		    id: 'winPage',
		    template: 'templates/win-page-controller.html',
		    intro: 'We got you covered',
		    logo: {
		        src: 'logo.svg',
		        url: ''
		    },
		    bet: {
		        text: 'bet',
		        value: this.betPage.form.risk.value
		    },
		    form: {
		        win: {
		            text: 'How much do you want to win?',
		            value : 0,
		        }
		    }
		};

		this.resultsPage = {
		    id: 'resultsPage',
		    template: 'templates/results-page-controller.html',
		    logo: {
		        src: 'logo.svg',
		        url: ''
		    },
		    bet: {
		        text: 'bet',
		        value: this.betPage.form.risk.value
		    },
		    win: {
		        text: 'win',
		        value: this.winPage.form.win.value
		    },
		    form: {
		        risk: {
		            text: 'Blah',
		            value : 0
		        }
		    }
		};

		this.matchesArray = [];

		this.betModel = {
		    conservativeArray : [],
		    aggressiveArray : [],
		    picksArray : [],
		    picksMultiplier : 0,
		    userRisk : 0,
		    userPayout : 0
		}

		this.activePage = {
		};
	}

	return new Model;
});
