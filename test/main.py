from fastapi import FastAPI
import uvicorn

# FastAPI 앱 생성
app = FastAPI()

# 1. 메인 화면 (http://localhost:8000)
@app.get("/")
def read_root():
    return {"status": "running", "message": "서버가 성공적으로 실행되었습니다!"}

# 2. 이름 인사하기 (http://localhost:8000/hello/이름)
@app.get("/hello/{name}")
def say_hello(name: str):
    return {"message": f"반갑습니다, {name}님!"}

# 3. 간단한 덧셈 (http://localhost:8000/add?num1=10&num2=20)
@app.get("/add")
def add(num1: int, num2: int):
    return {"result": num1 + num2}

# 파이썬으로 직접 실행할 때 필요한 코드
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
