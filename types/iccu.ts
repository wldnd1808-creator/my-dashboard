export interface IccuRow {
  차량ID: string;
  모델명: string;
  생산일자: string;
  "주행거리(km)": number;
  고장발생여부: string;
  협력사: string;
  "고장코드(DTC)": string;
  수리비용: number;
  외기온도: number;
  고장: boolean;
  생산월: string;
}
