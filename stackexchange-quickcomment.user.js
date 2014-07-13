// ==UserScript==
// @name stackexchange-quickcomment
// @namespace http://keyboardfire.com/
// @license MIT
// @description Quick SE comments for quick SE people
// @version 1.0.1
// @match *://*.stackexchange.com/*
// @match *://*.stackoverflow.com/*
// @match *://*.superuser.com/*
// @match *://*.serverfault.com/*
// @match *://*.askububtu.com/*
// @match *://*.stackapps.com/*
// @match *://*.mathoverflow.net/*
// ==/UserScript==

var userscript = function($) {

if (!localStorage.__stackexchange_quickcomment_data) {
	localStorage.__stackexchange_quickcomment_data = JSON.stringify({
		prefix: ';;',
		commands: [
			{sites: '.', cmd: 'welcome', text: 'Welcome to stackexchange-quickcomment! ' +
				'To use, simply click the "qc" link to the right of this comment box to edit your quickcomments. The format is JSON. ' +
				'The `sites` field is a regexp that tests against the hostname (ex. "$SITEURL") so as to only pertain to a specific site or sites. ' +
				'The `cmd` field is the command that you can type in after the prefix to access the quickcomment. ' +
				'Finally, the text field is the text that will be inserted when you use the quickcomment. Enjoy!'}
		]
	});
}
var data = JSON.parse(localStorage.__stackexchange_quickcomment_data);

var commentModes = {NORMAL: 0, COMMAND: 1}, commentMode, focusedComment, commentPopup, commentPopupSelectionIndex;
$(document).on('focus', 'textarea[name="comment"]', function() {
	var currentComment = $(this).closest('form').attr('id');
	if (focusedComment != currentComment) {
		destroyPopup();
		focusedComment = currentComment;
	}
}).on('keydown keyup', 'textarea[name="comment"]', function(e) { // 'keydown keyup' to prevent weird timing issues with typing really fast
	switch (commentMode) {
	case commentModes.NORMAL:
		if (new RegExp(data.prefix + '$').test(this.value)) {
			commentMode = commentModes.COMMAND;
			createPopup(this);
		}
		break;
	case commentModes.COMMAND:
		if (e.which == 27) { // esc
			destroyPopup();
		} else if (e.which == 32) { // space
			this.value = this.value.replace(new RegExp('^(.*)' + data.prefix + '.*$'), function(m, g1) { return g1; })
				+ parseText(data.commands[parseInt(commentPopup.children().eq(commentPopupSelectionIndex).attr('data-cmdindex'))].text, this);
			destroyPopup();
		} else if (e.which == 37 || e.which == 39) { // left / right respectively
			if (e.type == 'keydown') {
				var delta = e.which - 38; // this just happened to work out perfectly
				commentPopup.children().eq(commentPopupSelectionIndex).css('font-weight', 'normal');
				commentPopupSelectionIndex = Math.max(0, Math.min(commentPopup.children().length-1, commentPopupSelectionIndex + delta));
				commentPopup.children().eq(commentPopupSelectionIndex).css('font-weight', 'bold');
			}
		} else {
			if (e.which == 8 && !new RegExp(data.prefix).test(this.value)) { // backspace
				destroyPopup();
			} else {
				updatePopup(this.value.match(new RegExp('.*' + data.prefix + '(.*)$'))[1]);
			}
		}
		break;
	}
});

$(document).on('click', '.comments-link', function() {
	var td = $(this).parent();
	var intr = setInterval(function() {
		var helpLink = $('.comment-help-link', td);
		if (helpLink.length) {
			if ($('.stackexchange-quickcomment-link', td).length === 0) {
				helpLink.parent().append($('<span>').text(' | ').addClass('lsep'))
					.append($('<a>').text('qc').addClass('stackexchange-quickcomment-link').click(function() {
						var tr;
						$(this).closest('tr').parent().append(tr = $('<tr>').append(
							$('<td>').append($('<textarea>').attr({cols: 68, rows: 3, id: 'stackexchange-quickcomment-editor'}).css('height', '20em').val(prettyJSON(data)))
						).append(
							$('<td>').append($('<input>').attr({type: 'submit'}).val('Save').click(function(e){
								e.preventDefault();
								console.log(j = ('{' + $('textarea', tr).val() + '}'));
								data = JSON.parse('{' + $('textarea', tr).val() + '}');
								localStorage.__stackexchange_quickcomment_data = JSON.stringify(data);
								tr.remove();
							}))
						));
					}));
			}
			clearInterval(intr);
		}
	}, 5);
});

function createPopup(el) {
	commentPopup = $('<div>');
	$(el).parent().prepend(commentPopup);
}

function updatePopup(txt) {
	commentPopup.empty();
	commentPopupSelectionIndex = 0;
	for (var i = 0; i < data.commands.length; i++) {
		if (new RegExp(data.commands[i].sites).test(window.location.hostname) && extMatch(txt, data.commands[i].cmd)) {
			commentPopup[data.commands[i].cmd.indexOf(txt) > -1 ? 'prepend' : 'append']
				($('<span>').text(data.commands[i].cmd).attr('data-cmdindex', '' + i).css({
					padding: '2px'
				}));
		}
	}
	commentPopup.children().eq(0).css('font-weight', 'bold');
}

function destroyPopup() {
	commentMode = commentModes.NORMAL;
	if (commentPopup) commentPopup.remove();
}

function parseText(text, commentBox) {
	return text
		.replace(/\$SITENAME/g, $('.site-icon.favicon').attr('title'))
		.replace(/\$SITEURL/g, window.location.hostname)
		.replace(/\$USERNAME/g, $(commentBox).closest('div[class="question"],div[class="answer"]').find('.post-signature:last .user-details a').text())
}

function prettyJSON(obj) {
	return JSON.stringify(obj)
		.replace(/^\{|\}$/g, '')
		.replace(/"\},/g, '"},\n  ') // this will break if string contains the substring '"},', but that's incredibly unlikely 
		.replace(':[', ': [\n  ')
		.replace(']', '\n]')
		.replace(/:"/g, ': "')
		.replace(/,"/g, ', "')
}

function extMatch(needle, haystack) {
	return new RegExp(needle.split('').join('.*')).test(haystack);
}

};

var el = document.createElement('script');
el.type = 'text/javascript';
el.text = '(' + userscript + ')(jQuery);';
document.head.appendChild(el);
