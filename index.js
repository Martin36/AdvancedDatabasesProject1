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
				response(returnValue);

			});
		}
	});
	//Set default dates
	$("#fromDate").val("2018-10-20");
	$("#toDate").val("2018-10-22");

	createLogsTable();

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

function addNewMovie() {
	var postData = {
		title: $("#titleInput").val(),
		categories: $("#categoriesInput").val(),
		summary: $("#summaryInput").val(),
		description: $("#descriptionInput").val()
	};

	$.post("http://localhost:3000/api/movie", postData);

}

function createLogsTable() {
	var url = "http://localhost:3000/api/logs";
	var fromDate = $("#fromDate").val();
	var toDate = $("#toDate").val();
	if ((fromDate !== undefined && fromDate !== "") && (toDate !== undefined && toDate !== "")) {
		url += "?from=" + fromDate + "&to=" + toDate;
	}
	$.get(url, function (data) {
		//Create the thead
		console.log(data);
		if (data.length === 0) return;
		
		var thead = $("#logs-table thead");
		var columns = Object.keys(data[0]);
		var row = $("<tr></tr>");
		columns.forEach(function (col) {
			var th = $("<th></th>");
			th.html(col);
			row.append(th);
		});
		thead.append(row);

		var table = $("#logs-table tbody");
		data.forEach(function (d) {
			var row = $("<tr></tr>");
			columns.forEach((col) => {
				var cell = $("<td></td>");
				cell.html(d[col]);
				row.append(cell);
			});
			table.append(row);
		});
	});
}

function getUrlVars() {
	var vars = {};
	window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,
		function (m, key, value) {
			vars[key] = value;
		});
	return vars;
}
