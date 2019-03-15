'use strict';
var apiai = require("apiai");
var express = require('express');
var router = express.Router();

//10. dialogflow의 프로젝트에 있는 client용 키
var chatapp = apiai("fe6c8e349e6f4c6b9164ebb0395d0600", {
	language: 'ko-KR'
});
var aQuickReply = {
	"label": 'test',
	"action": 'message',
	"messageText": ''
};
var oBasicCard = {
	"version": "2.0",
	"template": {
		"outputs": [{
			"basicCard": {
				"title": "보물상자",
				"description": "보물상자 안에는 뭐가 있을까",
				"thumbnail": {
					"imageUrl": "http://k.kakaocdn.net/dn/83BvP/bl20duRC1Q1/lj3JUcmrzC53YIjNDkqbWK/i_6piz1p.jpg"
				},
				"profile": {
					"imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4BJ9LU4Ikr_EvZLmijfcjzQKMRCJ2bO3A8SVKNuQ78zu2KOqM",
					"nickname": "보물상자"
				},

				"buttons": [{
					"action": "message",
					"label": "열어보기",
					"messageText": "짜잔! 우리가 찾던 보물입니다"
				}, {
					"action": "webLink",
					"label": "구경하기",
					"webLinkUrl": "https://e.kakao.com/t/hello-ryan"
				}]
			}
		}]
	}
};
var oResponseSample = {
	"version": "2.0",
	"template": {
		"outputs": [{
			"listCard": {
				"header": {
					"title": "카카오 i 디벨로퍼스를 소개합니다",
					"imageUrl": "http://k.kakaocdn.net/dn/xsBdT/btqqIzbK4Hc/F39JI8XNVDMP9jPvoVdxl1/2x1.jpg"
				},
				"items": [{
					"title": "Kakao i Developers",

				}, {
					"title": "Kakao i Open Builder",

				}, {
					"title": "Kakao i Voice Service",

				}],
				"buttons": [{
					"label": "구경가기",
					"action": "webLink",
					"webLinkUrl": "https://namu.wiki/w/%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%94%84%EB%A0%8C%EC%A6%88"
				}]
			}
		}]
	}
};
var sampleCarousel = {
	"version": "2.0",
	"template": {
		"outputs": [{
			"carousel": {
				"type": "basicCard",
				"items": [{
					"title": "보물상자",
					"description": "보물상자 안에는 뭐가 있을까",
					"thumbnail": {
						"imageUrl": "http://k.kakaocdn.net/dn/83BvP/bl20duRC1Q1/lj3JUcmrzC53YIjNDkqbWK/i_6piz1p.jpg"
					},
					"buttons": [{
						"action": "message",
						"label": "열어보기",
						"messageText": "짜잔! 우리가 찾던 보물입니다"
					}, {
						"action": "webLink",
						"label": "구경하기",
						"webLinkUrl": "https://e.kakao.com/t/hello-ryan"
					}]
				}, {
					"title": "보물상자2",
					"description": "보물상자2 안에는 뭐가 있을까",
					"thumbnail": {
						"imageUrl": "http://k.kakaocdn.net/dn/83BvP/bl20duRC1Q1/lj3JUcmrzC53YIjNDkqbWK/i_6piz1p.jpg"
					},
					"buttons": [{
						"action": "message",
						"label": "열어보기",
						"messageText": "짜잔! 우리가 찾던 보물입니다"
					}, {
						"action": "webLink",
						"label": "구경하기",
						"webLinkUrl": "https://e.kakao.com/t/hello-ryan"
					}]
				}, {
					"title": "보물상자3",
					"description": "보물상자3 안에는 뭐가 있을까",
					"thumbnail": {
						"imageUrl": "http://k.kakaocdn.net/dn/83BvP/bl20duRC1Q1/lj3JUcmrzC53YIjNDkqbWK/i_6piz1p.jpg"
					},
					"buttons": [{
						"action": "message",
						"label": "열어보기",
						"messageText": "짜잔! 우리가 찾던 보물입니다"
					}, {
						"action": "webLink",
						"label": "구경하기",
						"webLinkUrl": "https://e.kakao.com/t/hello-ryan"
					}]
				}]
			}
		}]
	}
}
var options = {
	sessionId: 'kakaotalkSession'
};

