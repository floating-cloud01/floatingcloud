'use strict';
var apiai = require("apiai");
const express = require('express');
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

var oResponseSample = {
  "version": "2.0",
  "template": {
    "outputs": [
      {
        "listCard": {
          "header": {
            "title": "카카오 i 디벨로퍼스를 소개합니다",
            "imageUrl": "http://k.kakaocdn.net/dn/xsBdT/btqqIzbK4Hc/F39JI8XNVDMP9jPvoVdxl1/2x1.jpg"
          },
          "items": [
            {
              "title": "Kakao i Developers",
              "description": "새로운 AI의 내일과 일상의 변화",
              "imageUrl": "http://k.kakaocdn.net/dn/APR96/btqqH7zLanY/kD5mIPX7TdD2NAxgP29cC0/1x1.jpg",
              "link": {
                "web": "https://namu.wiki/w/%EB%9D%BC%EC%9D%B4%EC%96%B8(%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%94%84%EB%A0%8C%EC%A6%88)"
              }
            },
            {
              "title": "Kakao i Open Builder",
              "description": "플러스친구 챗봇 만들기",
              "imageUrl": "http://k.kakaocdn.net/dn/N4Epz/btqqHCfF5II/a3kMRckYml1NLPEo7nqTmK/1x1.jpg",
              "link": {
                "web": "https://namu.wiki/w/%EB%AC%B4%EC%A7%80(%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%94%84%EB%A0%8C%EC%A6%88)"
              }
            },
            {
              "title": "Kakao i Voice Service",
              "description": "보이스봇 / KVS 제휴 신청하기",
              "imageUrl": "http://k.kakaocdn.net/dn/bE8AKO/btqqFHI6vDQ/mWZGNbLIOlTv3oVF1gzXKK/1x1.jpg",
              "link": {
                "web": "https://namu.wiki/w/%EC%96%B4%ED%94%BC%EC%B9%98"
              }
            }
          ],
          "buttons": [
            {
              "label": "구경가기",
              "action": "webLink",
              "webLinkUrl": "https://namu.wiki/w/%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%94%84%EB%A0%8C%EC%A6%88"
            }
          ]
        }
      }
    ]
  }
}
var options = {
	sessionId: 'kakaotalkSession'
};

function buildKakaoResponse(res,sOutType){
	 var oResponse = {
    "version": "2.0",
    "template": {
      "outputs": [
        {
          "simpleText": {
            "text": "hello I'm Ryan"
          }
        }
      ],
      "quickReplies" :[]
    }
  };
    let aMessage = res.result.fulfillment.messages;
      console.log("MESSAGE");
    console.log(JSON.stringify(aMessage))
    //Payload가 있나 보고
    let aPayload = aMessage.filter(oMenu => oMenu.type === 4);
     //quickreply가 있을 경우 카카오용 키보드 설정
     //WELCOME 
    let aQuckRepliesWelcome = aMessage.filter(oMenu => oMenu.type === 'suggestion_chips');//aMessage.filter(oMenu => oMenu.type === 2) || 
    if(aQuckRepliesWelcome.length>0){
     		let aSuggestions = aQuckRepliesWelcome[0].suggestions;
     		for(var j=0;j<aSuggestions.length;j++){
     			oResponse.template.quickReplies.push({"label":aSuggestions[j].title,"action":"message","messageText":aSuggestions[j].title});
     }
    }
    //본문ㅋ
    let aQuckRepliesOthers = aMessage.filter(oMenu => oMenu.type === 2);//aMessage.filter(oMenu => oMenu.type === 2) || 
    if(aQuckRepliesOthers.length>0){
    	oResponse.template.quickReplies.push({"label":aQuckRepliesOthers[0].replies[0],"action":"message","messageText":aQuckRepliesOthers[0].replies[0]})
    }
    //sOutType별 응답 구성
    switch(sOutType){
    	case 'simpleImage':
    		break;
    	case 'basicCard':
    		break;
    	case 'commerceCard':
    		break;
    	case 'listCard':
    		break;
    	default:
    	case 'simpleText':
    		if(aPayload.length>0){
			        oResponse = aPayload[0].payload;
			    } else if(res.result.fulfillment.speech){
			      oResponse.template.outputs[0].simpleText.text=res.result.fulfillment.speech;
			     } else {
			      oResponse.template.outputs[0].simpleText.text = res.result.fulfillment.messages[0].speech;
			     }
    	    break;
    }
  
    
   
     return oResponse;
}
router.post('/message', function (request, response) {
	let sUser_key = decodeURIComponent(request.body.userRequest.user.id);
	'dummykey'; // user's key  decodeURIComponent(request.body.user.id)||
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
		var oResponse = buildKakaoResponse(res,'simpleText');
		response.json(oResponse);
	});

	request.on('error', function (error) {
		console.log(error);
	});

	request.end();
});

module.exports = router;