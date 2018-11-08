# floatingcloud
뜬구름 잡는 소리 하네 프로젝트 01

Git 협업 기준

제가 벤치마킹 하고 싶은 Git 협업 방식은 오픈 소스 프로젝트에서 이루어지는 Git 활용 매커니즘(Fork & Pull
Request)입니다.
Owner User의 Git Repository에서 구성원들이 협업을 하는 일반적인 방식과 비교해 대략적인 설명을 드리면
Owner가 Github의 기능인 Organization을 생성해서 공통의 Repository를 구성하고 구성원(Owner 포함)들이 각
자의 Repository로 공통의 Repository를 Fork해 가는 방식입니다.
이후에는 구성원들이 Local에서 수정 작업을 한 뒤 각자의 Git Repository에 반영(Commit & Push)하고 최종적으
로 Github의 기능인 Pull Request를 통해 공통 Repository에 반영을 요청하면 Organization의 Owner가 새로 들어
온 Pull Request를 검토하고 구성원들의 논의를 거쳐 공통의 Repository에 적용여부를 결정하게 됩니다.
이 방법을 활용하게 되면 Github의 Pull Request 기능을 통해 구성원들의 협업을 더욱 극대화할 수 있으며 공통의
원격 Repository 외에도 구성원들이 각자의 Repository를 가지게 됨으로써 Branch 관리가 좀 더 용이하게 됩니다.
구체적으로 저희 프로젝트에서 이 매커니즘을 활용하기 위한 절차는 아래와 같습니다.
1. Owner(이하 Charles님)가 Github에서 Organization과 공통 Repository를 생성합니다.
2. Charles님이 기본 코드 베이스를 공통 Repository에 업로드합니다.
3. 구성원(Charles님 포함)들이 각자의 Repository로 공통의 Repository를 Fork합니다.
4. 이후 각자 Local에서 작업 후 수정 사항을 본인의 Repository에 먼저 반영(Commit & Push)합니다. 이때
작업 과정에서 공통 Repository와는 별도로 자신의 Repository에서 별개의 Branch를 운용할 수 있습니다.
5. 자신의 Repository에서 수정 작업의 검증이 완료되면 Pull Request를 통해 공통 Repository에 반영을
요청합니다.
6. Charles님은 새로운 Pull Request를 검토하고 구성원들과 논의한 후에 공통의 Repository에 반영 여부
를 결정합니다.
Git을 활용하기 위한 참고 자료도 함께 첨부합니다. 해당 자료는 저도 아직 검토를 다 해보지는 못했는데 필요하면
모여서 간단하게 실습을 해보는 것도 괜찮을 것 같습니다.
Commit 단위와 Commit Message 작성법은 제가 좀 더 공부하고 고민한 뒤에 기준을 공유해드리도록 하겠습니다.
