$(document).ready(function() {
	var elements = $('.viewport-main, .right, .left');
	elements.height($(window).height()-$('.header').height()-$('.footer').height());

	$(window).resize(function() {
    	elements.height($(window).height()-$('.header').height()-$('.footer').height());
	});

	appBootstrap();
});