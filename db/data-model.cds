namespace my.restaurant;
/*식당 마스터 */
entity M_0010 {
  key ShopID : String;//E5J4
      Title  : String;//2단지코리안
      AreaName : String;//사업장명(전자서울R&D캠퍼스)
      SubAreaName : String;//1단지,2단지
}
/*식사 타입 마스터 */
/* M:아침, L:점심, D:저녁, N:야식 */
entity M_0020 {
  key DiningType : String;
      Title  : String;
}
/*식단 리스트 */
entity T_0010 {
  key ShopID     : String; //식당ID
      Corner     : String; //코너명
      Date       : DateTime; //날짜
      DiningType : String; //M:아침, L:점심, D:저녁, N:야식 
      MainTitle  : String; //메인 식사명
      SideDish   : String; //추가 메뉴
      Calories   : String; //칼로리
}
