$(function () {
	var url = "http://localhost:3000/api/movies?";
	var urlVars = getUrlVars();
	var searchText = urlVars["searchText"];

	$("#search-input").autocomplete({
		source: function (request, response) {
			var searchText = $("#search-input").val();
			var url = "http://localhost:3000/api/findsimilar?s=" + searchText;
			$.get(url, {
				q: request.term
			}, function (data) {
				var returnValue = data.map(function (d) {
					return d.summary;
				});
				console.log(returnValue);
				response(returnValue);

			});
		}
	});


	if (searchText !== undefined) {
		if (searchText !== undefined && searchText !== "") {
			url += "s=" + searchText;
			$("#search-input").val(decodeURI(searchText.split("+").join(" ")));
		}

		var inclusiveOption = urlVars["inclusiveOption"];
		if (inclusiveOption === "or") {
			url += "&i=false";
			$("#radioOr").prop("checked", true);
		}
		else {
			url += "&i=true";
			$("#radioAdd").prop("checked", true);
		}

		$.get(url, function (data) {
			$("#query").html("<code>" + data.queryString + "</code>");
			$("#document-nr").html(data.data.length);
			var resultsTable = $("#results-table tbody");
			data.data.forEach(function (d) {
				var row = $("<tr></tr>");
				var idCell = $("<td></td>");
				idCell.html(d.movieid);
				var titleCell = $("<td></td>");
				titleCell.html(d.title);
				var textCell = $("<td></td>");
				textCell.html(d.description_highlight);
				var descCell = $("<td></td>");
				descCell.html(d.description);
				var summaryCell = $("<td></td>");
				summaryCell.html(d.summary);
				var rankCell = $("<td></td>");
				rankCell.html(d.rank);

				row.append(idCell);
				row.append(titleCell);
				row.append(textCell);
				row.append(descCell);
				row.append(summaryCell);
				row.append(rankCell);

				resultsTable.append(row);
			});
		});
	}

});

function makeSearch() {
	//event.preventDefault();
	if (validateInput()) {
		var url = "http://localhost:3000/api/movies?";
		var urlVars = getUrlVars();
		var searchText = urlVars["searchText"];
		if (searchText !== undefined && searchText !== "")
			url += "s=" + searchText;
		var inclusiveOption = urlVars["inclusiveOption"];
		if (inclusiveOption === "or")
			url += "&i=false";
		else
			url += "&i=true";

		$.get(url, function (data, status) {
			console.log(data);
		});

	}
	return false;
}
//TODO: implement this
function validateInput() {
	return true;
}

function getUrlVars() {
	var vars = {};
	window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,
		function (m, key, value) {
			vars[key] = value;
		});
	return vars;
}
