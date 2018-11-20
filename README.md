# 삼성식당

**뜬구름 잡는 소리하네**



## Getting Started

SAP Cloud Platform(SCP)과 NLP 및 AI Device를 활용하여 삼성 그룹 사내 식당의 식단 정보 및 부가적인 서비스를 제공하는 프로젝트입니다.



## Background

1. 그냥 뭔가 만들어서 다른 사람들에게 서비스 해보고 싶다.
2. 회사 식당의 메뉴 확인하는 곳은 항상 붐빈다.
3. 뭘 먹을지 쓸데 없이 고민한다.(~~특별히 먹고 싶은 것도 없다.~~)
4. 내가 너무 많은 칼로리를 섭취하고 있는 것은 아닌지 염려된다.
5. 내가 먹고 싶은 메뉴가 언제 나오는 지 알고 싶다.
6. 다른 사람이랑 식당 메뉴를 쉽게 공유하고 싶다.



## Usage

### Back-End

- SAP Cloud Platform(Neo & Cloud Foundry Environment in Sydney) : 클라우드 기반 HANA DB 설계 및 개발
- node.js / Java : 챗봇, Google Assistant, 카카오톡 플러스 친구 용 Webhook 개발

### Natural Language Processing

-  DialogFlow 및 recast.ai 등을 활용한 Robust한 대화 설계

### Front-End

- Google Assistant
- 카카오톡 플러스 친구



## Structure

- db : Cloud Foundry의 SAP HANA DB 구성
- srv : SAP HANA DB의 데이터를 XSOData 형태로 서비스 구성
- floatingcloud : srv의 서비스를 이용하여 외부와 연계를 하기 위한 node.js 모듈



## Authors

- 양승철 (Charles) *- Samsung SDS -* [github](https://github.com/skyskai)

- 김수인 (God Suin) *- Samsung SDS -* [github](https://github.com/kimsuin1)

- 이재현 (Juan Rybczinski) *- Samsung SDS -* [github](https://github.com/rybczinski0726)



## License





## Acknowledgments

