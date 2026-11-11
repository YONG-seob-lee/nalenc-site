# nalenc-site

NALENC(날것들) 팀 소개 사이트 — https://nalenc.kr (GitHub Pages)

빌드 없이 HTML · CSS · JS 그대로. `index.html`을 브라우저로 열면 바로 보입니다.

## 구성

| 파일 | 내용 |
|---|---|
| `index.html` | 첫 화면: 30초 쇼릴 → 선언 → 팀 → 프로젝트 → 연락 |
| `assets/js/reel.js` | 30초 쇼릴(캔버스). 장면은 시간 하나로 정해져서 진행 막대를 끌면 아무 장면에서나 멈춥니다 |
| `assets/js/site.js` | 스크롤 연출(구간마다 진행도 0~1) · 커서 · 메뉴 |
| `assets/css/site.css` | 공통(색 · 글꼴 · 메뉴 · 고정 무대 `.pin`) |
| `assets/css/home.css` / `project.css` | 첫 화면 / 프로젝트 페이지 |
| `projects/pancake-tycoon/` | Pancake Tycoon 소개 페이지 |

## 자주 고칠 곳

- **팀원 이미지**: `assets/img/crew/*.png`(Pancake Tycoon 캐릭터). 바꾸려면 같은 이름으로 덮어쓰기 — 카드와 쇼릴이 같이 바뀝니다.
- **플레이 영상**: `assets/video/`에 mp4 를 넣고 `projects/pancake-tycoon/index.html`의 `data-video=""`에 경로(`../../assets/video/파일.mp4`)를 적으면 스크린샷 슬라이드 대신 영상이 나옵니다. 20MB 이하 권장.
- **역할 · 소개 문구**: `index.html`의 `.member`, 쇼릴 속 역할은 `reel.js` 맨 위 `CREW`.
- **프로젝트 추가 · 공개**: `index.html`의 `.proj.soon` 카드를 `<a class="proj live" href="projects/<이름>/">`로 바꾸고 `projects/<이름>/index.html`을 만듭니다.
- **스크롤 구간 길이**: 섹션의 `style="--len: 300vh"`.

## 도메인

Settings → Pages → Custom domain 에 `nalenc.kr`. DNS(등록 업체): A 레코드 4개 `185.199.108.153` `185.199.109.153` `185.199.110.153` `185.199.111.153`, `www` CNAME → `yong-seob-lee.github.io`.