function buildKakaoResponse(res) {
	console.log("RESPONSE");
	console.log(res);
	var sOutType = 'simpleText';
	var oFinalResponse = ""; //oFinalResponse
	var aQuickReplies = [];
	var oSimpleText = {
		"version": "2.0",
		"template": {
			"outputs": [{
				"simpleText": {
					"text": ""
				}
			}],
			"quickReplies": []
		}
	};

	var oListCard = {
		"version": "2.0",
		"template": {
			"outputs": [{
				"listCard": {
					"header": {
						"title": "상단 텍스트",
						"imageUrl": "http://k.kakaocdn.net/dn/xsBdT/btqqIzbK4Hc/F39JI8XNVDMP9jPvoVdxl1/2x1.jpg"
					},
					"items": [],
					"buttons": [{
						"label": "모바일페이지(beta)",
						"action": "webLink",
						"webLinkUrl": "https://charles-erp-dev-fioriui.cfapps.ap10.hana.ondemand.com/fioriui/test/flpSandbox.html#DailyMenu-display"
					}]
				}
			}]
		}
	};
	var oCarousel = {
		"version": "2.0",
		"template": {
			"outputs": [{
				"simpleText": {
					"text": "HelloWorld"
				}
			}, {
				"carousel": {
					"type": "basicCard",
					"items": []
				}
			}]
		}
	}

	let aMessage = res.result.fulfillment.messages;
	// console.log("MESSAGE");
	// console.log(JSON.stringify(aMessage))
	//Payload가 있나 보고
	let aPayload = aMessage.filter(oMenu => oMenu.type === 4);

	//quickreply가 있을 경우 카카오용 키보드 설정
	//WELCOME 
	let aQuckRepliesWelcome = aMessage.filter(oMenu => oMenu.type === 'suggestion_chips'); //aMessage.filter(oMenu => oMenu.type === 2) || 
	if (aQuckRepliesWelcome.length > 0) {
		let aSuggestions = aQuckRepliesWelcome[0].suggestions;
		for (var j = 0; j < aSuggestions.length; j++) {
			aQuickReplies.push({
				"label": aSuggestions[j].title,
				"action": "message",
				"messageText": aSuggestions[j].title
			});
		}
	}
	//본문ㅋ
	let aQuckRepliesOthers = aMessage.filter(oMenu => oMenu.type === 2);
	if (aQuckRepliesOthers.length > 0) {
		let aReplies = aQuckRepliesOthers[0].replies;
		for (var i = 0; i < aReplies.length; i++) {
			aQuickReplies.push({
				"label": aReplies[i],
				"action": "message",
				"messageText": aReplies[i]
			})
			console.log(aReplies[i]);
		}
	}
	//sOutType별 응답 구성
	// let aMessage = res.result.fulfillment.messages;
	let aReturnMessage = aMessage.filter(oReturn => oReturn.type === 0);
	//Welcome의 경우 listCard로

	if (res.result.action === 'input.welcome') {
		oListCard.template.outputs[0].listCard.header.title = '안녕하세요.삼성식당입니다.'
		if (aReturnMessage.length > 0) {
			oListCard.template.outputs[0].listCard.items.push({
				title: aReturnMessage[0].speech
			})
		}
		oFinalResponse = oListCard;

	} else if(res.result.action ==='input.favorite'){
				oSimpleText.template.outputs[0].simpleText.text = aReturnMessage[0].speech;
		oFinalResponse = oSimpleText;
	} else {
		if (aReturnMessage) { //carousel
		    console.log("aReturnMessage");
		    console.log(aReturnMessage);
			let aCarouselButtons = [{
				action: "webLink",
				label: "좋아요(beta)",
				webLinkUrl: "http://pf.kakao.com/_FxdXsj"
			}];
			let aResult = aReturnMessage[0].speech.split("\n");
			oCarousel.template.outputs[0].simpleText.text = aResult[0];
			for (var i = 1; i < aResult.length; i++) {
				let aTitleDesc = aResult[i].split("→");
				if (aTitleDesc[0]) {
					oCarousel.template.outputs[1].carousel.items.push({
						thumbnail: {
							imageUrl: "https://t1.daumcdn.net/friends/prod/category/M202_theme_gentle.png"
						},
						title: aTitleDesc[0],
						description: aTitleDesc[1],
						buttons: aCarouselButtons
					});
				}
			}
			oFinalResponse = oCarousel;
		} 
	}
	// } else {
	// // simpletext
	//     console.log("COUNT");
	//     console.log(aReturnMessage);
	// 	oSimpleText.template.outputs[0].simpleText.text = aReturnMessage[0].speech;
	// 	oFinalResponse = oSimpleText;
	// }

	oFinalResponse.template.quickReplies = aQuickReplies;
	return oFinalResponse;
	//   console.log('SOUTTYPE');
	//   console.log(sOutType);
	// switch (sOutType) {
	// case 'simpleImage':
	// 	break;
	// case 'basicCard':
	// 	break;
	// case 'commerceCard':
	// 	break;
	// case 'listCard':
	// 	break;
	// default:
	// case 'simpleText':
	// if (aPayload.length > 0) {
	// 	oResponse = aPayload[0].payload;
	// } else if (res.result.fulfillment.speech) {
	// 	oResponse.template.outputs[0].simpleText.text = res.result.fulfillment.speech;
	// } else {
	// 	oResponse.template.outputs[0].simpleText.text = res.result.fulfillment.messages[0].speech;
	// }
	// console.log("SIMPLTETEXT");

	// 	break;
	// }

	// return oResponse;
	// return sampleCarousel;
}
router.post('/message', function (request, response) {
	let sUser_key = decodeURIComponent(request.body.userRequest.user.id);

	let sType = decodeURIComponent(request.body.userRequest.type); // message type
	let sContent = decodeURIComponent(request.body.userRequest.utterance); // user's message
	sType = 'text';
	console.log(request.body);
	// console.log("==========REQUEST");
	// console.log(request.body.content);
	//user key 전달
	options.sessionId = sUser_key;

	var request = chatapp.textRequest(sContent, options);
	//결과 처리
	request.on('response', function (res) {
		var oResponse = buildKakaoResponse(res, 'simpleText');
		response.json(oResponse);
	});

	request.on('error', function (error) {
		console.log(error);
	});

	request.end();
});

module.exports = router;