require(["esri/arcgis/Portal", 'dojo/ready',  'dojo/query', 'dojo/dom'], function(esriPortal, ready, query) {

	ready(function() {
		

		var groupIds = ['f4373b6eae144e26a634937269d336ec', 'd731188ae3fe4cb1b5c937348ea26361', '0aa62cc6f6f243e4997b7b95ce4f9f33', 'ed80acb20e194190acb391e26a6f5441', 
						'6768f926382141cba2e37eae58cabe61', 'c755678be14e4a0984af36a15f5b643e', 'b8787a74b4d74f7fb9b8fac918735153', '29bc3ec06a284dca8a6654bdb7cb0e26', 
						'a9dd8d5f05b5479f8c4875de746d4cda'];



		var portalUrl = document.location.protocol + '//www.arcgis.com';

		//create the portal
		var portal = new esriPortal.Portal(portalUrl);

		//dojo.on(portal, 'ready', function(p) {

		portal.on('ready', function(p) {

			var queryString = "(";
			dojo.forEach(groupIds, function(id, index) {
				queryString += "group: \"" + id + "\"";
				if (index != groupIds.length-1) queryString += " OR ";
			});
			queryString += ")";

			queryString = "owner:esri";

			var params = {
				q: queryString,
				sortField: 'modified',
				sortOrder: 'desc'
			}

			portal.queryGroups(params).then(function(data) {
				showGroupResults(data);
			});

		});

		// if I need to I can get the first item and get its thumbnail


		function showGroupResults(response) {

			var results = response.results;

			var html = '';
			if(results.length == 0) {
				html = '<div>' +
							'<h2>Sorry, no groups found.</h2>' +
					   '</div>';
			}			

			dojo.forEach(results, function(result, index) {
				if (index == 0) html += '<ul id="content-items">';

				var thumbnail = result.thumbnailUrl || "https://www.arcgis.com/sharing/rest/content/items/" + result.id + "/info/thumbnail/" + result.thumbnail;
				html += '<div class="item">' +
							'<li>' +
								'<img src="'+ thumbnail + '">' +
								'<h4>' + result.title + '</h4>' +
								'<div class="launch-icons">' +
									'<img src="controller.png" class="controller">' +
									'<img src="microphoneBlack.png" class="microphone">' +
								'</div>' +
							'</li>' +
						'</div>';

				if (index == results.length-1) html += '</ul>';

			});

			dojo.byId('content').innerHTML = html;
		}

		var microphones = query('.microphone');
		console.log(microphones);
	}); //ready
});