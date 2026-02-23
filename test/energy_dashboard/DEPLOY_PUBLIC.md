# 대시보드를 언제 어디서든 접속 가능하게 만들기

**제약 없이** 주소만 입력하면 접속할 수 있도록 만드는 방법입니다.

---

## ★ 추천: Netlify Drop (영구 배포, 가입 불필요)

**한 번만** 배포하면 **PC를 꺼도, 24시간, 어디서든** 접속 가능합니다.

### 1. 배포 실행

```
test 폴더에서 netlify-upload.bat 더블클릭
```

### 2. 자동으로 열리는 화면

- **Netlify Drop 페이지** (브라우저)
- **ZIP 파일이 선택된 탐색기**

### 3. 드래그만 하면 됨

- `energy_dashboard_netlify.zip` 파일을 Netlify 화면에 **드래그해서 놓기**
- 배포 완료 후 나오는 `https://xxxx.netlify.app` 주소가 **영구 주소**
- 계정 가입 없이 사용 가능

---

## 방법 2: localtunnel (임시, PC 켜져 있어야 함)

PC에서 대시보드를 켜둔 상태로 **임시 공개 URL**을 만듭니다. **계정 가입 불필요**.

### 실행

```batch
# test 폴더에서 share-dashboard.bat 더블클릭
```

또는 수동:

```powershell
cd c:\Users\Admin\Desktop\test

# 1) 로컬 서버 실행 (새 터미널)
npx serve energy_dashboard -p 3333

# 2) 공개 URL 생성 (또 다른 터미널)
npx localtunnel --port 3333
```

### 결과

- `your url is: https://xxxx.loca.lt` 주소를 복사해서 공유
- 이 주소로 모바일, 다른 PC 등 어디서든 접속 가능
- **참고**: 처음 접속 시 "Click to Continue" 버튼 한 번 눌러야 할 수 있음
- **주의**: PC를 끄면 접속 불가 (임시용)

---

## 방법 3: GitHub Pages (무료, 영구 URL, Git 필요)

GitHub에 올려서 **영구적인 공개 주소**를 만듭니다.

### 1단계: GitHub 저장소 생성

1. https://github.com/new 접속
2. 저장소 이름 입력 (예: `energy-dashboard`)
3. Public 선택 → Create repository

### 2단계: 대시보드 업로드

**방법 A - 웹에서 직접 업로드**

1. 새 저장소 페이지에서 **Add file** → **Upload files**
2. `energy_dashboard` 폴더 안의 파일들 드래그:
   - `index.html`
   - `app.js`
   - `style.css`
3. Commit changes

**방법 B - Git 명령어**

```powershell
cd c:\Users\Admin\Desktop\test

git init
git add energy_dashboard/
git commit -m "Add dashboard"
git branch -M main
git remote add origin https://github.com/내아이디/energy-dashboard.git
git push -u origin main
```

### 3단계: GitHub Pages 활성화

1. 저장소 → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / folder: `/` 또는 `/(root)`
4. 저장소 루트에 `index.html`이 있어야 함

**폴더 구조가 중요합니다.** `energy_dashboard` 내용이 **저장소 루트**에 있어야 합니다.

- 올바른 예: 저장소 루트에 `index.html`, `app.js`, `style.css` 있음
- 잘못된 예: `energy_dashboard/index.html` 안에만 있음

루트에 넣으려면 `energy_dashboard` **안의 파일들만** 업로드하세요.

### 4단계: 공개 주소 확인

몇 분 후 다음 주소로 접속됩니다:

```
https://내아이디.github.io/energy-dashboard/
```

