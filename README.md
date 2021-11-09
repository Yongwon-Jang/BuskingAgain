# 그룹 비디오 컨퍼런스 서비스

## 목차

- [프로젝트 룰](#프로젝트-룰)   
- [프로젝트 소개](#프로젝트-소개)   
- [프로젝트 명세](#프로젝트-명세)
  - [배포 환경](#배포-환경)
  - [개발 환경](#개발-환경)
  - [Design Resources](#design-resources)
  - [핵심 라이브러리](#핵심-라이브러리)
<br>

## 프로젝트 룰
- commit
    - 이름 + 날짜 + 수정 내용

        ex) 권현지 210719 controller수정

    - 인당 1회 이상 커밋, 매일 아침 front, back merge
    - 커밋과 머지는 되도록이면 자주, 공통된 부분을 수정하게 되면 커밋하기전 상의 필수
- Jira
    - 제목 : [BE] or [FE] + 공백한칸 + 제목
    - 레이블 : BE or FE로 설정
    - 개인이 맡은 역할을 개인이 관리 (Story Point, 하위 테스크 등)
- Rest API
    - URI : /카테고리
        - 생성(POST) : /create
        - 조회(GET) : /{조회할 대상의 id}
        - 수정(PATCH) : /{수정할 대상의 id}
        - 삭제(DELETE) : /{수정할 대상의 id}
    - 로그인 이후의 동작은 모두 Request Header에 토큰必
    - 그 외의 동작들은 BE, FE 상의 후 문서에 기록
    - 링크 : [https://docs.google.com/spreadsheets/d/1mzfuLOyo3YoIcw-sFde7B8qAV8niRF7DVuSjcf4mflQ/edit#gid=0](https://docs.google.com/spreadsheets/d/1mzfuLOyo3YoIcw-sFde7B8qAV8niRF7DVuSjcf4mflQ/edit#gid=0)
<br>

## 프로젝트 소개
Web RTC를 이용한 웹 기반 비대면 버스킹 서비스
<br>

- 와이어 프레임 : https://www.figma.com/file/95aVyXNvebpb04nO8lXGSb/Project-1?node-id=0%3A1
- 핵심 기능
    - 회원 가입 / 회원 정보 관리
    - 로그인 / 로그아웃
    - 선호하는 장르 팔로우
    - 버스킹 생성
    - 버스킹 목록 조회 (일반, 랜덤, 선호하는 장르)
    - 채팅
    - 등
- 차별성
    - 버스킹 시작을 위한 진입장벽을 낮추기 (초기 비용 절감)
    - 관객들의 반응을 실시간으로 확인 가능한 양뱡형 소통 (유튜브와의 차별성)
    - 선호하는 가수가 아닌 장르를 팔로우하여서 본인이 선호하는 장르의 다양한 버스킹을 볼 수 있음
    - 버스킹의 느낌을 위한 랜덤 목록 불러오기
## 프로젝트 명세


### 배포 환경
- __URL__ : 
- __배포 여부__ : O / X
- __접속 가능__ : 접속 가능 / 수정 중
- __HTTPS 적용__ : O / X
- __PORT__ : // 3rd Party에서 사용하는 포트가 있다면 기입해주세요. <- 기입 후 해당 주석 삭제
<br>

### 개발 환경
#### Front-end
- __Framework__ : Vue.js
- __지원 환경__ : Web
- __담당자__ : 변우석, 장용원
<br>

#### Back-end
- __Framework__ : Spring boot
- __Database__ : MySQL
- __담당자__ : 권현지, 김은비, 정태현
<br>

#### Design
- __Framework 사용__ : O / X
  - [Vuetify](https://vuetifyjs.com/)
  - [Element Plus](https://element-plus.org/)
- __Design Tool 사용__ : Adobe XD, Photoshop, Blender, Zeplin 등 (없을 경우 빈칸)
- __담당자__ : 팀원 A, 팀원 B,
<br>

### Design Resources
__외부 템플릿 또는 에셋__ (이미지 또는 링크 첨부)
- 무료 이미지, 아이콘, 폰트 등은 제외
- [Vue Argon Design System](https://www.creative-tim.com/product/vue-argon-design-system?affiliate_id=116187) (무료)
  - __사용 기능__ : 디자인 전반 적용
- [Vue Black Dashboard Pro](https://www.creative-tim.com/product/vue-black-dashboard-pro?affiliate_id=116187) (유료)
  - __사용 기능__ : 캘린더 컴포넌트 사용
<br>

__자체 제작 산출물__ (필요시 이미지 또는 설명 첨부)
- LOGO
- CardView
- Button
- Calendar
<br>

### 핵심 라이브러리
기본 제공하는 라이브러리 외 핵심 기능 구현에 사용한 라이브러리가 있다면 작성해주세요.   
예시 ) VR/AR 라이브러리, 애니메이션 라이브러리, 텍스트/사진/동영상 지원, 편집 라이브러리 등

- __AR CORE__
  - __링크__ : https://developers.google.com/ar
  - __소개__ : 구글에서 제공하는 AR 지원 라이브러리
  - __사용 기능__ : 이미지 인식, 이미지 위 영상 표시
  - __담당자__ : 팀원 A, 

- __COLOR THIEF__
  - __링크__ : https://lokeshdhakar.com/projects/color-thief/
  - __소개__ : 이미지에서 색상을 추출해주는 라이브러리
  - __사용 기능__ : 커버 사진에서 색상 추출 -> 배경 색상 변경
  - __담당자__ : 팀원 A,

- __Animate.css__
  - __링크__ : https://animate.style/
  - __소개__ : css 애니메이션 지원 라이브러리
  - __사용 기능__ : 메인 페이지 진입 시 애니메이션 사용
  - __담당자__ : 팀원 A,


