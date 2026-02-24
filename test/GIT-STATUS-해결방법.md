# git status "untracked files" 해결 방법

`git status`에서 `../vercel.json`, `../untitled.ows` 같은 **추적되지 않은 파일**이 많이 나오는 이유는, **저장소 루트가 상위 폴더(Desktop)** 이기 때문입니다.  
아래 순서대로 하면 정리할 수 있습니다.

---

## 1단계: 상위 폴더(Desktop)에 .gitignore 만들기

1. **메모장**이나 Cursor에서 **새 파일**을 엽니다.
2. `gitignore-root.txt` 파일을 열어 **그 안의 내용**(`*.ows`부터 마지막 줄까지)을 **복사**합니다.
3. **다른 이름으로 저장**에서 아래처럼 설정합니다.
   - 위치: `C:\Users\Admin\Desktop`
   - 파일 이름: `.gitignore` (앞에 점 꼭 붙이기)
   - 파일 형식: **모든 파일 (*.*)**
4. 저장합니다.

이렇게 하면 한글 문서, csv, ows, 이미지 등이 커밋 대상에서 빠집니다.

---

## 2단계: 터미널에서 대시보드만 추가하고 커밋

**PowerShell**을 열고 다음을 순서대로 실행하세요.

```powershell
# 1) 저장소 루트(Desktop)로 이동
cd C:\Users\Admin\Desktop

# 2) 방금 만든 .gitignore 추가
git add .gitignore

# 3) 대시보드 관련만 추가 (test 폴더 전체)
git add test

# 4) 상태 확인 (불필요한 파일은 더 이상 안 나와야 함)
git status

# 5) 커밋
git commit -m "대시보드 최신 코드 및 .gitignore 추가"

# 6) GitHub에 push (이미 remote가 있다면)
git push origin main
```

`git status`를 다시 실행하면, 이전에 보이던 `../untitled.ows`, `../vercel.json` 같은 항목들은 .gitignore 때문에 목록에서 사라지고, **test 폴더와 .gitignore만** 보일 것입니다.

---

## 요약

- **원인**: 저장소가 `Desktop`이라서, Desktop에 있는 여러 파일이 전부 "추적 안 됨"으로 나옴.
- **해결**: Desktop에 `.gitignore`를 만들어서 대시보드와 무관한 파일을 무시하고, `git add .gitignore` + `git add test` 로 필요한 것만 커밋.

이후에는 `git status`가 훨씬 단순하게 나올 것입니다.
