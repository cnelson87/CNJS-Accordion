/*
	TITLE: HeightEqualizer

	DESCRIPTION: Sets equal height on a collection of DOM ELs

	VERSION: 0.2.2

	USAGE: var myHeightEqualizer = new HeightEqualizer('El', 'Options')
		@param {jQuery Object}
		@param {Object}

	AUTHOR: CN

	DEPENDENCIES:
		- jQuery 2.1.4+

*/

var HeightEqualizer = function($el, objOptions) {
	this.$el = $el;
	this.options = $.extend({
		selectorItems: '> div',
		setParentHeight: false
	}, objOptions || {});

	// element references
	this.$items = this.$el.find(this.options.selectorItems);

	this._len = this.$items.length;
	if (this._len <= 1) {return;}

	this.maxHeight = 0;

	this.calcHeight();
	this.setHeight();

};
HeightEqualizer.prototype = {
	calcHeight: function() {
		var heightCheck = 0;
		for (var i=0; i<this._len; i++) {
			//outerHeight includes height + padding + border
			heightCheck = $(this.$items[i]).outerHeight();
			if (heightCheck > this.maxHeight) {
				this.maxHeight = heightCheck;
			}
		}
	},
	setHeight: function() {
		this.$items.css({height: this.maxHeight});
		if (this.options.setParentHeight) {
			this.$el.css({height: this.maxHeight});
		}
	},
	resetHeight: function() {
		this.maxHeight = 0;
		this.$items.css({height: ''});
		if (this.options.setParentHeight) {
			this.$el.css({height: ''});
		}
		this.calcHeight();
		this.setHeight();
	}
};

//uncomment to use as a browserify module
//module.exports = HeightEqualizer;
