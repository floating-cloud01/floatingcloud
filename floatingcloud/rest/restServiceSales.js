'use strict';
var express = require('express');
var request = require("request");
var cheerio = require('cheerio');
var iconv = require('iconv-lite');

function getDataFromWelstory() {
	return new Promise((resolve, reject) => {
		var requestOptions = {
			method: "GET",
			uri: "http://welstory.com/menu/seoulrnd/weeklyMenu.jsp?fg=1&sWDate=20181112&eWDate=20181118",
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
			$('table > tbody > tr:nth-child(5) > td > table > tbody > tr').each(function (index, items) { //모닝, 런치, 저녁
				$(items).find('.menu_name').parent('tr').each(function (_index, _items) { //카페별로
					$(_items).find('.menu_name2').each(function (i, __items) {
						var data = new Object();
						var day;
						switch (i) {
						case 0:
							day = "Mon";
							break;
						case 1:
							day = "Tue";
							break;
						case 2:
							day = "Wed";
							break;
						case 3:
							day = "Thu";
							break;
						case 4:
							day = "Fri";
							break;
						}
						data.Day = day;
						data.MealType = $(items).find('.division').text();
						data.Corner = $(_items).find('.menu_name').text();
						data.Menu = $(_items).find('.menu_name2')[i].childNodes[0].data;
						if ($(_items).find('.Kcal_name')[i].childNodes[0] != undefined) {
							data.Kcal = $(_items).find('.Kcal_name')[i].childNodes[0].data.split(" ")[0];
						} else data.Kcal = "";
						menuList.push(data);
					});
				});
			});
			resolve(menuList);
		});
	})
}

var router = express.Router();
//post
router.post('', function (request, response) {
	//body에서 파라미터 추출
	const sType = request.body.Type;
	getDataFromWelstory().then(function (result) {
		let aMenu = result;
		let aReturnMenu = [];
		if (sType) {
			aReturnMenu = aMenu.filter(responseMenu => responseMenu.MealType === sType);
		} else {
			aReturnMenu = aMenu;
		}
		//조회한 결과가 없을 경우 에러
		if (aReturnMenu.length < 1) {
			return response.status(404).json({
				error: 'Data not found!!'
			});
		}
		//결과 리턴
		return response.json(aReturnMenu);
	});

})

module.exports = router;