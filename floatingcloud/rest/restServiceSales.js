'use strict';
var express = require('express');
var request = require("request");
var cheerio = require('cheerio');
var iconv = require('iconv-lite');
var uuid = require('node-uuid');

function getDataFromWelstory(sDate, eDate) {
	return new Promise((resolve, reject) => {
		var url = "http://welstory.com/menu/seoulrnd/weeklyMenu.jsp?fg=1&sWDate=" + sDate + "&eWDate=" + eDate;
		var requestOptions = {
			method: "GET",
			// uri: "http://welstory.com/menu/seoulrnd/weeklyMenu.jsp?fg=1&sWDate=20181112&eWDate=20181118",
			uri: url,
			headers: {
				"Content-Type": "text/html"
			},
			encoding: null
		};
		request(requestOptions, function (error, response, body) {
			//10. 대상 화면 파싱.
			var strContents = new Buffer(body);
			//20. 파싱한 한글이 깨지므로 인코딩
			var utf8Text = iconv.decode(strContents, "euc-kr");
			let menuList = new Array();
			var $ = cheerio.load(utf8Text); //실제 시스템
			//30. 파싱 결과
			var dateString = $('.day').text().split(" ")[1].split("~")[0];
			var year = dateString.substring(0, 4);
			var month = dateString.substring(4, 6);
			var day = dateString.substring(6, 8);
			let fomatDate = new Date(year, month - 1, day);
			$('table > tbody > tr:nth-child(5) > td > table > tbody > tr').each(function (index, items) { //모닝, 런치, 저녁
				$(items).find('.menu_name').parent('tr').each(function (_index, _items) { //카페별로
					$(_items).find('.menu_name2').each(function (i, __items) {
						var data = new Object();
						data.ID = uuid.v4();
						data.Date = new Date(fomatDate.getTime() + (i * 24 * 60 * 60 * 1000) + (9 * 60 * 60 * 1000));
						var shopColor = $(_items).find('.menu_name').attr('bgcolor');
						if(shopColor == "e8eca4"){
							data.ShopID_ShopID = "W02";
						} else if(shopColor == "ffad01"){
							data.ShopID_ShopID = "W01";
						}
						var mealType = $(items).find('.division').text();
						var convMealType;
						switch (mealType) {
							case "모닝": convMealType = "M"; break;
							case "런치": convMealType = "L"; break;
							case "디너": convMealType = "D"; break;
							default: 
						}
						data.MealType_MealType = convMealType;
						data.Corner = $(_items).find('.menu_name').text();
						data.MainTitle = $(_items).find('.menu_name2')[i].childNodes[0].data;
						if ($(_items).find('.Kcal_name')[i].childNodes[0] != undefined) {
							data.Calories = $(_items).find('.Kcal_name')[i].childNodes[0].data.split(" ")[0];
						} else data.Calories = "";
						menuList.push(data);
					});
				});
			});
			//Data Insert
			for (var i = 0; i < menuList.length; i++) {
				var options = {
					uri: 'https://charles-erp-dev-mycorpdining-srv.cfapps.ap10.hana.ondemand.com/odata/v2/CatalogService/Menu',
					method: 'POST',
					headers: {
						"content-type": "application/json"
					},
					json: menuList[i]
				};
				request(options, function (error, response, body) {
					if (!error && response.statusCode == 200) {
						console.log(body.id)
					}
				});
			}
		});
	})
}
var router = express.Router();
router.post('/', function (req, res) {
	//body에서 파라미터 추출
	var startDate = req.body.StartDate;
	var endDate = req.body.EndDate;  
	getDataFromWelstory(startDate, endDate);
})
module.exports = router;