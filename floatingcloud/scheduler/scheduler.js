'use strict';

const schedule = require('node-schedule-tz');
const welstory = require('../webhook/welstory');
const rp = require('request-promise');

const makeRequestOption = (method, entitySet, body = {}) => {
	const options = {
		method,
		uri: `https://charles-erp-dev-mycorpdining-srv.cfapps.ap10.hana.ondemand.com/odata/v2/CatalogService/${entitySet}`,
		// uri: `https://s0012785615trial-rybczinski-dev-mycorpdining-srv.cfapps.eu10.hana.ondemand.com/odata/v2/CatalogService/${entitySet}`,
		json: true,
		body
	}
	return options;
};

// 메인메뉴 저장 로직
const sendMainRequest = (convMenuList) => {
	const promises = new Array();
	convMenuList.forEach(menuList => {
		menuList.forEach(menu => {
			const body = {
				"MenuName": menu.MainTitle,
				"LikeIt": 0,
				"HateIt": 0,
			};
			promises.push(rp(makeRequestOption('POST', 'MainMenu', body))
				.catch(error => {
					// console.error(error);
					console.warn(`[Scheduling][MainMenu] ${error.error.error.message.value} - ${error.options.body.MenuName}`);
				}));

		});
	});
	Promise.all(promises)
		.then((results) => {
			results.forEach(result => {
				if (result) console.log(`[Scheduling][MainMenu] ${result.d.MenuName} 저장`);
			});
		})
		.catch(error => {
			console.error(error);
		});
};

// 식당별 Menu List를 전달받아 forEach를 통해 Item 별로 Post 수행
// Post 결과를 Promise Array로 반환
const sendDailyRequest = (menuList) => {
	const promises = new Array();
	menuList.forEach((menu, index) => {
		const body = {
			"ID": menu.ID,
			"Date": parseYyyymmddToString(menu.Date),
			"ShopID_ShopID": menu.Area_ID,
			"Corner": menu.Corner,
			"CornerIdx": index,
			"MealType_MealType": menu.MealType,
			"Main_MenuName": menu.MainTitle,
			"SideDish": menu.SideDish,
			"Calories": menu.Calories
		}
		promises.push(rp(makeRequestOption('POST', 'DailyMenu', body))
			.catch(error => {
				console.warn(`[Scheduling][DailyMenu] ${error.error.error.message.value} - ${error.options.body.Main_MenuName}`);
			}));
	});
	// console.log(promises);
	return promises;
};

// 서버 저장을 위해 YYYYMMDD를 Date 객체로 변환
const parseYyyymmddToString = (str) => {
	const y = str.substr(0, 4),
		m = str.substr(4, 2) - 1,
		d = str.substr(6, 2);
	// 무슨 이유에서인지 서버 저장시 Local Timezone이 적용되지 않아 TimezoneOffset을 한번 더 적용해줌
	return new Date(new Date(y, m, d).getTime() - new Date(y, m, d).getTimezoneOffset() * 60000);
};

// 현재 시간 기준 YYYYMMDD 반환
// welstory.js의 QueryMenu() 메서드 상의 로직을 그대로 가져옴
const getYyyymmdd = (date = new Date()) => {
	const oDateUTC = date.getTime() + 9 * 60 * 1000 * 60; //UTC시간 + 9시간
	const oDate = new Date(oDateUTC).toISOString();
	const sDate = oDate.split('T')[0].split('-')[0] + oDate.split('T')[0].split('-')[1] + oDate.split('T')[0].split('-')[2];
	return sDate;
}

