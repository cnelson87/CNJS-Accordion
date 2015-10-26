/*
	TITLE: Accordion

	DESCRIPTION: Basic Accordion widget

	VERSION: 0.2.6

	USAGE: var myAccordion = new Accordion('Element', 'Options')
		@param {jQuery Object}
		@param {Object}

	AUTHOR: CN

	DEPENDENCIES:
		- jquery 2.1x+
		- greensock
		- Class.js
		- HeightEqualizer.js

*/

var Accordion = Class.extend({
	init: function($el, objOptions) {

		// defaults
		this.$window = $(window);
		this.$htmlBody = $('html, body');
		this.$el = $el;
		this.options = $.extend({
			initialIndex: 0,
			selectorTabs: '.accordion-header a',
			selectorPanels: '.accordion-panel',
			activeClass: 'active',
			equalizeHeight: false,
			selfClosing: true,
			animDuration: 0.4,
			animEasing: 'Power4.easeOut',
			selectorFocusEls: 'a, button, input, select, textarea',
			customEventName: 'CNJS:Accordion'
		}, objOptions || {});

		// element references
		this.$tabs = this.$el.find(this.options.selectorTabs);
		this.$panels = this.$el.find(this.options.selectorPanels);

		// setup & properties
		this._length = this.$panels.length;
		if (this.options.initialIndex >= this._length) {this.options.initialIndex = 0;}
		this.currentIndex = this.options.initialIndex;
		this.previousIndex = null;
		this.heightEqualizer = null;
		this.maxHeight = 'auto';
		this.isAnimating = false;

		// check url hash to override currentIndex
		this.focusOnInit = false;
		this.urlHash = window.location.hash.replace('#','') || false;
		if (this.urlHash) {
			for (var i=0; i<this._length; i++) {
				if (this.$panels[i].id === this.urlHash) {
					this.currentIndex = i;
					this.focusOnInit = true;
					break;
				}
			}
		}

		this.initDOM();

		this.bindEvents();

		$.event.trigger(this.options.customEventName + ':isInitialized', [this.$el]);

	},


/**
*	Private Methods
**/

	initDOM: function() {
		var $activeTab = this.$tabs.eq(this.currentIndex);
		var $activePanel = this.$panels.eq(this.currentIndex);

		this.$el.attr({'role':'tablist', 'aria-live':'polite'});
		this.$tabs.attr({'role':'tab', 'tabindex':'0', 'aria-selected':'false'});
		this.$panels.attr({'role':'tabpanel', 'tabindex':'-1', 'aria-hidden':'true'});
		this.$panels.find(this.options.selectorFocusEls).attr({'tabindex':'-1'});

		// equalize items height
		if (this.options.equalizeHeight) {
			this.heightEqualizer = new HeightEqualizer( this.$el, {
				selectorItems: this.options.selectorPanels,
				setParentHeight: false
			});
			this.maxHeight = this.heightEqualizer.maxHeight;
		}

		$activeTab.addClass(this.options.activeClass).attr({'aria-selected':'true'});
		$activePanel.addClass(this.options.activeClass).attr({'tabindex':'0', 'aria-hidden':'false'});
		$activePanel.find(this.options.selectorFocusEls).attr({'tabindex':'0'});

		TweenMax.set(this.$panels, {
			display: 'none',
			height: this.maxHeight
		});

		TweenMax.set($activePanel, {
			display: 'block',
			height: this.maxHeight
		});

		// initial focus on content
		if (this.focusOnInit) {
			$(window).load(function() {
				this.$htmlBody.animate({scrollTop: 0}, 1);
				this.focusOnPanel($activePanel);
			}.bind(this));
		}

	},

	bindEvents: function() {

		this.$tabs.on('click', function(event) {
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
		var index = this.$tabs.index(event.currentTarget);

		// if selfClosing then check various states of acordion
		if (this.options.selfClosing) {

			// currentIndex is open
			if (this.currentIndex === index) {
				this.previousIndex = null;
				this.currentIndex = -1;
				this.animatePanelClosed(index);

			// currentIndex is -1, all are closed
			} else if (this.currentIndex === -1) {
				this.previousIndex = null;
				this.currentIndex = index;
				this.animatePanelOpen(index);

			// default behaviour
			} else {
				this.previousIndex = this.currentIndex;
				this.currentIndex = index;
				this.animatePanelClosed(this.previousIndex);
				this.animatePanelOpen(this.currentIndex);
			}

		// else accordion operates as normal
		} else {

			if (this.currentIndex === index) {
				this.$panels[index].focus();
			} else {
				this.previousIndex = this.currentIndex;
				this.currentIndex = index;
				this.animatePanelClosed(this.previousIndex);
				this.animatePanelOpen(this.currentIndex);
			}

		}

	},


/**
*	Public Methods
**/

	animatePanelClosed: function(index) {
		var self = this;
		var $inactiveTab = this.$tabs.eq(index);
		var $inactivePanel = this.$panels.eq(index);

		this.isAnimating = true;

		$inactiveTab.removeClass(this.options.activeClass).attr({'aria-selected':'false'});
		$inactivePanel.removeClass(this.options.activeClass).attr({'tabindex':'-1', 'aria-hidden':'true'});
		$inactivePanel.find(this.options.selectorFocusEls).attr({'tabindex':'-1'});

		TweenMax.to($inactivePanel, this.options.animDuration, {
			height: 0,
			ease: this.options.animEasing,
			onComplete: function() {
				self.isAnimating = false;
				$inactiveTab.focus();
				TweenMax.set($inactivePanel, {
					display: 'none',
					height: self.maxHeight
				});
			}
		});

	},

	animatePanelOpen: function(index) {
		var self = this;
		var $activeTab = this.$tabs.eq(index);
		var $activePanel = this.$panels.eq(index);
		var panelHeight = $activePanel.outerHeight();

		this.isAnimating = true;

		$activeTab.addClass(this.options.activeClass).attr({'aria-selected':'true'});
		$activePanel.addClass(this.options.activeClass).attr({'tabindex':'0', 'aria-hidden':'false'});
		$activePanel.find(this.options.selectorFocusEls).attr({'tabindex':'0'});

		if (this.options.equalizeHeight) {
			panelHeight = this.maxHeight;
			TweenMax.set($activePanel, {
				height: 0
			});
		}

		TweenMax.to($activePanel, this.options.animDuration, {
			display: 'block',
			height: panelHeight,
			ease: this.options.animEasing,
			onComplete: function() {
				self.isAnimating = false;
				$activePanel.focus();
				TweenMax.set($activePanel, {
					height: self.maxHeight
				});
			}
		});

		this.focusOnPanel($activePanel);

		$.event.trigger(this.options.customEventName + ':panelOpened', [this.currentIndex]);

	},

	focusOnPanel: function($panel) {
		var pnlTop = $panel.offset().top;
		var pnlHeight = $panel.outerHeight();
		var winTop = this.$window.scrollTop();
		var winHeight = this.$window.height();
		if (pnlHeight > winHeight || pnlTop < winTop) {
			this.$htmlBody.animate({scrollTop: pnlTop}, 200, function() {
				$panel.focus();
			});
		} else {
			$panel.focus();
		}
	}

});

//uncomment to use as a browserify module
//module.exports = Accordion;
