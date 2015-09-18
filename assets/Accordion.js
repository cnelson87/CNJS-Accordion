/*
	TITLE: Accordion

	DESCRIPTION: Basic Accordion widget

	VERSION: 0.2.0

	USAGE: var myAccordion = new Accordion('Element', 'Options')
		@param {jQuery Object}
		@param {Object}

	AUTHOR: CN

	DEPENDENCIES:
		- jQuery 2.1.4+
		- greensock
		- Class.js

*/

var Accordion = Class.extend({
	init: function($el, objOptions) {

		// defaults
		this.$window = $(window);
		this.$el = $el;
		this.options = $.extend({
			initialIndex: 0,
			selectorTabs: '.tab a',
			selectorPanels: '.panel',
			activeClass: 'active',
			equalizeHeight: false,
			selfClosing: true,
			animDuration: 0.4,
			animEasing: 'Power4.easeOut',
			customEventPrfx: 'CNJS:Accordion'
		}, objOptions || {});

		// element references
		this.$elTabs = this.$el.find(this.options.selectorTabs);
		this.$elPanels = this.$el.find(this.options.selectorPanels);

		// setup & properties
		this.isAnimating = false;
		this._len = this.$elPanels.length;
		if (this.options.initialIndex >= this._len) {this.options.initialIndex = 0;}
		this.currentIndex = this.options.initialIndex;
		this.prevIndex = false;
		this.maxHeight = 'auto';

		// check url hash to override currentIndex
		this.focusOnInit = false;
		this.urlHash = window.location.hash.replace('#','') || false;
		if (this.urlHash) {
			for (var i=0; i<this._len; i++) {
				if (this.$elPanels[i].id === this.urlHash) {
					this.currentIndex = i;
					this.focusOnInit = true;
					break;
				}
			}
		}

		this.initDOM();

		this.bindEvents();

		$.event.trigger(this.options.customEventPrfx + ':isInitialized', [this.$el]);

	},


/**
*	Private Methods
**/

	initDOM: function() {
		var $elActiveTab = $(this.$elTabs[this.currentIndex]);
		var $elActivePanel = $(this.$elPanels[this.currentIndex]);

		this.$el.attr({'role':'tablist'});
		this.$elTabs.attr({'role':'tab'});
		this.$elPanels.attr({'role':'tabpanel', 'tabindex':'-1'});

		// equalize items height
		if (this.options.equalizeHeight) {
			this.heightEqualizer = new HeightEqualizer(this.$elPanels);
			this.maxHeight = this.heightEqualizer.maxHeight;
		}

		$elActiveTab.addClass(this.options.activeClass);
		$elActivePanel.addClass(this.options.activeClass);

		TweenMax.set(this.$elPanels, {
			display: 'none',
			height: this.maxHeight,
		});

		TweenMax.set($elActivePanel, {
			display: 'block',
			height: this.maxHeight,
		});

		if (this.focusOnInit) {
			$(window).load(function() {
				$('html, body').animate({scrollTop:0}, 1);
				$elActivePanel.focus();
			});
		}

	},

	bindEvents: function() {

		this.$elTabs.on('click', function(event) {
			event.preventDefault();
			if (!this.isAnimating) {
				this.__clickTab(event);
			}
		}.bind(this));

		this.$window.on('resize', function(event) {
			this.__onWindowResize(event);
		}.bind(this));

	},


/**
*	Event Handlers
**/

	__onWindowResize: function(event) {
		if (this.options.equalizeHeight) {
			this.heightEqualizer.resetHeight();
			this.maxHeight = this.heightEqualizer.maxHeight;
		}
	},

	__clickTab: function(event) {
		var index = this.$elTabs.index(event.currentTarget);

		// if selfClosing then check various states of acordion
		if (this.options.selfClosing) {

			// currentIndex is open
			if (this.currentIndex === index) {
				this.prevIndex = false;
				this.currentIndex = -1;
				this.animateSelfClosed(index);

			// currentIndex is -1, all are closed
			} else if (this.currentIndex === -1) {
				this.prevIndex = false;
				this.currentIndex = index;
				this.animateSelfOpen(index);

			// default behaviour
			} else {
				this.prevIndex = this.currentIndex;
				this.currentIndex = index;
				this.animateAccordion();
			}

		// else accordion operates as normal
		} else {

			if (this.currentIndex === index) {
				this.$elPanels[index].focus();
			} else {
				this.prevIndex = this.currentIndex;
				this.currentIndex = index;
				this.animateAccordion();
			}

		}

	},


/**
*	Public Methods
**/

	animateSelfClosed: function(index) {
		var self = this;
		var $elInactiveTab = $(this.$elTabs[index]);
		var $elInactivePanel = $(this.$elPanels[index]);

		this.isAnimating = true;

		$elInactiveTab.removeClass(this.options.activeClass);
		$elInactivePanel.removeClass(this.options.activeClass);

		TweenMax.to($elInactivePanel, this.options.animDuration, {
			height: 0,
			ease: self.options.animEasing,
			onComplete: function() {
				self.isAnimating = false;
				$elInactiveTab.focus();
				TweenMax.set($elInactivePanel, {
					display: 'none',
					height: self.maxHeight
				});
			}
		});

		$.event.trigger(this.options.customEventPrfx + ':panelClosed');

	},

	animateSelfOpen: function(index) {
		var self = this;
		var $elActiveTab = $(this.$elTabs[index]);
		var $elActivePanel = $(this.$elPanels[index]);
		var height = $elActivePanel.height();

		this.isAnimating = true;

		$elActiveTab.addClass(this.options.activeClass);
		$elActivePanel.addClass(this.options.activeClass);


		if (this.options.equalizeHeight) {
			height = this.maxHeight;
			TweenMax.set($elActivePanel, {
				height: 0
			});
		}

		TweenMax.to($elActivePanel, this.options.animDuration, {
			display: 'block',
			height: height,
			ease: self.options.animEasing,
			onComplete: function() {
				self.isAnimating = false;
				$elActivePanel.focus();
				TweenMax.set($elActivePanel, {
					height: self.maxHeight
				});
			}
		});

		$.event.trigger(this.options.customEventPrfx + ':panelOpened', [this.currentIndex]);

	},

	animateAccordion: function() {
		var self = this;
		var $elInactiveTab = $(this.$elTabs[this.prevIndex]);
		var $elInactivePanel = $(this.$elPanels[this.prevIndex]);
		var $elActiveTab = $(this.$elTabs[this.currentIndex]);
		var $elActivePanel = $(this.$elPanels[this.currentIndex]);
		var height = $elActivePanel.height();

		this.isAnimating = true;

		//update tabs
		$elInactiveTab.removeClass(this.options.activeClass);
		$elActiveTab.addClass(this.options.activeClass);

		//update panels
		$elInactivePanel.removeClass(this.options.activeClass);
		$elActivePanel.addClass(this.options.activeClass);

		if (this.options.equalizeHeight) {
			height = this.maxHeight;
			TweenMax.set($elActivePanel, {
				height: 0
			});
		}

		TweenMax.to($elActivePanel, this.options.animDuration, {
			display: 'block',
			height: height,
			ease: self.options.animEasing,
			onComplete: function() {
				self.isAnimating = false;
				$elActivePanel.focus();
				TweenMax.set($elActivePanel, {
					height: self.maxHeight
				});
			}
		});

		TweenMax.to($elInactivePanel, this.options.animDuration, {
			height: 0,
			ease: self.options.animEasing,
			onComplete: function() {
				TweenMax.set($elInactivePanel, {
					display: 'none',
					height: self.maxHeight
				});
			}
		});

		$.event.trigger(this.options.customEventPrfx + ':panelOpened', [this.currentIndex]);

	}

});

//uncomment to use as a browserify module
//module.exports = Accordion;