// welstory.js의 getMenu() 메서드를 이용해 식당별 메뉴를 받아온 다음
// 식당 별로 메뉴 저장을 비동기로 수행하고 성공 건수를 로그로 남김 
const saveAllMenu = async () => {
	try {
		const today = new Date();
		// 오늘부터 1주일 후까지의 메뉴를 저장
		for (let i = 0; i <= 7; i++) {
			let date = new Date();
			date.setDate(today.getDate() + i);
			const sDate = getYyyymmdd(date);
			const convMenuList = [ // 우면1식당
				await welstory.getMenu(sDate, "E5IV,E5IW,E5IX,E5IZ"),
				// 우면2식당
				await welstory.getMenu(sDate, "E5J2,E5J3,E5J4"),
				// 잠실
				await welstory.getMenu(sDate, "E59C,E59D,E59E,E59F,E59G,E5E6,E5E7,E5E8,E5E9,E5EA,E5EB,E5EC,E5ED"),
				// 서초생명
				await welstory.getMenu(sDate, "E5KL"),
			];

			// const convMenuList = [await welstory.getMenu('20181206', "E59C,E59D")];
			// console.log(convMenuList);

			// const convMenuList = [[
			// 	{
			// 		ID: '2AAE59C',
			// 		Area_ID: 'J01',
			// 		Shop_ID: 'E59C',
			// 		Corner: '코리안1(B1)',
			// 		Date: '20181206',
			// 		Recipe_cd: '1000518522',
			// 		MealType: 'L',
			// 		SideDish: '흑미밥,포기김치,두부찜&양념장,마늘종어묵볶음,미나리무생채',
			// 		MainTitle: '나가사끼부대찌개',
			// 		Calories: 600
			// 	},
			// 	{
			// 		ID: '2AAE59D',
			// 		Area_ID: 'J01',
			// 		Shop_ID: 'E59D',
			// 		Corner: '코리안2(B1)',
			// 		Date: '20181206',
			// 		Recipe_cd: '1000264022',
			// 		MealType: 'L',
			// 		SideDish: '흑미밥,콩나물국,포기김치,두부찜&양념장,미나리무생채',
			// 		MainTitle: '오삼불고기',
			// 		Calories: 700
			// 	},
			// 	{
			// 		ID: '1AAE59D',
			// 		Area_ID: 'J01',
			// 		Shop_ID: 'E59D',
			// 		Corner: '코리안2(B1)',
			// 		Date: '20181206',
			// 		Recipe_cd: '1000266880',
			// 		MealType: 'M',
			// 		SideDish: '현미찹쌀밥,깍두기,햄전,김구이,부추적채겉절이,파인애플',
			// 		MainTitle: '사골떡국',
			// 		Calories: 800
			// 	},
			// 	{
			// 		ID: '3AAE59D',
			// 		Area_ID: 'J01',
			// 		Shop_ID: 'E59D',
			// 		Corner: '코리안2(B1)',
			// 		Date: '20181206',
			// 		Recipe_cd: '1000347038',
			// 		MealType: 'D',
			// 		SideDish: '혼합잡곡밥,부추장떡,연근조림,다시마숙회,포기김치',
			// 		MainTitle: '버섯만두찌개',
			// 		Calories: 900
			// 	}]];

			sendMainRequest(convMenuList);

			convMenuList.forEach(menuList => {
				const Dailypromises = sendDailyRequest(menuList);
				Promise.all(Dailypromises)
					.then(results => {
						results.forEach(result => {
							if (result) {
								let shopName;
								switch (result.d.ShopID_ShopID) {
									case 'W01':
										shopName = '우면1식당';
										break;
									case 'W02':
										shopName = '우면2식당';
										break;
									case 'J01':
										shopName = '잠실';
										break;
									case 'S01':
										shopName = '서초생명';
										break;
								}
								console.log(`[Scheduling][DailyMenu] ${getYyyymmdd(new Date(parseInt(result.d.Date.match(/\d+/)[0], 10)))} : ${shopName} - ${result.d.Main_MenuName} 저장`);
							}
						});
					})
					.catch(error => {
						console.error(error);
					});
			});
		}
	} catch (error) {
		console.error(error);
	}
};

// 메뉴를 저장하는 스케쥴링 작업을 수행
// rule 파라미터 설정을 통해 주기 조정
const scheduleForSavingMenu = () => {
	const seoulHours = 6;
	const seoulMinutes = 0;
	var date = new Date();
	date.setUTCHours(seoulHours - 9); //-9 defines the UTC time offset for a particular timezone
	date.setUTCMinutes(seoulMinutes);

	const rule = new schedule.RecurrenceRule();
	// rule.year
	// rule.month
	// rule.date
	// rule.dayOfWeek = new schedule.Range(1, 5);  // 0 ~ 6: Sun ~ Sat
	rule.hour = date.getHours();
	rule.minute = date.getMinutes();
	// rule.second = new schedule.Range(0, 59, 10);
	// rule.tz = 'Asia/Seoul';
	// console.log(rule);

	// saveAllMenu();
	const scheduledJob = schedule.scheduleJob(rule, saveAllMenu);
};

module.exports = {
	saveAllMenu,
	scheduleForSavingMenu,
}