$(function () {

	var url = "http://localhost:3000/api/movies?";
	var urlVars = getUrlVars();
	var searchText = urlVars["searchText"];

	if (searchText !== undefined) {
		if (searchText !== undefined && searchText !== "") {
			url += "s=" + searchText;
			$("#search-input").val(searchText.split("+").join(" "));
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
				var textCell = $("<td></td>");
				textCell.html(d.ts_headline);
				var rankCell = $("<td></td>");
				rankCell.html(d.rank);
				row.append(textCell);
				row.append(rankCell);
				resultsTable.append(row);
			});
			console.log(data);
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
